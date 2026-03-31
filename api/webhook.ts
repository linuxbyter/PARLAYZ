import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KOTANI_SECRET = process.env.KOTANI_WEBHOOK_SECRET || process.env.KOTANI_SECRET;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  console.log('🔔 Kotani webhook received:', JSON.stringify(req.body, null, 2));

  // 1. Verify signature if secret is configured
  if (KOTANI_SECRET) {
    const signature = req.headers['x-kotani-signature'] || req.headers['x-signature'];
    if (signature) {
      const hmac = crypto.createHmac('sha256', KOTANI_SECRET);
      hmac.update(JSON.stringify(req.body));
      const expectedSignature = hmac.digest('hex');
      if (signature !== expectedSignature) {
        console.error('❌ Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }
  }

  const payload = req.body;
  const { user_id, amount, id: gateway_ref, status, currency, type } = payload;

  // 2. Handle completed deposits
  if (status === 'completed' || status === 'success' || payload.event === 'deposit.completed') {
    const depositAmount = parseFloat(amount || payload.amount_usdt || payload.amount || '0');
    const userId = user_id || payload.metadata?.user_id || payload.integrator_ref;

    if (!userId) {
      console.error('❌ No user_id in webhook payload');
      return res.status(400).json({ error: 'Missing user_id' });
    }

    // Determine if this is a USDT deposit or KSh deposit
    const isUSDT = currency === 'USDT' || type === 'onramp' || payload.asset === 'USDT';

    if (isUSDT) {
      // Credit USDT balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('usdt_balance')
        .eq('id', userId)
        .single();

      const currentUSDT = profile?.usdt_balance || 0;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ usdt_balance: currentUSDT + depositAmount })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update USDT balance:', updateError);
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      console.log(`✅ Credited ${depositAmount} USDT to user ${userId}`);
    } else {
      // Credit KSh balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', userId)
        .single();

      const currentKSh = profile?.wallet_balance || 0;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: currentKSh + depositAmount })
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Failed to update KSh balance:', updateError);
        return res.status(500).json({ error: 'Failed to update balance' });
      }

      console.log(`✅ Credited ${depositAmount} KSh to user ${userId}`);
    }

    // 3. Log transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: depositAmount,
      currency: isUSDT ? 'USDT' : 'KSh',
      gateway: 'kotani',
      gateway_ref: gateway_ref || payload.checkout_request_id || payload.transaction_id,
      status: 'completed',
      type: isUSDT ? 'usdt_deposit' : 'deposit'
    });

    if (txError) {
      console.error('⚠️ Failed to log transaction:', txError);
    }

    // 4. Send notification
    await supabase.from('notifications').insert({
      user_id: userId,
      message: isUSDT 
        ? `✅ ${depositAmount} USDT deposited successfully via Kotani Pay`
        : `✅ ${depositAmount.toLocaleString()} KSh deposited successfully`,
      type: 'deposit',
      is_read: false
    });

    return res.status(200).json({ received: true, credited: depositAmount });
  }

  // Handle failed/cancelled payments
  if (status === 'failed' || status === 'cancelled' || payload.event === 'deposit.failed') {
    const userId = user_id || payload.metadata?.user_id;
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        message: '❌ Payment failed or was cancelled',
        type: 'deposit_failed',
        is_read: false
      });
    }
    return res.status(200).json({ received: true });
  }

  // Unknown status
  console.log('⚠️ Unhandled webhook status:', status);
  return res.status(200).json({ received: true });
}

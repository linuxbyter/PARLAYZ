import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// God Mode Client: Bypasses RLS to update balances safely
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { state, amount, customer_phone } = req.body;

  // 'COMPLETE' means the user entered their PIN and the cash is yours
  if (state === 'COMPLETE') {
    // 1. Find user by phone (Matches the 'phone_number' column we added)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, wallet_balance')
      .eq('phone_number', customer_phone)
      .single();

    if (profile) {
      // 2. Add the cash
      await supabase.from('profiles')
        .update({ wallet_balance: profile.wallet_balance + Number(amount) })
        .eq('id', profile.id);

      // 3. Notify them
      await supabase.from('notifications').insert({
        user_id: profile.id,
        message: `💰 Deposit Successful! ${amount} KSh added to your wallet.`,
        type: 'deposit'
      });
    }
  }

  return res.status(200).json({ status: 'ok' });
}
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// We use the Service Role Key because the webhook needs to bypass RLS 
// to give the user their money without them being "logged in" to this specific script.
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests from Intasend
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Intasend sends the payment data in the body
  const { state, amount, customer_phone } = req.body;

  // State 'COMPLETE' means the cash is officially in your account
  if (state === 'COMPLETE') {
    console.log(`✅ Payment received: ${amount} KSh from ${customer_phone}`);

    // 1. Find the user by their phone number
    const { data: profile, error: findError } = await supabase
      .from('profiles')
      .select('id, wallet_balance')
      .eq('phone_number', customer_phone)
      .single();

    if (profile && !findError) {
      // 2. Add the money to their wallet
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: profile.wallet_balance + Number(amount) })
        .eq('id', profile.id);

      if (!updateError) {
        // 3. Send them a notification so they see it in the UI immediately
        await supabase.from('notifications').insert({
          user_id: profile.id,
          message: `💰 Deposit Successful! ${amount} KSh has been added to your wallet.`,
          type: 'deposit'
        });
      }
    } else {
      console.error("❌ Could not find user with phone:", customer_phone);
    }
  }

  // Always respond with 200 so Intasend knows you got the message
  return res.status(200).json({ status: 'ok' });
}
// api/webhook/kotani.ts
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Kotani secret
const KOTANI_SECRET = process.env.KOTANI_SECRET;

export default async function handler(req, res) {
  // 1. Verify signature (Kotani sends this header)
  const signature = req.headers['x-kotani-signature'];
  const hmac = crypto.createHmac('sha256', KOTANI_SECRET);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Process payment
  const { user_id, amount, id: gateway_ref, status } = req.body;

  if (status === 'completed') {
    // Credit user balance
    await supabase
      .from('profiles')
      .update({ balance_sats: amount })
      .eq('id', user_id);

    // Log transaction
    await supabase.from('transactions').insert({
      user_id,
      amount,
      gateway: 'kotani',
      gateway_ref,
      status
    });
  }

  res.status(200).json({ received: true });
}

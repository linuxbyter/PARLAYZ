import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { amount, phone, userId, username } = req.body;

  if (!amount || !phone || !userId) {
    return res.status(400).json({ message: 'Amount, phone, and userId are required' });
  }

  let formattedPhone = phone;
  if (phone.startsWith('0')) {
    formattedPhone = '254' + phone.substring(1);
  } else if (phone.startsWith('+')) {
    formattedPhone = phone.substring(1);
  }

  try {
    const response = await fetch('https://sandbox.kotanipay.com/api/v1/onramp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KOTANI_API_KEY}`,
        'X-Client-ID': process.env.KOTANI_CLIENT_ID || ''
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        phone_number: formattedPhone,
        currency: 'USDT',
        network: 'polygon',
        user_id: userId,
        metadata: {
          username: username || 'Parlayz User',
          platform: 'parlayz'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Kotani API Error:', data);
      return res.status(response.status).json({ 
        success: false, 
        message: data.message || 'Kotani API rejected the request' 
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('Kotani Deposit Error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}

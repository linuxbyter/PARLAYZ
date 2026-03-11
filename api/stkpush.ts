import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  let { amount, phone, email } = req.body;

  if (!amount || !phone) {
    return res.status(400).json({ message: 'Amount and Phone Number are required' });
  }

  // 🔥 THE FIX: Convert 07... to 2547... automatically
  if (phone.startsWith('0')) {
    phone = '254' + phone.substring(1);
  } else if (phone.startsWith('+')) {
    phone = phone.substring(1);
  }

  try {
    const response = await fetch("https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTASEND_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount,
        phone_number: phone,
        email: email || "trader@parlayz.app" 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // 🔥 THE FIX: Log the EXACT error from IntaSend to Vercel
      console.error("IntaSend API Rejected the Request:", data);
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("STK Push Code Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

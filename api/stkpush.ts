import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { amount, phone, email } = req.body;

  // Validate inputs
  if (!amount || !phone) {
    return res.status(400).json({ message: 'Amount and Phone Number are required' });
  }

  try {
    const response = await fetch("https://payment.intasend.com/api/v1/payment/mpesa-stk-push/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INTASEND_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount: amount,
        phone_number: phone,
        // Intasend requires an email, we can use a fallback if user doesn't have one
        email: email || "trader@parlayz.app" 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (error: any) {
    console.error("STK Push Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

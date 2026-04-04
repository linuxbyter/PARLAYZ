import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KOTANI_API_KEY = process.env.NEXT_PUBLIC_KOTANI_API_KEY
const KOTANI_API_SECRET = process.env.KOTANI_API_SECRET
const KOTANI_BASE_URL = 'https://api.kotanipay.com/api/v3'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, phone, userId, username, method } = body

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum deposit is 1 USDT' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const payload: Record<string, any> = {
      amount: parseFloat(amount),
      currency: 'USDT',
      network: 'base',
      user_id: userId,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/kotani`,
      metadata: { username: username || 'Parlayz User', platform: 'parlayz' },
    }

    if (method === 'mpesa') payload.phone = phone
    else if (method === 'card') {
      payload.card_number = body.cardNumber
      payload.card_expiry = body.cardExpiry
      payload.card_cvv = body.cardCvv
    } else if (method === 'bank') {
      payload.account_number = body.accountNumber
      payload.bank_name = body.bankName
    }

    // Try x-api-key header first
    const kotaniRes = await fetch(`${KOTANI_BASE_URL}/deposit/bank/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KOTANI_API_KEY!,
        'x-api-secret': KOTANI_API_SECRET!,
      },
      body: JSON.stringify(payload),
    })

    // If 401, try Bearer token
    let kotaniData = await kotaniRes.json()
    if (kotaniRes.status === 401) {
      const retryRes = await fetch(`${KOTANI_BASE_URL}/deposit/bank/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KOTANI_API_KEY}`,
          'x-api-secret': KOTANI_API_SECRET!,
        },
        body: JSON.stringify(payload),
      })
      kotaniData = await retryRes.json()
      if (!retryRes.ok) {
        console.error('Kotani API error (Bearer):', kotaniData)
        return NextResponse.json(
          { error: kotaniData.message || kotaniData.error || 'Kotani API error' },
          { status: retryRes.status }
        )
      }
    } else if (!kotaniRes.ok) {
      console.error('Kotani API error (x-api-key):', kotaniData)
      return NextResponse.json(
        { error: kotaniData.message || kotaniData.error || 'Kotani API error' },
        { status: kotaniRes.status }
      )
    }

    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'USDT',
      network: 'base',
      gateway: 'kotani',
      gateway_ref: kotaniData.data?.checkout_id || kotaniData.data?.id || kotaniData.data?.reference,
      status: 'pending',
      type: 'onramp',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      checkout_url: kotaniData.data?.checkout_url || kotaniData.data?.url,
      checkout_id: kotaniData.data?.checkout_id || kotaniData.data?.id,
      message: 'Checkout created.',
    })
  } catch (error) {
    console.error('Kotani deposit error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}

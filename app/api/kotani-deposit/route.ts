import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KOTANI_API_KEY = process.env.NEXT_PUBLIC_KOTANI_API_KEY
const KOTANI_API_SECRET = process.env.KOTANI_API_SECRET
const KOTANI_BASE_URL = 'https://api.kotanipay.com/v1'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, phone, userId, username } = body

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum deposit is 1 USDT' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Create Kotani checkout request
    const kotaniRes = await fetch(`${KOTANI_BASE_URL}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': KOTANI_API_KEY!,
        'x-api-secret': KOTANI_API_SECRET!,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        currency: 'USDT',
        network: 'base',
        phone: phone,
        user_id: userId,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/kotani`,
        metadata: {
          username: username || 'Parlayz User',
          platform: 'parlayz',
        },
      }),
    })

    const kotaniData = await kotaniRes.json()

    if (!kotaniRes.ok) {
      console.error('Kotani API error:', kotaniData)
      return NextResponse.json(
        { error: kotaniData.message || 'Kotani API error' },
        { status: kotaniRes.status }
      )
    }

    // Log deposit in Supabase
    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'USDT',
      network: 'base',
      gateway: 'kotani',
      gateway_ref: kotaniData.data?.checkout_id || kotaniData.data?.id,
      status: 'pending',
      type: 'onramp',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      checkout_url: kotaniData.data?.checkout_url,
      checkout_id: kotaniData.data?.checkout_id || kotaniData.data?.id,
      message: 'Checkout created. User will receive M-Pesa prompt.',
    })
  } catch (error) {
    console.error('Kotani deposit error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    )
  }
}

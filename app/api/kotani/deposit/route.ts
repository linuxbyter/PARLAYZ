import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// NO NEXT_PUBLIC_ — server only
const KOTANI_API_KEY = process.env.KOTANI_API_KEY
const KOTANI_BASE_URL = 'https://sandbox-api.kotanipay.io'

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

    const externalId = `deposit_${userId}_${Date.now()}`

    // Correct Kotani endpoint — STK push
    const kotaniRes = await fetch(`${KOTANI_BASE_URL}/api_v2/transactions/deposit/stkpush`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KOTANI_API_KEY}`,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        phoneNumber: phone.startsWith('+') ? phone.slice(1) : phone,
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/kotani`,
        externalId,
      }),
    })

    const kotaniData = await kotaniRes.json()

    if (!kotaniRes.ok) {
      console.error('Kotani deposit error:', kotaniData)
      return NextResponse.json(
        { error: kotaniData.message || 'Kotani API error' },
        { status: kotaniRes.status }
      )
    }

    // Log to Supabase as pending
    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'KES',
      gateway: 'kotani',
      gateway_ref: externalId,
      kotani_request_id: kotaniData.result?.requestId || null,
      status: 'pending',
      type: 'deposit',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'STK push sent. Check your phone to confirm payment.',
      externalId,
    })

  } catch (error) {
    console.error('Kotani deposit error:', error)
    return NextResponse.json({ error: 'Failed to initiate deposit' }, { status: 500 })
  }
}

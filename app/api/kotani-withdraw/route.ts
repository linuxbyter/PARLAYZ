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
    const { amount, phone, userId } = body

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Minimum withdrawal is 1 USDT' }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check user balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('usdt_balance')
      .eq('id', userId)
      .single()

    if (!profile || profile.usdt_balance < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Kotani withdrawal via M-Pesa
    const kotaniRes = await fetch(`${KOTANI_BASE_URL}/withdraw`, {
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
      }),
    })

    const kotaniData = await kotaniRes.json()

    if (!kotaniRes.ok) {
      console.error('Kotani withdraw error:', kotaniData)
      return NextResponse.json(
        { error: kotaniData.message || kotaniData.error || 'Withdrawal failed' },
        { status: kotaniRes.status }
      )
    }

    // Deduct from user balance
    await supabase
      .from('profiles')
      .update({ usdt_balance: profile.usdt_balance - amount })
      .eq('id', userId)

    // Log withdrawal
    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'USDT',
      network: 'base',
      gateway: 'kotani',
      gateway_ref: kotaniData.data?.id || kotaniData.data?.reference,
      status: 'pending',
      type: 'withdrawal',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated. Funds will arrive in M-Pesa shortly.',
    })
  } catch (error) {
    console.error('Kotani withdraw error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KOTANI_API_KEY = process.env.KOTANI_API_KEY
const KOTANI_BASE_URL = 'https://sandbox-api.kotanipay.io'

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

    // Check balance first
    const { data: profile } = await supabase
      .from('profiles')
      .select('usdt_balance')
      .eq('id', userId)
      .single()

    if (!profile || profile.usdt_balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const externalId = `withdraw_${userId}_${Date.now()}`

    // Correct Kotani endpoint — momo withdrawal
    const kotaniRes = await fetch(`${KOTANI_BASE_URL}/api_v2/transactions/withdraw/momo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KOTANI_API_KEY}`,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        phoneNumber: parseInt(phone.startsWith('+') ? phone.slice(1) : phone),
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/kotani`,
        externalId,
      }),
    })

    const kotaniData = await kotaniRes.json()

    if (!kotaniRes.ok) {
      console.error('Kotani withdraw error:', kotaniData)
      return NextResponse.json(
        { error: kotaniData.message || 'Withdrawal failed' },
        { status: kotaniRes.status }
      )
    }

    // Deduct balance AFTER Kotani confirms the request
    await supabase
      .from('profiles')
      .update({ usdt_balance: profile.usdt_balance - amount })
      .eq('id', userId)

    // Log withdrawal
    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'KES',
      gateway: 'kotani',
      gateway_ref: externalId,
      status: 'pending',
      type: 'withdrawal',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal initiated. Funds will arrive on M-Pesa shortly.',
    })

  } catch (error) {
    console.error('Kotani withdraw error:', error)
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}

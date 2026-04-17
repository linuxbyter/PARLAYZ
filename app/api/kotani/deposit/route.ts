import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KOTANI_API_KEY = process.env.KOTANI_API_KEY
const KOTANI_BASE_URL = 'https://sandbox-api.kotanipay.io'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const kotaniFetch = (path: string, method: string, body?: object) =>
  fetch(`${KOTANI_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KOTANI_API_KEY}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

export async function POST(req: NextRequest) {
  try {
    const { amount, phone, userId } = await req.json()

    if (!amount || amount < 1)
      return NextResponse.json({ error: 'Minimum deposit is 1 USDT' }, { status: 400 })
    if (!phone)
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    if (!userId)
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    // Format phone — Kotani v3 wants +254... format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone.replace(/^0/, '254')}`

    // Step 1 — get or create Kotani customer_key for this user
    let customer_key: string

    const { data: profile } = await supabase
      .from('profiles')
      .select('kotani_customer_key')
      .eq('id', userId)
      .single()

    if (profile?.kotani_customer_key) {
      customer_key = profile.kotani_customer_key
    } else {
      // Create customer in Kotani
      const customerRes = await kotaniFetch('/api/v3/customer/mobile-money', 'POST', {
        phone_number: formattedPhone,
        country_code: 'KE',
        network: 'MPESA',
        account_name: userId,
      })
      const customerData = await customerRes.json()

      if (!customerRes.ok) {
        console.error('Kotani create customer error:', customerData)
        return NextResponse.json(
          { error: customerData.message || 'Failed to create Kotani customer' },
          { status: customerRes.status }
        )
      }

      customer_key = customerData.data?.customer_key || customerData.data?.id
      
      // Save customer_key to profile so we don't recreate next time
      await supabase
        .from('profiles')
        .update({ kotani_customer_key: customer_key })
        .eq('id', userId)
    }

    // Step 2 — get or create Parlayz KES fiat wallet
    let wallet_id = process.env.KOTANI_WALLET_ID

    if (!wallet_id) {
      const walletRes = await kotaniFetch('/api/v3/wallet/fiat', 'POST', {
        name: 'Parlayz KES Wallet',
        currency: 'KES',
      })
      const walletData = await walletRes.json()

      if (!walletRes.ok) {
        console.error('Kotani create wallet error:', walletData)
        return NextResponse.json(
          { error: walletData.message || 'Failed to create wallet' },
          { status: walletRes.status }
        )
      }

      wallet_id = walletData.data?.wallet_id || walletData.data?.id
      // Log it so you can hardcode it in .env after first run
      console.log('🔑 KOTANI_WALLET_ID:', wallet_id)
    }

    // Step 3 — trigger STK push deposit
    const reference_id = `deposit_${userId}_${Date.now()}`

    const depositRes = await kotaniFetch('/api/v3/deposit/mobile-money', 'POST', {
      customer_key,
      amount: parseFloat(amount),
      wallet_id,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/kotani`,
      reference_id,
    })

    const depositData = await depositRes.json()

    if (!depositRes.ok) {
      console.error('Kotani deposit error:', depositData)
      return NextResponse.json(
        { error: depositData.message || 'Deposit failed' },
        { status: depositRes.status }
      )
    }

    // Log to Supabase
    await supabase.from('deposits').insert({
      user_id: userId,
      amount: parseFloat(amount),
      currency: 'KES',
      gateway: 'kotani',
      gateway_ref: reference_id,
      status: 'pending',
      type: 'deposit',
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'STK push sent. Check your phone to confirm.',
      reference_id,
    })

  } catch (error) {
    console.error('Kotani deposit error:', error)
    return NextResponse.json({ error: 'Failed to initiate deposit' }, { status: 500 })
  }
}

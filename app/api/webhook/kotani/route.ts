import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return null
  }
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('🔔 Kotani webhook received:', JSON.stringify(body, null, 2))

    const KOTANI_WEBHOOK_SECRET = process.env.KOTANI_WEBHOOK_SECRET
    if (KOTANI_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-kotani-signature') || req.headers.get('x-signature')
      if (signature) {
        const hmac = crypto.createHmac('sha256', KOTANI_WEBHOOK_SECRET)
        hmac.update(JSON.stringify(body))
        const expected = hmac.digest('hex')
        if (signature !== expected) {
          console.error('❌ Invalid webhook signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      }
    }

    const { user_id, amount, id: gateway_ref, status, currency, type, metadata } = body
    const depositAmount = parseFloat(amount || body.amount_usdt || '0')
    const userId = user_id || metadata?.user_id || metadata?.clerk_user_id

    if (!userId) {
      console.error('❌ No user_id in webhook payload')
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (status === 'completed' || status === 'success' || body.event === 'deposit.completed') {
      if (supabase) {
        const { error: txError } = await supabase.from('deposits').insert({
          user_id: userId,
          amount: depositAmount,
          currency: 'USDT',
          network: 'base',
          gateway: 'kotani',
          gateway_ref: gateway_ref || body.checkout_request_id || body.transaction_id,
          status: 'completed',
          type: 'onramp',
          created_at: new Date().toISOString(),
        })

        if (txError) {
          console.error('⚠️ Failed to log deposit:', txError)
        }

        await supabase.from('notifications').insert({
          user_id: userId,
          message: `✅ ${depositAmount} USDT deposited via Kotani Pay. Check your Base wallet.`,
          type: 'deposit',
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }

      console.log(`✅ Logged ${depositAmount} USDT deposit for user ${userId}`)
      return NextResponse.json({ received: true, credited: depositAmount })
    }

    if (status === 'failed' || status === 'cancelled' || body.event === 'deposit.failed') {
      if (supabase) {
        await supabase.from('notifications').insert({
          user_id: userId,
          message: '❌ Payment failed or was cancelled',
          type: 'deposit_failed',
          is_read: false,
          created_at: new Date().toISOString(),
        })
      }
      return NextResponse.json({ received: true })
    }

    console.log('⚠️ Unhandled webhook status:', status)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Kotani webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

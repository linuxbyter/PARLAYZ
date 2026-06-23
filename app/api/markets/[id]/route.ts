import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const marketId = parseInt(params.id)

    if (isNaN(marketId)) {
      return NextResponse.json({ error: 'Invalid market ID' }, { status: 400 })
    }

    return NextResponse.json({
      id: marketId,
      title: 'Will BTC be above $104,000?',
      category: 'Crypto',
      outcomes: ['UP', 'DOWN'],
      closesAt: Math.floor(Date.now() / 1000) + 600,
      resolved: false,
      winningOutcome: 0,
      totalPool: '0',
      isCrypto: true,
      strikePrice: '0',
    })
  } catch (error) {
    console.error('Markets API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const marketId = parseInt(params.id)

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
}

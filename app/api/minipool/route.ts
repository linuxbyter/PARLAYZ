import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  id: string
  userId: string
  username: string
  message: string
  timestamp: number
}

interface MiniPool {
  id: string
  duelId: string
  instrumentId: string
  stake: number
  side: 'UP' | 'DOWN'
  participants: { id: string; username: string; stake: number }[]
  chat: ChatMessage[]
  status: 'open' | 'active' | 'resolved'
  createdAt: number
  lockTime: number
}

const miniPools = new Map<string, MiniPool>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { duelId, instrumentId, creator, creatorUsername, stake, side } = body

    const id = `pool-${duelId}`
    const now = Date.now()
    const lockTime = Math.ceil(now / (10 * 60 * 1000)) * (10 * 60 * 1000) + 5 * 60 * 1000

    const miniPool: MiniPool = {
      id,
      duelId,
      instrumentId,
      stake,
      side,
      participants: [{ id: creator, username: creatorUsername, stake }],
      chat: [],
      status: 'open',
      createdAt: now,
      lockTime,
    }

    miniPools.set(id, miniPool)

    return NextResponse.json({
      success: true,
      miniPool,
      shareUrl: `/duel/${duelId}?pool=${id}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create mini-pool' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const duelId = searchParams.get('duelId')

  if (id) {
    const pool = miniPools.get(id)
    if (!pool) {
      return NextResponse.json({ error: 'Mini-pool not found' }, { status: 404 })
    }
    return NextResponse.json({ miniPool: pool })
  }

  if (duelId) {
    const pool = miniPools.get(`pool-${duelId}`)
    if (!pool) {
      return NextResponse.json({ error: 'Mini-pool not found' }, { status: 404 })
    }
    return NextResponse.json({ miniPool: pool })
  }

  return NextResponse.json({ miniPools: Array.from(miniPools.values()) })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, participant, username, message, stake } = body

    const pool = miniPools.get(id)
    if (!pool) {
      return NextResponse.json({ error: 'Mini-pool not found' }, { status: 404 })
    }

    switch (action) {
      case 'join':
        if (pool.participants.length >= 10) {
          return NextResponse.json({ error: 'Pool is full (max 10)' }, { status: 400 })
        }
        if (pool.participants.some(p => p.id === participant)) {
          return NextResponse.json({ error: 'Already joined' }, { status: 400 })
        }
        pool.participants.push({ id: participant, username, stake: stake || pool.stake })
        if (pool.participants.length >= 2) {
          pool.status = 'active'
        }
        break

      case 'sendMessage':
        const chatMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: participant,
          username,
          message: message.slice(0, 500),
          timestamp: Date.now(),
        }
        pool.chat.push(chatMsg)
        if (pool.chat.length > 100) {
          pool.chat = pool.chat.slice(-100)
        }
        break

      case 'resolve':
        pool.status = 'resolved'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    miniPools.set(id, pool)
    return NextResponse.json({ success: true, miniPool: pool })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update mini-pool' }, { status: 500 })
  }
}

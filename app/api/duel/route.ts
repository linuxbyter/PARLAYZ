import { NextRequest, NextResponse } from 'next/server'

interface Duel {
  id: string
  instrumentId: string
  creator: string
  stake: number
  side: 'UP' | 'DOWN'
  participants: string[]
  status: 'open' | 'filled' | 'resolved'
  createdAt: number
  lockTime: number
  type: 'duel' | 'minipool'
  maxParticipants: number
  chatEnabled: boolean
}

const duels = new Map<string, Duel>()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { instrumentId, creator, stake, side, type = 'duel', maxParticipants = 2 } = body

    if (!instrumentId || !creator || !stake || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const id = `${instrumentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const now = Date.now()
    const lockTime = Math.ceil(now / (10 * 60 * 1000)) * (10 * 60 * 1000) + 5 * 60 * 1000

    const duel: Duel = {
      id,
      instrumentId,
      creator,
      stake,
      side,
      participants: [creator],
      status: type === 'duel' ? 'open' : 'open',
      createdAt: now,
      lockTime,
      type,
      maxParticipants,
      chatEnabled: true,
    }

    duels.set(id, duel)

    return NextResponse.json({
      success: true,
      duel,
      shareUrl: `/duel/${id}`,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create duel' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const instrumentId = searchParams.get('instrumentId')

  if (id) {
    const duel = duels.get(id)
    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
    }
    return NextResponse.json({ duel })
  }

  if (instrumentId) {
    const matchingDuels = Array.from(duels.values()).filter(
      d => d.instrumentId === instrumentId && d.status === 'open'
    )
    return NextResponse.json({ duels: matchingDuels })
  }

  const openDuels = Array.from(duels.values()).filter(d => d.status === 'open')
  return NextResponse.json({ duels: openDuels })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, participant, message } = body

    const duel = duels.get(id)
    if (!duel) {
      return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
    }

    switch (action) {
      case 'join':
        if (duel.participants.length >= duel.maxParticipants) {
          return NextResponse.json({ error: 'Duel is full' }, { status: 400 })
        }
        if (duel.participants.includes(participant)) {
          return NextResponse.json({ error: 'Already joined' }, { status: 400 })
        }
        duel.participants.push(participant)
        if (duel.participants.length >= duel.maxParticipants) {
          duel.status = 'filled'
        }
        break

      case 'leave':
        duel.participants = duel.participants.filter(p => p !== participant)
        break

      case 'resolve':
        duel.status = 'resolved'
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    duels.set(id, duel)
    return NextResponse.json({ success: true, duel })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update duel' }, { status: 500 })
  }
}

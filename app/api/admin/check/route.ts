import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
  const { userId, getToken } = await auth()

  if (!userId) {
    return NextResponse.json({ isAdmin: false }, { status: 401 })
  }

  try {
    const token = await getToken({ template: 'default' })
    const clerkResp = await fetch(
      `https://api.clerk.com/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!clerkResp.ok) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const user = await clerkResp.json()
    const isAdmin = user.public_metadata?.role === 'admin'

    return NextResponse.json({ isAdmin, userId })
  } catch (e) {
    return NextResponse.json({ isAdmin: false }, { status: 500 })
  }
}

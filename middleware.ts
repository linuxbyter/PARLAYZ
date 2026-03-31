import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const secretKey = process.env.CLERK_SECRET_KEY

const hasClerkKeys = publishableKey && publishableKey.startsWith('pk_') && secretKey && secretKey.startsWith('sk_')

const middleware = hasClerkKeys
  ? clerkMiddleware()
  : async () => NextResponse.next()

export default middleware

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}

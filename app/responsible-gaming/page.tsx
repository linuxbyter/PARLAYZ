'use client'

import Header from '@/src/components/Header'
import { Heart, AlertTriangle, Shield } from 'lucide-react'

export default function ResponsibleGamingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-6 h-6 text-[#F0A500]" />
          <h1 className="text-2xl font-bold">Responsible Gaming</h1>
        </div>

        <div className="space-y-8 text-[#8B8B8B]">
          <section className="bg-[#141414] border border-[#222222] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1E3D2F] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#4CAF7D]" />
              </div>
              <h2 className="text-white font-bold text-lg">Our Commitment</h2>
            </div>
            <p>Parlayz is committed to promoting responsible gaming. We believe betting should be entertainment, not a way to make money. We provide tools to help you stay in control.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Warning Signs</h2>
            <p className="mb-3">Please stop and seek help if you experience any of these:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Spending more than you can afford to lose</li>
              <li>Betting to recover previous losses</li>
              <li>Neglecting work or family responsibilities</li>
              <li>Feeling anxious when not betting</li>
              <li>Lying about your betting activity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Self-Exclusion</h2>
            <p>You can voluntarily exclude yourself from Parlayz for a period of your choice. Contact support@parlayz.co.ke to activate self-exclusion. During this period, your account will be suspended and you won&apos;t be able to deposit or bet.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Deposit Limits</h2>
            <p>Set daily, weekly, or monthly deposit limits in your wallet settings. Once reached, you won&apos;t be able to deposit more until the period resets.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Age Verification</h2>
            <p>You must be 18+ to use Parlayz. We reserve the right to request age verification documents. Accounts of anyone under 18 will be closed and deposits refunded.</p>
          </section>

          <section className="bg-[#3D1E1E] border border-[#E05252]/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-[#E05252]" />
              <h2 className="text-white font-bold">Gambling Helpline Kenya</h2>
            </div>
            <p className="text-white">If you or someone you know has a gambling problem, contact:</p>
            <ul className="mt-2 space-y-1 text-white">
              <li>• National Helpline: 1199 (Free)</li>
              <li>• Email: help@betcontrol.go.ke</li>
              <li>• Website: www.betcontrol.go.ke</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  )
}
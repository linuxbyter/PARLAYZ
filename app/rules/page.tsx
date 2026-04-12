'use client'

import Header from '@/src/components/Header'
import { BookOpen, Trophy, AlertCircle, CheckCircle, Clock } from 'lucide-react'

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-6 h-6 text-[#C9A84C]" />
          <h1 className="text-2xl font-bold">Market Rules</h1>
        </div>

        <div className="space-y-8 text-[#8B8B8B]">
          <section>
            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#C9A84C]" />
              How Markets Resolve
            </h2>
            <p className="mb-3">Each market has a clear YES/NO question and a specific resolution time. Markets resolve based on the stated data source:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4CAF7D] mt-1" />
                <span><strong className="text-white">Crypto:</strong> Price from Binance API at resolution time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4CAF7D] mt-1" />
                <span><strong className="text-white">Sports:</strong> Official match results from ESPN/SportRadar</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4CAF7D] mt-1" />
                <span><strong className="text-white">Politics:</strong> Official government announcements or reputable news sources</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#4CAF7D] mt-1" />
                <span><strong className="text-white">Tech:</strong> Official company announcements, earnings reports</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#C9A84C]" />
              Market Phases
            </h2>
            <div className="bg-[#141414] border border-[#222222] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">OPEN</span>
                <span className="text-sm">Betting is active. Place YES or NO bets.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">LOCKED</span>
                <span className="text-sm">Betting closed. Waiting for resolution.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">RESOLVED</span>
                <span className="text-sm">Market settled - winners paid.</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#C9A84C]" />
              Cancellation & Postponement
            </h2>
            <p className="mb-3">If an event is cancelled or postponed:</p>
            <ul className="space-y-2">
              <li><strong className="text-white">Sports:</strong> If match rescheduled within 48h, market resolves on new time. Otherwise, resolves to Fair Market Value (FMV).</li>
              <li><strong className="text-white">Crypto:</strong> Markets never cancel - they resolve at specified time from last available price.</li>
              <li><strong className="text-white">Other:</strong> Resolves to NO unless explicitly stated otherwise in market rules.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Example: Golf Tournament</h2>
            <div className="bg-[#141414] border border-[#222222] rounded-xl p-4">
              <p className="text-white font-medium mb-2">&ldquo;Will John win the Masters?&rdquo;</p>
              <p className="text-sm mb-3">Resolution: YES if player listed as winner on official pgatour.com leaderboard at tournament conclusion.</p>
              <p className="text-sm text-[#E05252]">If tournament cancelled: NO. If player withdraws mid-tournament: YES (if already winning).</p>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Early Exit (Coward Tax)</h2>
            <p>You can sell your position before market resolves. A fee applies:</p>
            <div className="mt-3 bg-[#141414] border border-[#222222] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">During OPEN phase</span>
                <span className="text-[#C9A84C] font-bold">0% fee</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white">During LOCKED phase</span>
                <span className="text-[#C9A84C] font-bold">2% fee</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">During GRACE period</span>
                <span className="text-[#C9A84C] font-bold">5% fee</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Disputes</h2>
            <p>If you believe a market was resolved incorrectly, contact support within 24 hours of resolution with evidence. Our team will review and respond within 48 hours.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
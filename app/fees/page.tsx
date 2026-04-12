'use client'

import Header from '@/src/components/Header'
import { DollarSign, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function FeesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <DollarSign className="w-6 h-6 text-[#F0A500]" />
          <h1 className="text-2xl font-bold">Fees</h1>
        </div>

        <div className="space-y-8 text-[#8B8B8B]">
          <section className="bg-[#141414] border border-[#222222] rounded-xl p-5">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-[#E05252]" />
              Platform Fee
            </h2>
            <p className="mb-3">Parlayz charges a small platform fee on winning bets:</p>
            <div className="bg-[#0a0a0a] rounded-lg p-4 text-center">
              <div className="text-3xl font-black text-[#F0A500]">5%</div>
              <div className="text-sm mt-1">of winnings</div>
            </div>
            <p className="mt-3 text-sm">Example: KSh 1,000 bet at 2x odds wins KSh 2,000. Platform fee = KSh 50. You receive KSh 1,950.</p>
          </section>

          <section className="bg-[#141414] border border-[#222222] rounded-xl p-5">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-[#E05252]" />
              Coward Tax (Early Exit Fee)
            </h2>
            <p className="mb-3">You can exit your position before market resolves. Fee depends on phase:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                <span className="text-white">OPEN phase</span>
                <span className="text-[#4CAF7D] font-bold">0%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                <span className="text-white">LOCKED phase</span>
                <span className="text-[#F0A500] font-bold">2%</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-[#0a0a0a] rounded-lg">
                <span className="text-white">GRACE period</span>
                <span className="text-[#E05252] font-bold">5%</span>
              </div>
            </div>
          </section>

          <section className="bg-[#141414] border border-[#222222] rounded-xl p-5">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <ArrowDownLeft className="w-5 h-5 text-[#F0A500]" />
              M-Pesa Transactions
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white">Deposits</span>
                <span className="text-sm">Free (Parlayz covers SMS cost)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Withdrawals</span>
                <span className="text-sm">KSh 30 per transaction</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Minimum deposit</span>
                <span className="text-sm">KSh 100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Minimum withdrawal</span>
                <span className="text-sm">KSh 100</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">Fee Summary</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#222222]">
                  <th className="text-left py-2 text-[#8B8B8B]">Action</th>
                  <th className="text-right py-2 text-[#8B8B8B]">Fee</th>
                </tr>
              </thead>
              <tbody className="text-[#8B8B8B]">
                <tr className="border-b border-[#222222]">
                  <td className="py-2">Winning bet payout</td>
                  <td className="text-right text-white">5%</td>
                </tr>
                <tr className="border-b border-[#222222]">
                  <td className="py-2">Early exit (OPEN)</td>
                  <td className="text-right text-white">0%</td>
                </tr>
                <tr className="border-b border-[#222222]">
                  <td className="py-2">Early exit (LOCKED)</td>
                  <td className="text-right text-white">2%</td>
                </tr>
                <tr className="border-b border-[#222222]">
                  <td className="py-2">Early exit (GRACE)</td>
                  <td className="text-right text-white">5%</td>
                </tr>
                <tr className="border-b border-[#222222]">
                  <td className="py-2">Withdrawals</td>
                  <td className="text-right text-white">KSh 30</td>
                </tr>
                <tr>
                  <td className="py-2">Deposits</td>
                  <td className="text-right text-[#4CAF7D]">Free</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </div>
  )
}
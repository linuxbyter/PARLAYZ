'use client'

import Header from '@/src/components/Header'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <FileText className="w-6 h-6 text-[#F0A500]" />
          <h1 className="text-2xl font-bold">Terms of Use</h1>
        </div>

        <div className="prose prose-invert prose-gold max-w-none space-y-6 text-[#8B8B8B]">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Parlayz, you accept and agree to be bound by the terms and provision of this agreement.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. Eligibility</h2>
            <p>You must be 18 years or older and a resident of Kenya to use Parlayz. By using this platform, you represent and warrant that you meet these requirements.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Account Registration</h2>
            <p>You agree to provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Deposits and Withdrawals</h2>
            <p>All deposits and withdrawals are processed via M-Pesa. Minimum deposit is KSh 100. Withdrawals are processed within 24 hours to your registered M-Pesa number.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Betting Rules</h2>
            <p>All bets are final once placed. You can exit positions early but will incur a Coward Tax fee. Markets resolve at their specified end time based on the resolution criteria.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Prohibited Activities</h2>
            <p>You may not: (a) use the platform for any illegal purpose, (b) attempt to manipulate market outcomes, (c) create multiple accounts, or (d) share account access.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Limitation of Liability</h2>
            <p>Parlayz is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable for any losses arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">9. Contact</h2>
            <p>For questions about these terms, contact support@parlayz.co.ke</p>
          </section>
        </div>
      </main>
    </div>
  )
}
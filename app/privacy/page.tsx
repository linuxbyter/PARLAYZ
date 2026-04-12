'use client'

import Header from '@/src/components/Header'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-[#F0A500]" />
          <h1 className="text-2xl font-bold">Privacy Policy</h1>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-[#8B8B8B]">
          <section>
            <h2 className="text-white font-bold text-lg mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly (name, phone, email), usage data, and transaction data for M-Pesa deposits and withdrawals.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">2. How We Use Your Information</h2>
            <p>Your information is used to: provide and improve our services, process transactions, communicate with you, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">3. Data Protection</h2>
            <p>We implement appropriate security measures to protect your personal data. M-Pesa transactions are processed through secure Safaricom APIs.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share data with service providers (M-Pesa, cloud hosting) strictly for platform operations.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">5. Your Rights</h2>
            <p>Under Kenyan data protection laws, you have the right to access, correct, or delete your personal data. Contact support@parlayz.co.ke to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">6. Cookies</h2>
            <p>We use essential cookies to maintain your session and preferences. You can disable cookies in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">7. Changes to Policy</h2>
            <p>We may update this policy periodically. We will notify you of material changes via email or platform notice.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-lg mb-3">8. Contact</h2>
            <p>For privacy concerns, contact privacy@parlayz.co.ke</p>
          </section>
        </div>
      </main>
    </div>
  )
}
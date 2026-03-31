'use client'

import Header from '@/src/components/Header'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { useAccount, useBalance } from 'wagmi'
import { base } from 'wagmi/chains'
import { ArrowUpRight, ArrowDownToLine, Wallet, Smartphone, CreditCard, Building2, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useState, useCallback } from 'react'

export const dynamic = 'force-dynamic'

const USDT_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export default function WalletPage() {
  const { user } = useUser()
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({
    address,
    token: USDT_CONTRACT as `0x${string}`,
    chainId: base.id,
  })

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [balanceView, setBalanceView] = useState<'USDT' | 'KSH'>('USDT')
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [depositMessage, setDepositMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const usdtBalance = parseFloat(balance?.formatted || '0')
  const kshRate = 129.5
  const kshBalance = usdtBalance * kshRate

  const displayBalance = balanceView === 'USDT' ? usdtBalance : kshBalance
  const displayCurrency = balanceView

  const copyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [address])

  const openKotaniWidget = () => {
    const widgetUrl = `https://genpay.kotanipay.com?apiKey=${process.env.NEXT_PUBLIC_KOTANI_WIDGET_KEY || ''}&userId=${user?.id || ''}&walletAddress=${address || ''}&defaultCurrency=USDT&network=base&redirectUrl=${encodeURIComponent(window.location.origin)}`
    window.open(widgetUrl, '_blank', 'width=480,height=640,scrollbars=yes')
    setDepositStatus('pending')
    setDepositMessage('Complete payment in the Kotani window. Your USDT will arrive on Base.')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <SignedIn>
          {/* Balance Header */}
          <div className="bg-[#111] border border-[#1F1F1F] rounded-3xl p-6 mb-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#D9C5A0]/5 rounded-full blur-3xl pointer-events-none" />

            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1 relative z-10">
              Your Balance
            </p>

            {/* Balance Toggle */}
            <div className="flex items-center justify-center gap-1 mb-3">
              <button
                onClick={() => setBalanceView('USDT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  balanceView === 'USDT' ? 'bg-[#26a17b] text-white' : 'bg-[#1a1a1a] text-gray-500'
                }`}
              >
                USDT
              </button>
              <button
                onClick={() => setBalanceView('KSH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  balanceView === 'KSH' ? 'bg-[#10b981] text-white' : 'bg-[#1a1a1a] text-gray-500'
                }`}
              >
                KSH
              </button>
            </div>

            <h1 className="text-5xl font-black text-white mb-1 relative z-10 tracking-tight font-mono">
              {displayBalance.toFixed(2)}
            </h1>
            <p className="text-sm text-gray-500 font-bold relative z-10">
              {displayCurrency}
              {balanceView === 'USDT' && (
                <span className="ml-2 text-xs text-gray-600">≈ {kshBalance.toFixed(0)} KSH</span>
              )}
              {balanceView === 'KSH' && (
                <span className="ml-2 text-xs text-gray-600">≈ {usdtBalance.toFixed(2)} USDT</span>
              )}
            </p>

            {/* Wallet Address */}
            {address && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="text-xs font-mono text-gray-500 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-[#1F1F1F]">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </span>
                <button onClick={copyAddress} className="text-gray-500 hover:text-[#D9C5A0] transition">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button
              onClick={() => { setShowDepositModal(true); setDepositStatus('idle'); setDepositMessage('') }}
              className="bg-[#26a17b] hover:bg-[#1e8c6b] text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              <ArrowUpRight className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-[#111] border border-[#1F1F1F] hover:border-[#D9C5A0]/50 text-white font-bold py-4 rounded-2xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Withdraw
            </button>
          </div>

          {/* Network Info */}
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-sm font-black text-blue-400">B</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Network</p>
                <p className="text-sm font-bold text-white">Base L2</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400 font-bold">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </SignedIn>

        <SignedOut>
          <div className="text-center py-20">
            <Wallet className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">Connect to view wallet</h2>
            <p className="text-gray-400 mb-6">Sign in and connect your Base wallet to manage funds.</p>
            <SignInButton mode="modal">
              <button className="bg-[#D9C5A0] text-black font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#c4b18f] transition">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-[#151515] border border-[#1F1F1F] rounded-3xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDepositModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>

            <h3 className="text-xl font-black text-white mb-1">Deposit USDT</h3>
            <p className="text-sm text-gray-400 mb-6">Pay with fiat. USDT arrives on your Base wallet via Kotani.</p>

            {depositStatus === 'idle' && (
              <div className="space-y-3">
                <button
                  onClick={openKotaniWidget}
                  className="w-full flex items-center gap-4 bg-[#0a0a0a] border border-[#1F1F1F] hover:border-[#10b981]/50 rounded-2xl p-4 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Mobile Money</p>
                    <p className="text-xs text-gray-500">M-Pesa, Airtel Money</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-[#D9C5A0] transition" />
                </button>

                <button
                  onClick={openKotaniWidget}
                  className="w-full flex items-center gap-4 bg-[#0a0a0a] border border-[#1F1F1F] hover:border-[#10b981]/50 rounded-2xl p-4 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Bank Card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-[#D9C5A0] transition" />
                </button>

                <button
                  onClick={openKotaniWidget}
                  className="w-full flex items-center gap-4 bg-[#0a0a0a] border border-[#1F1F1F] hover:border-[#10b981]/50 rounded-2xl p-4 transition group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Bank Transfer</p>
                    <p className="text-xs text-gray-500">Wire, RTGS</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 ml-auto group-hover:text-[#D9C5A0] transition" />
                </button>
              </div>
            )}

            {depositStatus === 'pending' && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-yellow-400 mb-1">Payment Pending</p>
                <p className="text-xs text-gray-400">{depositMessage}</p>
              </div>
            )}

            {depositStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-green-400 mb-1">Deposit Confirmed</p>
                <p className="text-xs text-gray-400">USDT credited to your Base wallet.</p>
              </div>
            )}

            {depositStatus === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-red-400 mb-1">Payment Failed</p>
                <p className="text-xs text-gray-400">{depositMessage}</p>
              </div>
            )}

            <p className="text-[9px] text-gray-600 text-center mt-4">
              Powered by Kotani Pay • Non-custodial • Base L2
            </p>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowWithdrawModal(false)}>
          <div className="bg-[#151515] border border-[#1F1F1F] rounded-3xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>

            <h3 className="text-xl font-black text-white mb-1">Withdraw USDT</h3>
            <p className="text-sm text-gray-400 mb-6">Cash out to M-Pesa via Kotani off-ramp.</p>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-4">
              <p className="text-xs text-yellow-400 font-bold">Coming Soon</p>
              <p className="text-xs text-gray-400 mt-1">Off-ramp integration with Kotani Pay is in progress. You can withdraw USDT directly to an external wallet for now.</p>
            </div>

            <button
              onClick={() => {
                window.open(`https://basescan.org/address/${address}`, '_blank')
              }}
              className="w-full bg-[#111] border border-[#1F1F1F] hover:border-[#D9C5A0]/50 text-white font-bold py-3 rounded-xl transition text-sm"
            >
              View on BaseScan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

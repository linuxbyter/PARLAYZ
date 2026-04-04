'use client'

import Header from '@/src/components/Header'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { useAccount, useBalance } from 'wagmi'
import { base } from 'wagmi/chains'
import { useWallet, useCurrency } from '@/src/hooks/useWallet'
import { ArrowUpRight, ArrowDownToLine, Wallet, Smartphone, CreditCard, Building2, Copy, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { useState, useCallback } from 'react'

export const dynamic = 'force-dynamic'

const USDT_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

export default function WalletPage() {
  const { user } = useUser()
  const { address, isConnected } = useAccount()
  const { data: balance, refetch } = useBalance({
    address,
    token: USDT_CONTRACT as `0x${string}`,
    chainId: base.id,
  })

  const appWallet = useWallet()
  const { currency, displaySymbol } = useCurrency()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [depositStatus, setDepositStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [depositMessage, setDepositMessage] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [copied, setCopied] = useState(false)

  const onChainBalance = parseFloat(balance?.formatted || '0')
  const totalBalance = appWallet.balance + onChainBalance

  const copyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [address])

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 1) {
      setDepositMessage('Minimum deposit is 1 USDT')
      setDepositStatus('error')
      return
    }
    if (!depositPhone) {
      setDepositMessage('Enter your M-Pesa phone number')
      setDepositStatus('error')
      return
    }

    setDepositStatus('processing')
    setDepositMessage('Creating checkout...')

    try {
      const res = await fetch('/api/kotani-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone: depositPhone,
          userId: user?.id,
          username: user?.username || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Parlayz User',
        }),
      })

      const data = await res.json()

      if (data.success) {
        setDepositStatus('success')
        setDepositMessage(`${amount} USDT checkout created! Check your phone for M-Pesa prompt.`)
        setDepositAmount('')
        setDepositPhone('')
        appWallet.addBalance(amount)

        // Open Kotani checkout URL if provided
        if (data.checkout_url) {
          window.open(data.checkout_url, '_blank', 'width=480,height=640')
        }
      } else {
        setDepositStatus('error')
        setDepositMessage(data.error || 'Deposit failed')
      }
    } catch (error) {
      console.error('Deposit error:', error)
      setDepositStatus('error')
      setDepositMessage('Network error. Try again.')
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <SignedIn>
          {/* Balance Header */}
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl p-6 mb-4 text-center">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Total Balance</p>
            <h1 className="text-4xl font-black font-mono text-white mb-1">
              {displaySymbol}{totalBalance.toFixed(currency === 'KSH' ? 0 : 2)}
            </h1>
            <p className="text-xs text-gray-500">
              {currency} • On-chain: {onChainBalance.toFixed(4)} USDT
            </p>

            {address && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-xs font-mono text-gray-500 bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-[#1F1F1F]">
                  {address.slice(0, 8)}...{address.slice(-6)}
                </span>
                <button onClick={copyAddress} className="text-gray-500 hover:text-[#C5A059] transition">
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => refetch()} className="text-gray-500 hover:text-[#C5A059] transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => { setShowDepositModal(true); setDepositStatus('idle'); setDepositMessage('') }}
              className="bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider hover:opacity-90"
            >
              <ArrowUpRight className="w-4 h-4" />
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-[#111] border border-[#1F1F1F] hover:border-[#C5A059]/50 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Withdraw
            </button>
          </div>

          {/* Network Info */}
          <div className="bg-[#111] border border-[#1F1F1F] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C5A059]/20 flex items-center justify-center">
                <span className="text-sm font-black text-[#C5A059]">B</span>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Network</p>
                <p className="text-sm font-bold text-white">Base L2</p>
              </div>
              <div className="ml-auto">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#C5A059] animate-pulse" />
                  <span className="text-xs text-[#C5A059] font-bold">Connected</span>
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
              <button className="bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDepositModal(false)}>
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDepositModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>

            <h3 className="text-lg font-black text-white mb-1">Deposit USDT</h3>
            <p className="text-sm text-gray-400 mb-4">Powered by Kotani Pay • M-Pesa, Card, Bank</p>

            {depositStatus === 'idle' && (
              <div className="space-y-4">
                {/* Phone Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">M-Pesa Phone</label>
                  <input
                    type="tel"
                    placeholder="0712345678"
                    value={depositPhone}
                    onChange={e => setDepositPhone(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm"
                  />
                </div>

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount (USDT)</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[10, 50, 100].map(amt => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(String(amt))}
                        className={`rounded-lg py-2 text-xs font-bold transition border ${
                          depositAmount === String(amt)
                            ? 'bg-[#C5A059] border-[#C5A059] text-black'
                            : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#C5A059]/50'
                        }`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    step="0.1"
                    className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm"
                  />
                </div>

                {/* Payment Methods */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1.5 bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-3">
                    <Smartphone className="w-5 h-5 text-[#C5A059]" />
                    <span className="text-[9px] text-gray-400 font-bold">M-Pesa</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-3">
                    <CreditCard className="w-5 h-5 text-[#C5A059]" />
                    <span className="text-[9px] text-gray-400 font-bold">Card</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 bg-[#0a0a0a] border border-[#1F1F1F] rounded-xl p-3">
                    <Building2 className="w-5 h-5 text-[#C5A059]" />
                    <span className="text-[9px] text-gray-400 font-bold">Bank</span>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!depositAmount || !depositPhone}
                  className="w-full bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition"
                >
                  <ArrowUpRight className="w-4 h-4 inline mr-1" />
                  Deposit USDT
                </button>
              </div>
            )}

            {depositStatus === 'processing' && (
              <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-6 text-center">
                <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-[#C5A059] mb-1">Processing</p>
                <p className="text-xs text-gray-400">{depositMessage}</p>
              </div>
            )}

            {depositStatus === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-green-400 mb-1">Deposit Initiated</p>
                <p className="text-xs text-gray-400">{depositMessage}</p>
              </div>
            )}

            {depositStatus === 'error' && (
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                <p className="text-sm font-bold text-yellow-600 mb-1">Error</p>
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
          <div className="bg-[#111] border border-[#1F1F1F] rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>

            <h3 className="text-lg font-black text-white mb-1">Withdraw USDT</h3>
            <p className="text-sm text-gray-400 mb-4">Cash out to M-Pesa via Kotani off-ramp.</p>

            <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-4 mb-4">
              <p className="text-xs text-[#C5A059] font-bold">Coming Soon</p>
              <p className="text-xs text-gray-400 mt-1">Off-ramp integration is in progress. You can withdraw USDT directly to an external wallet for now.</p>
            </div>

            <button
              onClick={() => {
                window.open(`https://basescan.org/address/${address}`, '_blank')
              }}
              className="w-full bg-[#111] border border-[#1F1F1F] hover:border-[#C5A059]/50 text-white font-bold py-3 rounded-xl transition text-sm"
            >
              View on BaseScan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [depositMethod, setDepositMethod] = useState<'mpesa' | 'card' | 'bank'>('mpesa')
  const [depositPhone, setDepositPhone] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankName, setBankName] = useState('')
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

    if (depositMethod === 'mpesa' && !depositPhone) {
      setDepositMessage('Enter your M-Pesa phone number')
      setDepositStatus('error')
      return
    }
    if (depositMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv)) {
      setDepositMessage('Enter all card details')
      setDepositStatus('error')
      return
    }
    if (depositMethod === 'bank' && (!bankAccount || !bankName)) {
      setDepositMessage('Enter bank account details')
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
          method: depositMethod,
          cardNumber,
          cardExpiry,
          cardCvv,
          accountNumber: bankAccount,
          bankName,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setDepositStatus('success')
        setDepositMessage(`${amount} USDT checkout created! Check your phone for prompt.`)
        setDepositAmount('')
        setDepositPhone('')
        setCardNumber('')
        setCardExpiry('')
        setCardCvv('')
        setBankAccount('')
        setBankName('')
        appWallet.addBalance(amount)

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
            <p className="text-sm text-gray-400 mb-4">Powered by Kotani Pay</p>

            {depositStatus === 'idle' && (
              <div className="space-y-4">
                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setDepositMethod('mpesa')} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 border transition ${depositMethod === 'mpesa' ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]' : 'bg-[#0a0a0a] border-[#1F1F1F] text-gray-400 hover:border-[#C5A059]/50'}`}>
                    <Smartphone className="w-5 h-5" />
                    <span className="text-[9px] font-bold">M-Pesa</span>
                  </button>
                  <button onClick={() => setDepositMethod('card')} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 border transition ${depositMethod === 'card' ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]' : 'bg-[#0a0a0a] border-[#1F1F1F] text-gray-400 hover:border-[#C5A059]/50'}`}>
                    <CreditCard className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Card</span>
                  </button>
                  <button onClick={() => setDepositMethod('bank')} className={`flex flex-col items-center gap-1.5 rounded-xl p-3 border transition ${depositMethod === 'bank' ? 'bg-[#C5A059]/20 border-[#C5A059] text-[#C5A059]' : 'bg-[#0a0a0a] border-[#1F1F1F] text-gray-400 hover:border-[#C5A059]/50'}`}>
                    <Building2 className="w-5 h-5" />
                    <span className="text-[9px] font-bold">Bank</span>
                  </button>
                </div>

                {/* Method-Specific Inputs */}
                {depositMethod === 'mpesa' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">M-Pesa Phone Number</label>
                    <input type="tel" placeholder="0712345678" value={depositPhone} onChange={e => setDepositPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                  </div>
                )}

                {depositMethod === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Card Number</label>
                      <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Expiry</label>
                        <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">CVV</label>
                        <input type="text" placeholder="123" value={cardCvv} onChange={e => setCardCvv(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {depositMethod === 'bank' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Bank Name</label>
                      <input type="text" placeholder="Equity Bank" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Account Number</label>
                      <input type="text" placeholder="1234567890" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                    </div>
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount (USDT)</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[10, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setDepositAmount(String(amt))} className={`rounded-lg py-2 text-xs font-bold transition border ${depositAmount === String(amt) ? 'bg-[#C5A059] border-[#C5A059] text-black' : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#C5A059]/50'}`}>{amt}</button>
                    ))}
                  </div>
                  <input type="number" placeholder="Custom amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} step="0.1" className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
                </div>

                <button onClick={handleDeposit} disabled={!depositAmount} className="w-full bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
                  <ArrowUpRight className="w-4 h-4 inline mr-1" />
                  Deposit {depositAmount ? depositAmount + ' USDT' : ''}
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
              <div className="space-y-4">
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-yellow-600 mb-1">Error</p>
                  <p className="text-xs text-gray-400">{depositMessage}</p>
                </div>
                <button onClick={() => setDepositStatus('idle')} className="w-full bg-[#111] border border-[#1F1F1F] text-white font-bold py-3 rounded-xl text-sm hover:border-[#C5A059]/50 transition">Try Again</button>
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
            <h3 className="text-lg font-black text-white mb-1">Withdraw to M-Pesa</h3>
            <p className="text-sm text-gray-400 mb-4">Powered by Kotani Pay • USDT → KSh</p>
            <WithdrawForm balance={appWallet.balance} userId={user?.id} onClose={() => setShowWithdrawModal(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function WithdrawForm({ balance, userId, onClose }: { balance: number; userId?: string; onClose: () => void }) {
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleWithdraw = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt < 1) { setMessage('Minimum withdrawal is 1 USDT'); setStatus('error'); return }
    if (!phone) { setMessage('Enter your M-Pesa phone number'); setStatus('error'); return }
    if (amt > balance) { setMessage('Insufficient balance'); setStatus('error'); return }

    setStatus('processing')
    setMessage('Processing withdrawal...')

    try {
      const res = await fetch('/api/kotani-withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, phone, userId }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        setMessage(`${amt} USDT withdrawal initiated. Funds will arrive in M-Pesa shortly.`)
        setAmount('')
        setPhone('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      setStatus('error')
      setMessage('Network error. Try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-green-400 mb-1">Withdrawal Initiated</p>
        <p className="text-xs text-gray-400">{message}</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4 text-center">
          <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-sm font-bold text-yellow-600 mb-1">Error</p>
          <p className="text-xs text-gray-400">{message}</p>
        </div>
        <button onClick={() => setStatus('idle')} className="w-full bg-[#111] border border-[#1F1F1F] text-white font-bold py-3 rounded-xl text-sm hover:border-[#C5A059]/50 transition">Try Again</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">M-Pesa Phone</label>
        <input type="tel" placeholder="0712345678" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
      </div>
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount (USDT)</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[5, 10, 25].map(amt => (
            <button key={amt} onClick={() => setAmount(String(amt))} className={`rounded-lg py-2 text-xs font-bold transition border ${amount === String(amt) ? 'bg-[#C5A059] border-[#C5A059] text-black' : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#C5A059]/50'}`}>{amt}</button>
          ))}
        </div>
        <input type="number" placeholder="Custom amount" value={amount} onChange={e => setAmount(e.target.value)} step="0.1" className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#C5A059] transition font-mono text-sm" />
        <p className="text-[10px] text-gray-600 mt-1">Available: {balance.toFixed(2)} USDT</p>
      </div>
      {status === 'processing' ? (
        <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-4 text-center">
          <Loader2 className="w-6 h-6 text-[#C5A059] animate-spin mx-auto mb-2" />
          <p className="text-sm font-bold text-[#C5A059]">{message}</p>
        </div>
      ) : (
        <button onClick={handleWithdraw} disabled={!amount || !phone} className="w-full bg-gradient-to-r from-[#C5A059] to-[#B8860B] text-black font-bold py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
          <ArrowDownToLine className="w-4 h-4 inline mr-1" />
          Withdraw to M-Pesa
        </button>
      )}
    </div>
  )
}

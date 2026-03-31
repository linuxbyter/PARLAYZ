import React, { useState } from 'react'
import { ArrowUpRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function KotaniPay({ userId, username, onDepositSuccess, showToast }) {
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const [lastTx, setLastTx] = useState(null)

  const openKotaniWidget = () => {
    const widgetUrl = `https://genpay.kotanipay.com?apiKey=${import.meta.env.VITE_KOTANI_WIDGET_KEY || ''}&userId=${userId || ''}&defaultCurrency=USDT&redirectUrl=${encodeURIComponent(window.location.origin)}`
    window.open(widgetUrl, '_blank', 'width=480,height=640,scrollbars=yes')
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 1) {
      if (showToast) showToast('Minimum deposit is 1 USDT', 'error')
      return
    }
    if (!depositPhone) {
      if (showToast) showToast('Enter your M-Pesa phone number', 'error')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/kotani-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone: depositPhone,
          userId,
          username: username || 'Parlayz User',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setLastTx({ amount, status: 'pending', time: new Date() })
        if (showToast) showToast('Deposit initiated! Check your phone for M-Pesa prompt', 'success')
        setDepositAmount('')
        setDepositPhone('')
        if (onDepositSuccess) onDepositSuccess(data)
      } else {
        if (showToast) showToast(data.message || 'Deposit failed', 'error')
      }
    } catch (error) {
      console.error('Kotani deposit error:', error)
      if (showToast) showToast('Network error. Try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick Widget Button */}
      <button
        onClick={openKotaniWidget}
        className="w-full bg-[#26a17b] hover:bg-[#1e8c6b] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
      >
        <ArrowUpRight className="w-4 h-4" />
        Open Kotani Pay Widget
      </button>

      <div className="flex items-center gap-2 my-2">
        <div className="flex-1 h-px bg-[#1F1F1F]" />
        <span className="text-[10px] text-gray-600 uppercase font-bold">Or deposit manually</span>
        <div className="flex-1 h-px bg-[#1F1F1F]" />
      </div>

      {/* Manual Deposit Form */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          M-Pesa Phone
        </label>
        <input
          type="tel"
          placeholder="0712345678"
          value={depositPhone}
          onChange={(e) => setDepositPhone(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#26a17b] transition font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
          Amount (USDT)
        </label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[1, 5, 10].map((amt) => (
            <button
              key={amt}
              onClick={() => setDepositAmount(String(amt))}
              className={`rounded-lg py-2 text-xs font-bold transition border ${
                depositAmount === String(amt)
                  ? 'bg-[#26a17b] border-[#26a17b] text-white'
                  : 'border-[#1F1F1F] bg-[#1a1a1a] text-gray-400 hover:border-[#26a17b]/50'
              }`}
            >
              {amt} USDT
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Custom amount"
          value={depositAmount}
          onChange={(e) => setDepositAmount(e.target.value)}
          step="0.1"
          className="w-full bg-[#0a0a0a] border border-[#1F1F1F] text-white rounded-xl p-3 focus:outline-none focus:border-[#26a17b] transition font-mono text-sm"
        />
      </div>

      <button
        onClick={handleDeposit}
        disabled={isProcessing || !depositAmount || !depositPhone}
        className="w-full bg-[#26a17b] hover:bg-[#1e8c6b] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <ArrowUpRight className="w-4 h-4" />
            Deposit USDT
          </>
        )}
      </button>

      {/* Transaction Status */}
      {lastTx && (
        <div className={`rounded-xl p-3 border text-sm flex items-center gap-2 ${
          lastTx.status === 'completed'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : lastTx.status === 'failed'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
        }`}>
          {lastTx.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : lastTx.status === 'failed' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
          )}
          <span>
            {lastTx.status === 'completed'
              ? `${lastTx.amount} USDT credited!`
              : lastTx.status === 'failed'
              ? 'Deposit failed. Try again.'
              : `${lastTx.amount} USDT pending confirmation...`}
          </span>
        </div>
      )}

      <p className="text-[9px] text-gray-600 text-center">
        Powered by Kotani Pay • Webhook auto-credits your balance
      </p>
    </div>
  )
}

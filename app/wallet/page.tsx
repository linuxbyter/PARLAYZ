'use client'

import Header from '@/src/components/Header'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function WalletPage() {
  const { user } = useUser()

  // Mock balance for now - will be replaced with Supabase integration
  const [balance, setBalance] = useState(0)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [depositStatus, setDepositStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [depositMessage, setDepositMessage] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositPhone, setDepositPhone] = useState('')
  const [withdrawStatus, setWithdrawStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [withdrawMessage, setWithdrawMessage] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState('')

   return (
     <div className="min-h-screen bg-[#000000] text-white">
       <Header />

       <main className="max-w-2xl mx-auto px-4 py-6">
         <SignedIn>
           {/* Balance Header */}
           <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl p-6 mb-4 text-center">
             <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2">Total Balance</p>
             <h1 className="text-4xl font-black font-mono text-white mb-1">
               KSh {balance.toFixed(0)}
             </h1>
             <p className="text-xs text-gray-500">
               Available for betting
             </p>
           </div>

           {/* Action Buttons */}
           <div className="grid grid-cols-2 gap-3 mb-6">
             <button
               onClick={() => { setShowDepositModal(true); setDepositStatus('idle'); setDepositMessage('') }}
               className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider hover:opacity-90"
             >
               Deposit
             </button>
             <button
               onClick={() => setShowWithdrawModal(true)}
               className="w-full bg-[#111] border border-[#2D2D2D] hover:border-[#1E3A8A]/50 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
             >
               Withdraw
             </button>
           </div>
         </SignedIn>

         <SignedOut>
           <div className="text-center py-20">
             <h2 className="text-2xl font-black text-white mb-2">Wallet</h2>
             <p className="text-gray-400 mb-6">Sign in to manage your funds</p>
             <SignInButton mode="modal">
               <button className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition">
                 Sign In
               </button>
             </SignInButton>
           </div>
         </SignedOut>
       </main>

       {/* Deposit Modal */}
       {showDepositModal && (
         <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDepositModal(false)}>
           <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setShowDepositModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>

             <h3 className="text-lg font-black text-white mb-1">Deposit Funds</h3>
             <p className="text-sm text-gray-400 mb-4">Via M-Pesa</p>

             {depositStatus === 'idle' && (
               <div className="space-y-4">
                 {/* Phone Input */}
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">M-Pesa Phone Number</label>
                   <input type="tel" placeholder="0712345678" value={depositPhone} onChange={e => setDepositPhone(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2D2D2D] text-white rounded-xl p-3 focus:outline-none focus:border-[#1E3A8A] transition font-mono text-sm" />
                 </div>

                 {/* Amount Input */}
                 <div>
                   <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount (KSh)</label>
                   <div className="grid grid-cols-3 gap-2 mb-2">
                     {[100, 500, 1000].map(amt => (
                       <button key={amt} onClick={() => setDepositAmount(String(amt))} className={`rounded-lg py-2 text-xs font-bold transition border ${depositAmount === String(amt) ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white' : 'border-[#2D2D2D] bg-[#1a1a1a] text-gray-400 hover:border-[#1E3A8A]/50'}`}>{amt}</button>
                     ))}
                   </div>
                   <input type="number" placeholder="Custom amount" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} step="1" className="w-full bg-[#1a1a1a] border border-[#2D2D2D] text-white rounded-xl p-3 focus:outline-none focus:border-[#1E3A8A] transition font-mono text-sm" />
                 </div>

                 <button onClick={handleDeposit} disabled={!depositAmount} className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
                   Deposit KSh {depositAmount ? depositAmount : ''}
                 </button>
               </div>
             )}

             {depositStatus === 'processing' && (
               <div className="bg-[#1E3A8A]/10 border border-[#1E3A8A]/30 rounded-xl p-6 text-center">
                 <Loader2 className="w-8 h-8 text-[#1E3A8A] animate-spin mx-auto mb-3" />
                 <p className="text-sm font-bold text-[#1E3A8A] mb-1">Processing</p>
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
                 <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                   <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                   <p className="text-sm font-bold text-red-500 mb-1">Error</p>
                   <p className="text-xs text-gray-400">{depositMessage}</p>
                 </div>
                 <button onClick={() => setDepositStatus('idle')} className="w-full bg-[#111] border border-[#2D2D2D] text-white font-bold py-3 rounded-xl text-sm hover:border-[#1E3A8A]/50 transition">Try Again</button>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Withdraw Modal */}
       {showWithdrawModal && (
         <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowWithdrawModal(false)}>
           <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl w-full max-w-md p-6 relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition">✕</button>
             <h3 className="text-lg font-black text-white mb-1">Withdraw Funds</h3>
             <p className="text-sm text-gray-400 mb-4">To M-Pesa</p>
             
             <div className="space-y-4">
               {/* Phone Input */}
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">M-Pesa Phone Number</label>
                 <input type="tel" placeholder="0712345678" value={withdrawPhone} onChange={e => setWithdrawPhone(e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2D2D2D] text-white rounded-xl p-3 focus:outline-none focus:border-[#1E3A8A] transition font-mono text-sm" />
               </div>

               {/* Amount Input */}
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Amount (KSh)</label>
                 <div className="grid grid-cols-3 gap-2 mb-2">
                   {[100, 500, 1000].map(amt => (
                     <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className={`rounded-lg py-2 text-xs font-bold transition border ${withdrawAmount === String(amt) ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white' : 'border-[#2D2D2D] bg-[#1a1a1a] text-gray-400 hover:border-[#1E3A8A]/50'}`}>{amt}</button>
                   ))}
                 </div>
                 <input type="number" placeholder="Custom amount" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} step="1" className="w-full bg-[#1a1a1a] border border-[#2D2D2D] text-white rounded-xl p-3 focus:outline-none focus:border-[#1E3A8A] transition font-mono text-sm" />
               </div>

               {withdrawStatus === 'processing' && (
                 <div className="bg-[#1E3A8A]/10 border border-[#1E3A8A]/30 rounded-xl p-4 text-center">
                   <Loader2 className="w-6 h-6 text-[#1E3A8A] animate-spin mx-auto mb-2" />
                   <p className="text-sm font-bold text-[#1E3A8A]">{withdrawMessage}</p>
                 </div>
               )}

               {withdrawStatus === 'success' && (
                 <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                   <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
                   <p className="text-sm font-bold text-green-400 mb-1">Withdrawal Initiated</p>
                   <p className="text-xs text-gray-400">{withdrawMessage}</p>
                 </div>
               )}

               {withdrawStatus === 'error' && (
                 <div className="space-y-4">
                   <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                     <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                     <p className="text-sm font-bold text-red-500 mb-1">Error</p>
                     <p className="text-xs text-gray-400">{withdrawMessage}</p>
                   </div>
                   <button onClick={() => setWithdrawStatus('idle')} className="w-full bg-[#111] border border-[#2D2D2D] text-white font-bold py-3 rounded-xl text-sm hover:border-[#1E3A8A]/50 transition">Try Again</button>
                 </div>
               )}
               
               <div className="mt-4">
                 <button onClick={handleWithdraw} disabled={!withdrawAmount} className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] text-white font-bold py-3 rounded-xl text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition">
                   Withdraw KSh {withdrawAmount ? withdrawAmount : ''}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )

}

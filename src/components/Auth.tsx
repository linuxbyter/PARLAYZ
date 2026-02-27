import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { TrendingUp, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Registration successful! Please log in.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-[#111111]/90 backdrop-blur-2xl border border-[#ffffff15] rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden w-full">
      {/* Background Premium Orbs */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#C5A880]/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#7A6340]/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="relative z-10">
        {/* Logo / Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#C5A880]/5 border border-[#C5A880]/20 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(197,168,128,0.1)]">
            <TrendingUp className="w-6 h-6 text-[#C5A880]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSignUp ? 'Initialize Account' : 'Access Terminal'}
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-light">
            {isSignUp ? 'Deploy your liquidity to the network.' : 'Securely log in to the exchange.'}
          </p>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-[#f43f5e]/10 border border-[#f43f5e]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#f43f5e] shrink-0 mt-0.5" />
            <p className="text-[#f43f5e] text-sm">{error}</p>
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/30 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
            <p className="text-[#10b981] text-sm">{message}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition font-medium"
                placeholder="trader@network.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Secure Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#ffffff15] text-white rounded-xl pl-10 pr-4 py-3.5 focus:outline-none focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880] transition font-medium"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-[#8E7651] to-[#A3885C] text-[#0a0a0a] font-bold py-3.5 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(163,136,92,0.2)] hover:shadow-[0_0_30px_rgba(163,136,92,0.3)] hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 mt-2 flex justify-center items-center"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-[#0a0a0a] border-t-transparent rounded-full animate-spin"></span>
            ) : (
              isSignUp ? 'Create Wallet' : 'Authenticate'
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Login */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
            className="text-sm text-gray-400 hover:text-[#C5A880] transition font-medium"
          >
            {isSignUp 
              ? "Already have an account? Sign in." 
              : "No wallet? Initialize account."}
          </button>
        </div>
      </div>
    </div>
  )
}

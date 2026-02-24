import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot'>('signup')
  const [message, setMessage] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) setMessage(error.message)
      else setMessage('Reset email sent! Check your inbox.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage(error.message)
      else setMessage('Account created! Sign in now.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(error.message)
    }

    setLoading(false)
  }

  const getTitle = () => {
    if (mode === 'forgot') return 'Reset Password'
    if (mode === 'signup') return 'Join Parlayz'
    return 'Welcome Back'
  }

  const getSubtitle = () => {
    if (mode === 'forgot') return 'Enter your email to reset'
    if (mode === 'signup') return 'Start with 10,000 credits'
    return 'Sign in to trade'
  }

  return (
    <div className="min-h-screen bg-matte-900 flex items-center justify-center p-4">
      <div className="bg-matte-800 border border-matte-700 rounded-2xl p-6 sm:p-8 w-full max-w-md mx-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gold-400 mb-2 text-center">
          {getTitle()}
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm sm:text-base">
          {getSubtitle()}
        </p>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            message.includes('Error') || message.includes('Invalid') 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-green-500/20 text-green-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 text-base"
              placeholder="you@email.com"
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 text-base"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:bg-matte-600 text-matte-900 font-bold py-3.5 rounded-lg transition text-base mt-2"
          >
            {loading ? 'Loading...' : mode === 'forgot' ? 'Send Reset Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-6 space-y-3">
          {mode !== 'forgot' && (
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup')
                setMessage('')
              }}
              className="text-gray-400 hover:text-gold-400 block w-full text-sm"
            >
              {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          )}
          
          {mode === 'signin' && (
            <button
              onClick={() => {
                setMode('forgot')
                setMessage('')
              }}
              className="text-gold-400 hover:underline text-sm block w-full"
            >
              Forgot Password?
            </button>
          )}
          
          {mode === 'forgot' && (
            <button
              onClick={() => {
                setMode('signin')
                setMessage('')
              }}
              className="text-gray-400 hover:text-gold-400 text-sm block w-full"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../lib/supabase'  // <-- FIXED PATH

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signup' | 'signin' | 'forgot'>('signup')
  const [message, setMessage] = useState('')

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
    if (error) setMessage(error.message)
    setLoading(false)
  }

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
        <h2 className="text-2xl sm:text-3xl font-bold text-[#C5A880] mb-2 text-center">
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

        {/* Google Sign-In Button */}
        {mode !== 'forgot' && (
          <div className="mb-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-matte-600 text-gray-900 font-semibold py-3.5 rounded-lg transition text-base flex items-center justify-center gap-3 border border-gray-300"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-matte-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-matte-800 text-gray-400">Or continue with email</span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C5A880] text-base"
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
                className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#C5A880] text-base"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A880] hover:bg-[#A3885C] disabled:bg-matte-600 text-[#0a0a0a] font-bold py-3.5 rounded-lg transition text-base mt-2"
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
              className="text-gray-400 hover:text-[#C5A880] block w-full text-sm"
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
              className="text-[#C5A880] hover:underline text-sm block w-full"
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
              className="text-gray-400 hover:text-[#C5A880] text-sm block w-full"
            >
              Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

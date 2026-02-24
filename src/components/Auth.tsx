import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(true)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) alert(error.message)
      else alert('Check your email for confirmation!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) alert(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-matte-900 flex items-center justify-center p-4">
      <div className="bg-matte-800 border border-matte-700 rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-gold-400 mb-2 text-center">
          {isSignUp ? 'Join Parlayz' : 'Welcome Back'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isSignUp ? 'Start with 10,000 credits' : 'Sign in to trade'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              placeholder="you@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-matte-900 border border-matte-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-500 hover:bg-gold-400 text-matte-900 font-bold py-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-gold-400 hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-8 bg-primary">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-widest text-accent mb-2">GRAIN</h1>
        <p className="text-xs text-text-muted uppercase tracking-widest">Your darkroom in your pocket.</p>
      </div>

      {sent ? (
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-accent">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-3">Check your email</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            We sent a magic link to<br />
            <span className="text-accent font-mono">{email}</span>
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="mt-8 text-xs text-text-muted uppercase tracking-widest hover:text-text transition-colors"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-2 uppercase tracking-widest">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-surface border border-border rounded-lg p-4 text-text placeholder-text-muted/50 focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-primary font-bold py-4 rounded-lg shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-95 transition-all text-sm uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send Magic Link'}
          </button>
        </form>
      )}
    </div>
  )
}

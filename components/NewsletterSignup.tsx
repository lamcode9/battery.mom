'use client'

import { useState, FormEvent } from 'react'

interface NewsletterSignupProps {
  variant?: 'inline' | 'card'
  className?: string
}

export default function NewsletterSignup({ variant = 'card', className = '' }: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Something went wrong.')
        return
      }

      setStatus('success')
      setMessage(data.message)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (variant === 'inline') {
    return (
      <div className={className}>
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
              placeholder="your@email.com"
              required
              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white/10 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}
        {status === 'error' && (
          <p className="text-xs text-red-400 mt-1">{message}</p>
        )}
      </div>
    )
  }

  // Card variant (for homepage)
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-xl p-8 ${className}`}>
      <div className="max-w-xl mx-auto text-center">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Monthly data digest</h3>
        <p className="text-sm text-gray-600 mb-5">
          Battery deployment, solar growth, policy changes, and market signals across Southeast Asia and the world. Once a month, straight to your inbox.
        </p>

        {status === 'success' ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 py-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="font-medium">{message}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
              placeholder="your@email.com"
              required
              className="flex-1 min-w-0 px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm"
            >
              {status === 'loading' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Subscribing…
                </span>
              ) : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="text-sm text-red-500 mt-2">{message}</p>
        )}

        <p className="text-xs text-gray-400 mt-4">
          No spam. Unsubscribe anytime. We never share your email.
        </p>
      </div>
    </div>
  )
}

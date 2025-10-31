import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const register = useMutation(api.auth.register)
  const login = useMutation(api.auth.login)

  useEffect(() => {
    if (router.query.mode === 'register') {
      setMode('register')
    } else {
      setMode('login')
    }
  }, [router.query.mode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let userId
      
      if (mode === 'register') {
        userId = await register({ email, password, name })
      } else {
        userId = await login({ email, password })
      }

      localStorage.setItem('userId', userId)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Caveat:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Space Grotesk', sans-serif;
          background: #0a0a0a;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .glass-strong {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .neon-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3);
        }
      `}</style>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="glass-strong rounded-2xl p-8 max-w-md w-full border border-white/10">
          <h1 className="text-3xl font-bold mb-2 gradient-text" style={{fontFamily: 'Caveat, cursive'}}>
            Co-Blocks
          </h1>
          <p className="text-gray-400 text-sm mb-8">Collaborative document editing</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="Your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all neon-glow disabled:opacity-50"
            >
              {loading ? 'Loading...' : mode === 'register' ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                  router.push(mode === 'login' ? '/auth?mode=register' : '/auth?mode=login')
                }}
                className="text-purple-400 hover:text-purple-300 ml-2 font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

import { useState } from 'react'
import { useAction } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useRouter } from 'next/router'

export default function Auth() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const register = useAction(api.auth.register)
  const login = useAction(api.auth.login)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const result = await login({ email, password })
        localStorage.setItem('userId', result.userId)
        router.push('/dashboard')
      } else {
        const result = await register({ email, password, name })
        localStorage.setItem('userId', result.userId)
        router.push('/dashboard')
      }
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
        
        .neon-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3);
        }
        
        .glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .glass-strong {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .neon-border {
          border: 1px solid rgba(167, 139, 250, 0.3);
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.2);
        }
      `}</style>

      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2" style={{fontFamily: 'Caveat, cursive'}}>
              Co-Blocks
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Welcome back! ✨' : 'Create your account 🚀'}
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-8 neon-border">
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
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
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all neon-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Please wait...' : (isLogin ? 'Log in' : 'Register now')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError('')
                }}
                className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Log in'}
              </button>
            </div>
          </div>

          <div className="text-center mt-6">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-400 transition-colors">
              ← Back to home
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

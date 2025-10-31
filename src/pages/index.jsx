import { useRouter } from 'next/router'

export default function LandingPage() {
  const router = useRouter()

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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>

      <div className="bg-black text-white antialiased overflow-x-hidden min-h-screen">
        <nav className="fixed top-0 w-full glass z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <div className="text-2xl font-bold gradient-text" style={{fontFamily: 'Caveat, cursive', fontSize: '28px'}}>
                  Co-Blocks
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.push('/auth?mode=login')}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Log in
                </button>
                <button 
                  onClick={() => router.push('/auth?mode=register')}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all neon-glow"
                >
                  Register now
                </button>
              </div>
            </div>
          </div>
        </nav>

        <section className="relative pt-32 pb-20 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-4 py-2 glass rounded-full mb-8 animate-float">
                <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-300">Always free, forever ✨</span>
              </div>
              <h1 className="text-6xl lg:text-8xl font-bold tracking-tight mb-6">
                <span className="gradient-text">Write, plan, share.</span><br/>
                <span style={{fontFamily: 'Caveat, cursive'}} className="text-7xl lg:text-9xl gradient-text">
                  Together, beautifully.
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Co-Blocks is your team's collaborative workspace. Write docs, build wikis, and work together in real-time—all in one <span className="text-purple-400">beautiful</span> interface.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => router.push('/auth?mode=register')}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all neon-glow"
                >
                  Register now →
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 py-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-gray-400">© 2024 Co-Blocks. All rights reserved. Made with 💜</p>
          </div>
        </footer>
      </div>
    </>
  )
}

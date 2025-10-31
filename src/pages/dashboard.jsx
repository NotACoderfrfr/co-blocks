import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [activeTab, setActiveTab] = useState('my-docs')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) {
      router.push('/auth')
    } else {
      setUserId(id)
    }
  }, [router])

  // Real-time queries - automatically update when data changes
  const myDocuments = useQuery(api.documents.getUserDocuments, 
    userId ? { userId } : 'skip'
  )

  const sharedDocuments = useQuery(api.sharing.getSharedDocuments,
    userId ? { userId } : 'skip'
  )

  const createDocument = useMutation(api.documents.createDocument)

  // Force refresh every 3 seconds to check for new shares
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleCreateDocument = async () => {
    try {
      const docId = await createDocument({
        userId,
        title: 'Untitled Document',
        content: JSON.stringify([{ type: 'paragraph', children: [{ text: 'Start writing...' }] }]),
      })
      router.push(`/editor/${docId}`)
    } catch (err) {
      alert('Error creating document: ' + err.message)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userId')
    router.push('/')
  }

  if (!userId) return null

  const displayDocs = activeTab === 'my-docs' ? myDocuments : sharedDocuments

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
        
        .neon-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3);
        }
        
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
        }
        
        .tab-active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(236, 72, 153, 0.3));
          border-color: rgba(167, 139, 250, 0.5);
        }
      `}</style>

      <div className="min-h-screen bg-black text-white">
        <nav className="glass border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold gradient-text" style={{fontFamily: 'Caveat, cursive'}}>
                Co-Blocks
              </h1>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-4xl font-bold mb-2">Your Workspace</h2>
              <p className="text-gray-400">Create and manage your collaborative documents ✨</p>
            </div>
            <button
              onClick={handleCreateDocument}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all neon-glow"
            >
              + New Document
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('my-docs')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                activeTab === 'my-docs' ? 'tab-active' : 'glass border-white/10'
              }`}
            >
              📄 My Documents
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`px-4 py-2 rounded-lg border transition-all ${
                activeTab === 'shared' ? 'tab-active' : 'glass border-white/10'
              }`}
            >
              👥 Shared with me
            </button>
          </div>

          {/* Documents Grid */}
          {!displayDocs ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              <p className="text-gray-400 mt-4">Loading documents...</p>
            </div>
          ) : displayDocs.length === 0 ? (
            <div className="text-center py-20 glass-strong rounded-2xl">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-2xl font-semibold mb-2">
                {activeTab === 'my-docs' ? 'No documents yet' : 'No shared documents'}
              </h3>
              <p className="text-gray-400 mb-6">
                {activeTab === 'my-docs' 
                  ? 'Create your first document to get started!' 
                  : 'Documents shared with you will appear here'}
              </p>
              {activeTab === 'my-docs' && (
                <button
                  onClick={handleCreateDocument}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all neon-glow"
                >
                  Create Document
                </button>
              )}
            </div>
          ) : (
            <div key={refreshKey} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayDocs.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => router.push(`/editor/${doc._id}`)}
                  className="glass-strong rounded-xl p-6 cursor-pointer hover-lift border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-white flex-1">
                      {doc.title}
                    </h3>
                    {doc.role && (
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {doc.role}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Last edited: {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Click to open →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

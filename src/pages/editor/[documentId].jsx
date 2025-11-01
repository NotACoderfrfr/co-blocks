import UserInfo from '../../components/UserInfo'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from 'convex/react'
import { useConvex } from "convex/react"
import { api } from '../../../convex/_generated/api'
import dynamic from 'next/dynamic'

const BlockNoteEditor = dynamic(() => import('../../components/BlockNoteEditor'), {
  ssr: false,
})

export default function EditorPage() {
  const router = useRouter()
  const { documentId } = router.query
  const [userId, setUserId] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('edit')
  const [sharingError, setSharingError] = useState('')
  const [sharingSuccess, setSharingSuccess] = useState('')
  const [linkRole, setLinkRole] = useState('edit')
  const [shareLink, setShareLink] = useState('')
  const saveTimeoutRef = useRef(null)
  const [userRole, setUserRole] = useState('read')
  const [document, setDocument] = useState(null)
  const convex = useConvex()

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) {
      router.push('/auth')
    } else {
      setUserId(id)
    }
  }, [router])

  // Real-time polling - just update state, let editor handle it
  const fetchDocument = useCallback(async () => {
    if (!documentId) return
    try {
      const doc = await convex.query(api.documents.getDocument, { documentId })
      setDocument(doc)
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }, [documentId, convex])

  useEffect(() => {
    if (!documentId) {
      setDocument(null)
      return
    }

    fetchDocument()
    const interval = setInterval(fetchDocument, 300)
    
    return () => clearInterval(interval)
  }, [documentId, fetchDocument])

  const permissions = useQuery(
    api.sharing.getDocumentPermissions,
    documentId ? { documentId } : 'skip'
  )

  const activeUsers = useQuery(
    api.presence.getActiveUsers,
    documentId ? { documentId } : 'skip'
  )

  const updateDocument = useMutation(api.documents.updateDocument)
  const saveContent = useMutation(api.realtime.saveContent)
  const shareDocument = useMutation(api.sharing.shareDocument)
  const removePermission = useMutation(api.sharing.removePermission)
  const updatePresence = useMutation(api.presence.updatePresence)
  const removePresence = useMutation(api.presence.removePresence)

  useEffect(() => {
    if (!document || !userId) return
    
    if (document.ownerId === userId) {
      setUserRole('admin')
    } else if (permissions && permissions.length > 0) {
      const userPerm = permissions.find(p => p.userId === userId)
      setUserRole(userPerm?.role || 'read')
    }
  }, [document, permissions, userId])

  useEffect(() => {
    if (!userId || !documentId) return

    const updatePres = async () => {
      await updatePresence({ documentId, userId })
    }

    updatePres()
    const interval = setInterval(updatePres, 30000)

    return () => {
      clearInterval(interval)
      removePresence({ documentId, userId }).catch(console.error)
    }
  }, [userId, documentId, updatePresence, removePresence])

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (userId && documentId) {
        await removePresence({ documentId, userId }).catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [userId, documentId, removePresence])

  const handleSave = async (content, title) => {
    if (!documentId || !userId || userRole === 'read') return

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveContent({
          documentId,
          content: JSON.stringify(content),
          userId,
        })

        if (title) {
          await updateDocument({
            documentId,
            content: JSON.stringify(content),
            title,
          })
        }
      } catch (err) {
        console.error('Error saving:', err)
      }
    }, 500)
  }

  const handleShare = async (e) => {
    e.preventDefault()
    setSharingError('')
    setSharingSuccess('')

    if (!shareEmail.trim()) {
      setSharingError('Please enter an email')
      return
    }

    try {
      await shareDocument({
        documentId,
        userEmail: shareEmail,
        role: shareRole,
        sharedBy: userId,
      })
      setSharingSuccess(`Document shared with ${shareEmail}!`)
      setShareEmail('')
      setTimeout(() => setSharingSuccess(''), 3000)
    } catch (err) {
      setSharingError(err.message)
    }
  }

  const generateShareLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/document/${documentId}?role=${linkRole}`
    setShareLink(link)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setSharingSuccess('Link copied!')
    setTimeout(() => setSharingSuccess(''), 2000)
  }

  const handleRemoveAccess = async (permissionId) => {
    try {
      await removePermission({ 
        permissionId,
        userId,
        documentId,
      })
    } catch (err) {
      setSharingError(err.message)
    }
  }

  const isOwnerOrAdmin = userRole === 'admin'

  if (!userId || !document) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-400">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; background: #0a0a0a; }
        .gradient-text { background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .glass-strong { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .neon-glow { box-shadow: 0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.3); }
      `}</style>

      <UserInfo />
      <div className="min-h-screen bg-black text-white">
        <nav className="glass border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
                <input type="text" defaultValue={document.title} onBlur={(e) => handleSave(JSON.parse(document.content), e.target.value)} className="text-xl font-semibold bg-transparent border-none outline-none text-white" placeholder="Untitled Document" disabled={userRole === 'read'} />
              </div>

              {activeUsers && activeUsers.length > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 glass rounded-lg border border-white/10">
                  <div className="flex -space-x-2">
                    {activeUsers.slice(0, 3).map((user, idx) => (
                      <div key={`${user.userId}-${idx}`} className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold border-2 border-black" title={user.email}>
                        {user.name?.[0] || user.email?.[0]}
                      </div>
                    ))}
                    {activeUsers.length > 3 && <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold border-2 border-black">+{activeUsers.length - 3}</div>}
                  </div>
                  <span className="text-xs text-gray-400 ml-2">{activeUsers.length} viewing</span>
                </div>
              )}

              <div className="flex items-center space-x-3 ml-4">
                {isOwnerOrAdmin && (
                  <>
                    <button onClick={() => setShowLinkModal(true)} className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg">🔗 Link</button>
                    <button onClick={() => setShowShareModal(true)} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium rounded-lg neon-glow">👥 Share</button>
                  </>
                )}
                <span className="text-xs px-3 py-1 bg-white/10 rounded text-gray-300">
                  {userRole === 'admin' ? '🔑 Admin' : userRole === 'edit' ? '✏️ Editor' : '👁️ Viewer'}
                </span>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-8">
          {userRole === 'read' && <div className="p-6 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 mb-4">📖 Read-only access</div>}
          <BlockNoteEditor initialContent={JSON.parse(document.content)} onChange={(content) => userRole !== 'read' && handleSave(content, document.title)} userRole={userRole} isEditable={userRole !== 'read'} />
        </div>

        {showLinkModal && isOwnerOrAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full border border-white/10">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Share with Link</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permission Level</label>
                  <select value={linkRole} onChange={(e) => setLinkRole(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                    <option value="read">👁️ View only</option>
                    <option value="edit">✏️ Can edit</option>
                    <option value="admin">🔑 Admin</option>
                  </select>
                </div>
                <button onClick={generateShareLink} className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg">Generate Link</button>
                {shareLink && (
                  <div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm break-all">{shareLink}</div>
                    <button onClick={copyToClipboard} className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg">📋 Copy Link</button>
                  </div>
                )}
                {sharingSuccess && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{sharingSuccess}</div>}
                <button onClick={() => setShowLinkModal(false)} className="w-full px-4 py-2 bg-white/10 text-white rounded-lg">Close</button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && isOwnerOrAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass-strong rounded-2xl p-8 max-w-2xl w-full border border-white/10">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Share Document</h2>
              <form onSubmit={handleShare} className="mb-8 pb-8 border-b border-white/10">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="user@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Permission</label>
                    <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white">
                      <option value="read">👁️ Read only</option>
                      <option value="edit">✏️ Can edit</option>
                      <option value="admin">🔑 Admin</option>
                    </select>
                  </div>
                  {sharingError && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{sharingError}</div>}
                  {sharingSuccess && <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">{sharingSuccess}</div>}
                  <button type="submit" className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg">Share Document</button>
                </div>
              </form>
              {permissions && permissions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Shared with ({permissions.length})</h3>
                  <div className="space-y-3">
                    {permissions.map((perm) => (
                      <div key={perm._id} className="flex items-center justify-between p-4 glass rounded-lg border border-white/10">
                        <div>
                          <p className="font-medium text-white">{perm.user?.email}</p>
                          <p className="text-sm text-gray-400">{perm.role === 'read' && '👁️ Read only'}{perm.role === 'edit' && '✏️ Can edit'}{perm.role === 'admin' && '🔑 Admin'}</p>
                        </div>
                        <button onClick={() => handleRemoveAccess(perm._id)} className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setShowShareModal(false)} className="mt-8 w-full px-4 py-2 bg-white/10 text-white rounded-lg">Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

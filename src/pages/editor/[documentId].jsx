import UserInfo from '../../components/UserInfo'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useQuery, useMutation } from 'convex/react'
import { useConvex } from "convex/react"
import { api } from '../../../convex/_generated/api'
import dynamic from 'next/dynamic'

const BlockNoteEditor = dynamic(() => import('../../components/BlockNoteEditor'), { ssr: false })

export default function EditorPage() {
  const router = useRouter()
  const { documentId } = router.query
  const [userId, setUserId] = useState(null)
  const [document, setDocument] = useState(null)
  const [userRole, setUserRole] = useState('read')
  const convex = useConvex()
  const lastFetchRef = useRef(null)
  const isUserEditingRef = useRef(false)
  const editTimeoutRef = useRef(null)

  useEffect(() => {
    const id = localStorage.getItem('userId')
    if (!id) router.push('/auth')
    else setUserId(id)
  }, [router])

  // Polling - pause while user is editing
  const fetchDocument = useCallback(async () => {
    if (!documentId || isUserEditingRef.current) return
    try {
      const doc = await convex.query(api.documents.getDocument, { documentId })
      if (doc) {
        const contentStr = JSON.stringify(doc.content)
        if (contentStr !== lastFetchRef.current) {
          console.log('Content updated!')
          lastFetchRef.current = contentStr
          setDocument(doc)
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
    }
  }, [documentId, convex])

  useEffect(() => {
    if (!documentId) return
    
    fetchDocument()
    const interval = setInterval(fetchDocument, 500)
    
    return () => clearInterval(interval)
  }, [documentId, fetchDocument])

  const permissions = useQuery(api.sharing.getDocumentPermissions, documentId ? { documentId } : 'skip')
  const activeUsers = useQuery(api.presence.getActiveUsers, documentId ? { documentId } : 'skip')
  const updateDocument = useMutation(api.documents.updateDocument)
  const saveContent = useMutation(api.realtime.saveContent)
  const shareDocument = useMutation(api.sharing.shareDocument)
  const removePermission = useMutation(api.sharing.removePermission)
  const updatePresence = useMutation(api.presence.updatePresence)
  const removePresence = useMutation(api.presence.removePresence)
  const saveTimeoutRef = useRef(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState('edit')
  const [sharingError, setSharingError] = useState('')
  const [sharingSuccess, setSharingSuccess] = useState('')
  const [linkRole, setLinkRole] = useState('edit')
  const [shareLink, setShareLink] = useState('')

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

  const handleSave = async (content, title) => {
    if (!documentId || !userId || userRole === 'read') return

    isUserEditingRef.current = true
    if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current)

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await saveContent({ documentId, content: JSON.stringify(content), userId })
        if (title) {
          await updateDocument({ documentId, content: JSON.stringify(content), title })
        }
      } catch (err) {
        console.error('Error saving:', err)
      }
    }, 800)

    editTimeoutRef.current = setTimeout(() => {
      isUserEditingRef.current = false
    }, 1500)
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
      await shareDocument({ documentId, userEmail: shareEmail, role: shareRole, sharedBy: userId })
      setSharingSuccess(`Shared with ${shareEmail}!`)
      setShareEmail('')
      setTimeout(() => setSharingSuccess(''), 3000)
    } catch (err) {
      setSharingError(err.message)
    }
  }

  const generateShareLink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    setShareLink(`${baseUrl}/document/${documentId}?role=${linkRole}`)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setSharingSuccess('Copied!')
    setTimeout(() => setSharingSuccess(''), 2000)
  }

  const handleRemoveAccess = async (permissionId) => {
    try {
      await removePermission({ permissionId, userId, documentId })
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
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        body { font-family: 'Space Grotesk', sans-serif; background: #0a0a0a; }
        .gradient-text { background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .neon-glow { box-shadow: 0 0 20px rgba(124, 58, 237, 0.5); }
      `}</style>

      <UserInfo />
      <div className="min-h-screen bg-black text-white">
        <nav className="glass border-b border-white/10 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white">← Back</button>
              <input type="text" defaultValue={document.title} onBlur={(e) => handleSave(JSON.parse(document.content), e.target.value)} className="text-xl font-semibold bg-transparent border-none outline-none text-white" placeholder="Untitled" disabled={userRole === 'read'} />
            </div>
            <div className="flex gap-3">
              {isOwnerOrAdmin && (
                <>
                  <button onClick={() => setShowLinkModal(true)} className="px-4 py-2 bg-cyan-600 text-white text-sm rounded">Link</button>
                  <button onClick={() => setShowShareModal(true)} className="px-4 py-2 bg-purple-600 text-white text-sm rounded">Share</button>
                </>
              )}
              <span className="text-xs px-3 py-1 bg-white/10 rounded">{userRole}</span>
            </div>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <BlockNoteEditor initialContent={JSON.parse(document.content)} onChange={(content) => userRole !== 'read' && handleSave(content, document.title)} userRole={userRole} isEditable={userRole !== 'read'} />
        </div>

        {showLinkModal && isOwnerOrAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass rounded-2xl p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Share Link</h2>
              <select value={linkRole} onChange={(e) => setLinkRole(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white mb-4">
                <option value="read">View</option>
                <option value="edit">Edit</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={generateShareLink} className="w-full px-6 py-3 bg-cyan-600 text-white mb-4">Generate</button>
              {shareLink && (
                <>
                  <div className="p-3 bg-white/5 border border-white/10 rounded text-sm break-all mb-3">{shareLink}</div>
                  <button onClick={copyToClipboard} className="w-full px-6 py-3 bg-purple-600 text-white mb-4">Copy</button>
                </>
              )}
              {sharingSuccess && <div className="p-3 bg-green-500/10 text-green-400 mb-4">{sharingSuccess}</div>}
              <button onClick={() => setShowLinkModal(false)} className="w-full px-4 py-2 bg-white/10 text-white rounded">Close</button>
            </div>
          </div>
        )}

        {showShareModal && isOwnerOrAdmin && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass rounded-2xl p-8 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-6 gradient-text">Share</h2>
              <form onSubmit={handleShare}>
                <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white mb-4" placeholder="user@example.com" />
                <select value={shareRole} onChange={(e) => setShareRole(e.target.value)} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white mb-4">
                  <option value="read">Read</option>
                  <option value="edit">Edit</option>
                  <option value="admin">Admin</option>
                </select>
                {sharingError && <div className="p-3 bg-red-500/10 text-red-400 mb-4">{sharingError}</div>}
                {sharingSuccess && <div className="p-3 bg-green-500/10 text-green-400 mb-4">{sharingSuccess}</div>}
                <button type="submit" className="w-full px-6 py-3 bg-purple-600 text-white mb-4">Share</button>
              </form>
              {permissions && permissions.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  {permissions.map((perm) => (
                    <div key={perm._id} className="flex justify-between items-center p-3 glass rounded mb-2">
                      <p>{perm.user?.email}</p>
                      <button onClick={() => handleRemoveAccess(perm._id)} className="text-sm bg-red-500/20 text-red-400 px-3 py-1 rounded">Remove</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowShareModal(false)} className="w-full mt-4 px-4 py-2 bg-white/10 text-white rounded">Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

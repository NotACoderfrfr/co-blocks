import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function UserInfo() {
  const [userId, setUserId] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId')
      setUserId(id)
      // Set initial position to bottom right
      setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 })
    }
  }, [])

  const user = useQuery(api.auth.getUser, userId ? { userId } : 'skip')

  const handleLogout = () => {
    localStorage.removeItem('userId')
    router.push('/auth/login')
  }

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragOffset, position])

  if (!user) return null

  return (
    <div
      className="fixed z-[9999] cursor-grab active:cursor-grabbing"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <button
        className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold hover:shadow-2xl transition-all hover:scale-110"
        onClick={() => setShowMenu(!showMenu)}
      >
        {user.email?.[0]?.toUpperCase()}
      </button>

      {showMenu && (
        <div className="absolute top-14 left-0 bg-gray-900 border border-gray-700 rounded-lg shadow-lg w-48 p-4">
          <div className="text-xs text-gray-400 mb-3 truncate break-all">{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function BlockNoteEditor({ initialContent, onChange, userRole, isEditable = true }) {
  const [mounted, setMounted] = useState(false)
  const editorRef = useRef(null)
  const lastContentRef = useRef(null)
  const isEditingRef = useRef(false)
  const updateTimeoutRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isReadOnly = !isEditable || userRole === 'read'

  const editor = useCreateBlockNote({
    initialContent: initialContent || [{ type: 'paragraph', content: 'Start writing...' }],
  })

  editorRef.current = editor

  // Update content ONLY when not editing and content changed
  useEffect(() => {
    if (!editor || !initialContent || isReadOnly || isEditingRef.current) return
    
    const contentStr = JSON.stringify(initialContent)
    if (contentStr === lastContentRef.current) return
    
    lastContentRef.current = contentStr

    // Debounce content update
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    updateTimeoutRef.current = setTimeout(() => {
      try {
        editor.replaceBlocks(editor.document, initialContent)
      } catch (e) {
        console.error('Update error:', e)
      }
    }, 100)

    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    }
  }, [initialContent, editor, isReadOnly])

  useEffect(() => {
    if (!editor || isReadOnly) return

    const handleChange = () => {
      isEditingRef.current = true
      onChange(editor.document)
      
      // Reset editing flag after 500ms of no changes
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = setTimeout(() => {
        isEditingRef.current = false
      }, 500)
    }

    editor.onChange(handleChange)

    return () => {
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current)
    }
  }, [editor, onChange, isReadOnly])

  if (!mounted) {
    return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
  }

  return (
    <>
      <style jsx global>{`
        .bn-container { background: transparent !important; }
        .bn-editor { background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; border-radius: 12px !important; padding: 24px !important; color: white !important; min-height: 500px; }
        .bn-editor.read-only { pointer-events: none !important; opacity: 0.8 !important; user-select: text !important; }
        .ProseMirror { color: white !important; }
        .ProseMirror p { color: rgba(255, 255, 255, 0.9) !important; }
        .ProseMirror h1 { color: rgba(255, 255, 255, 1) !important; font-size: 2em !important; }
        .ProseMirror h2 { color: rgba(255, 255, 255, 1) !important; font-size: 1.5em !important; }
        .ProseMirror h3 { color: rgba(255, 255, 255, 1) !important; font-size: 1.2em !important; }
      `}</style>

      <div className={isReadOnly ? 'read-only' : ''}>
        <BlockNoteView editor={editor} theme="dark" />
      </div>
    </>
  )
}

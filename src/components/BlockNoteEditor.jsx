import { useEffect, useState, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function BlockNoteEditor({ initialContent, onChange, userRole, isEditable = true }) {
  const [mounted, setMounted] = useState(false)
  const [activeStyles, setActiveStyles] = useState({})
  const [contextMenu, setContextMenu] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const fileInputRef = useRef(null)
  const lastContentRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isReadOnly = !isEditable || userRole === 'read'

  const editor = useCreateBlockNote({
    initialContent: initialContent || [{ type: 'paragraph', content: 'Start writing...' }],
  })

  // Update content from polling
  useEffect(() => {
    if (!editor || !initialContent) return
    
    const contentStr = JSON.stringify(initialContent)
    if (contentStr === lastContentRef.current) return
    
    lastContentRef.current = contentStr
    
    try {
      editor.replaceBlocks(editor.document, initialContent)
    } catch (e) {
      console.error('Error updating:', e)
    }
  }, [initialContent, editor])

  useEffect(() => {
    if (!editor || isReadOnly) return

    const handleChange = () => {
      onChange(editor.document)
    }

    editor.onChange(handleChange)
  }, [editor, onChange, isReadOnly])

  const insertBlock = (type) => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    
    if (type === 'codeBlock') {
      editor.insertBlocks([{ type: 'codeBlock', props: { language: 'javascript' }, content: [] }], currentBlock, 'after')
    } else {
      editor.insertBlocks([{ type }], currentBlock, 'after')
    }
  }

  const toggleStyle = (style) => {
    if (!editor || isReadOnly) return
    editor.toggleStyles({ [style]: true })
  }

  const handleContextMenu = (e) => {
    if (isReadOnly) e.preventDefault()
  }

  if (!mounted) {
    return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
  }

  return (
    <>
      <style jsx global>{`
        .bn-container { background: transparent !important; }
        .bn-editor { background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; border-radius: 12px !important; padding: 24px !important; color: white !important; min-height: 500px; }
        .bn-editor.read-only { pointer-events: none !important; opacity: 0.8 !important; }
        .ProseMirror { color: white !important; }
        .ProseMirror p { color: rgba(255, 255, 255, 0.9) !important; }
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: rgba(255, 255, 255, 1) !important; }
        .toolbar-btn { padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; cursor: pointer; }
        .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="space-y-4">
        {!isReadOnly && (
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => toggleStyle('bold')} className="toolbar-btn" disabled={isReadOnly}><strong>B</strong></button>
              <button onClick={() => toggleStyle('italic')} className="toolbar-btn" disabled={isReadOnly}><em>I</em></button>
              <button onClick={() => toggleStyle('underline')} className="toolbar-btn" disabled={isReadOnly}><u>U</u></button>
              <button onClick={() => insertBlock('bulletListItem')} className="toolbar-btn" disabled={isReadOnly}>• List</button>
              <button onClick={() => insertBlock('codeBlock')} className="toolbar-btn" disabled={isReadOnly}>Code</button>
            </div>
          </div>
        )}

        <div onContextMenu={handleContextMenu} className={isReadOnly ? 'read-only' : ''}>
          <BlockNoteView editor={editor} theme="dark" />
        </div>
      </div>
    </>
  )
}

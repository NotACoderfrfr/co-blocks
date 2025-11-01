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
  const editorRef = useRef(null)
  const lastContentRef = useRef(null)
  const editorContainerRef = useRef(null)
  const updateDebounceRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isReadOnly = !isEditable || userRole === 'read'

  const editor = useCreateBlockNote({
    initialContent: initialContent || [{ type: 'paragraph', content: 'Start writing...' }],
  })

  editorRef.current = editor

  // Real-time polling - always update but safely
  useEffect(() => {
    if (!editor || !initialContent || isReadOnly) return
    
    const contentStr = JSON.stringify(initialContent)
    if (contentStr === lastContentRef.current) return
    
    lastContentRef.current = contentStr

    // Check if editor has focus
    const editorElement = editorContainerRef.current?.querySelector('.ProseMirror')
    const hasFocus = editorElement && editorElement.contains(document.activeElement)

    if (hasFocus) {
      // Debounce update if focused
      if (updateDebounceRef.current) clearTimeout(updateDebounceRef.current)
      updateDebounceRef.current = setTimeout(() => {
        try {
          editor.replaceBlocks(editor.document, initialContent)
        } catch (e) {
          console.error('Error updating:', e)
        }
      }, 500)
    } else {
      // Update immediately if not focused
      try {
        editor.replaceBlocks(editor.document, initialContent)
      } catch (e) {
        console.error('Error updating:', e)
      }
    }
  }, [initialContent, editor, isReadOnly])

  useEffect(() => {
    if (!editor || isReadOnly) return

    const handleChange = () => {
      onChange(editor.document)
    }

    editor.onChange(handleChange)
  }, [editor, onChange, isReadOnly])

  const toggleStyle = (style) => {
    if (!editor || isReadOnly) return
    editor.toggleStyles({ [style]: true })
  }

  const setHeading = (level) => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    editor.updateBlock(currentBlock, { type: 'heading', props: { level } })
  }

  const insertBlock = (type) => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    
    if (type === 'codeBlock') {
      editor.insertBlocks([{ type: 'codeBlock', props: { language: 'javascript' }, content: [] }], currentBlock, 'after')
    } else {
      editor.insertBlocks([{ type }], currentBlock, 'after')
    }
  }

  const insertImageFromUrl = () => {
    if (isReadOnly) return
    const url = prompt('Enter image URL:')
    if (url) {
      const currentBlock = editor.getTextCursorPosition().block
      editor.insertBlocks([{ type: 'image', props: { url } }], currentBlock, 'after')
    }
    setShowImageModal(false)
  }

  const insertImageFromFile = () => {
    if (isReadOnly) return
    fileInputRef.current?.click()
    setShowImageModal(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const currentBlock = editor.getTextCursorPosition().block
        editor.insertBlocks([{ type: 'image', props: { url: event.target.result } }], currentBlock, 'after')
      }
      reader.readAsDataURL(file)
    }
  }

  const deleteBlock = () => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    editor.removeBlocks([currentBlock])
    setContextMenu(null)
  }

  const handleContextMenu = (e) => {
    if (isReadOnly) {
      e.preventDefault()
      return
    }
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  if (!mounted) {
    return <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
  }

  return (
    <>
      <style jsx global>{`
        .bn-container { background: transparent !important; }
        .bn-editor { background: rgba(255, 255, 255, 0.03) !important; border: 1px solid rgba(255, 255, 255, 0.05) !important; border-radius: 12px !important; padding: 24px !important; color: white !important; min-height: 500px; }
        .bn-editor.read-only { pointer-events: none !important; opacity: 0.7 !important; user-select: text !important; }
        .ProseMirror { color: white !important; }
        .ProseMirror p { color: rgba(255, 255, 255, 0.9) !important; }
        .ProseMirror h1 { color: rgba(255, 255, 255, 1) !important; font-size: 2em !important; font-weight: 700 !important; }
        .ProseMirror h2 { color: rgba(255, 255, 255, 1) !important; font-size: 1.5em !important; font-weight: 600 !important; }
        .ProseMirror h3 { color: rgba(255, 255, 255, 1) !important; font-size: 1.2em !important; font-weight: 600 !important; }
        .toolbar-btn { padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; color: rgba(255, 255, 255, 0.9); font-size: 14px; cursor: pointer; transition: all 0.2s; }
        .toolbar-btn:hover:not(:disabled) { background: rgba(124, 58, 237, 0.2); border-color: rgba(167, 139, 250, 0.3); }
        .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .toolbar-btn.active { background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(236, 72, 153, 0.5)) !important; box-shadow: 0 0 15px rgba(124, 58, 237, 0.4) !important; }
      `}</style>

      <div className="space-y-4">
        {!isReadOnly && (
          <div className="glass rounded-lg p-3 border border-white/10" style={{background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)'}}>
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button onClick={() => toggleStyle('bold')} className="toolbar-btn" title="Bold"><strong>B</strong></button>
                <button onClick={() => toggleStyle('italic')} className="toolbar-btn" title="Italic"><em>I</em></button>
                <button onClick={() => toggleStyle('underline')} className="toolbar-btn" title="Underline"><u>U</u></button>
                <button onClick={() => toggleStyle('strike')} className="toolbar-btn" title="Strike"><s>S</s></button>
                <button onClick={() => toggleStyle('code')} className="toolbar-btn" title="Code">{'</>'}</button>
              </div>
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button onClick={() => setHeading(1)} className="toolbar-btn" title="H1">H1</button>
                <button onClick={() => setHeading(2)} className="toolbar-btn" title="H2">H2</button>
                <button onClick={() => setHeading(3)} className="toolbar-btn" title="H3">H3</button>
              </div>
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button onClick={() => insertBlock('bulletListItem')} className="toolbar-btn" title="Bullet">• List</button>
                <button onClick={() => insertBlock('numberedListItem')} className="toolbar-btn" title="Number">1. List</button>
                <button onClick={() => insertBlock('checkListItem')} className="toolbar-btn" title="Todo">☑ Todo</button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => insertBlock('codeBlock')} className="toolbar-btn" title="Code">Code</button>
                <button onClick={() => insertBlock('table')} className="toolbar-btn" title="Table">Table</button>
                <button onClick={() => setShowImageModal(true)} className="toolbar-btn" title="Image">Image</button>
              </div>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
            📖 Read-only access
          </div>
        )}

        <div ref={editorContainerRef} onContextMenu={handleContextMenu} className={isReadOnly ? 'read-only' : ''}>
          <BlockNoteView editor={editor} theme="dark" editable={!isReadOnly} />
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />

        {showImageModal && !isReadOnly && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10">
              <h2 className="text-2xl font-bold mb-6" style={{background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Insert Image</h2>
              <div className="space-y-3">
                <button onClick={insertImageFromUrl} className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg">URL</button>
                <button onClick={insertImageFromFile} className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg">Upload</button>
                <button onClick={() => setShowImageModal(false)} className="w-full px-4 py-2 bg-white/10 text-white rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {contextMenu && !isReadOnly && (
          <div style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 1000 }} className="rounded-lg border border-red-500/30">
            <div style={{background: 'rgba(20, 20, 20, 0.95)'}}>
              <button onClick={deleteBlock} className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20">🗑️ Delete</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

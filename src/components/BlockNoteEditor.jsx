import { useEffect, useState, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function BlockNoteEditor({ initialContent, onChange, userRole }) {
  const [mounted, setMounted] = useState(false)
  const [activeStyles, setActiveStyles] = useState({})
  const [contextMenu, setContextMenu] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const lastContentRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        type: 'paragraph',
        content: 'Start writing...',
      },
    ],
  })

  editorRef.current = editor

  // Update editor content when it changes from real-time polling
  useEffect(() => {
    if (!editor || !initialContent) return
    
    const contentStr = JSON.stringify(initialContent)
    if (contentStr === lastContentRef.current) return
    
    lastContentRef.current = contentStr
    
    // Only update if different
    try {
      editor.replaceBlocks(editor.document, initialContent)
    } catch (e) {
      console.error('Error updating content:', e)
    }
  }, [initialContent, editor])

  // Update active styles when selection changes
  useEffect(() => {
    if (!editor) return

    let animationFrameId

    const updateStyles = () => {
      animationFrameId = requestAnimationFrame(() => {
        try {
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0 && selection.toString().length > 0) {
            const styles = editor.getActiveStyles()
            setActiveStyles(styles || {})
          }
        } catch (e) {
          setActiveStyles({})
        }
      })
    }

    const handleSelectionChange = () => {
      updateStyles()
    }

    const handleChange = () => {
      updateStyles()
      const content = editor.document
      onChange(content)
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    editor.onChange(handleChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [editor, onChange])

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const insertBlock = (type) => {
    if (!editor) return
    
    const currentBlock = editor.getTextCursorPosition().block
    
    if (type === 'table') {
      editor.insertBlocks(
        [{
          type: 'table',
          content: {
            type: 'tableContent',
            rows: [
              {
                cells: [
                  [{ type: 'text', text: 'Cell 1', styles: {} }],
                  [{ type: 'text', text: 'Cell 2', styles: {} }],
                ]
              },
              {
                cells: [
                  [{ type: 'text', text: 'Cell 3', styles: {} }],
                  [{ type: 'text', text: 'Cell 4', styles: {} }],
                ]
              }
            ]
          }
        }],
        currentBlock,
        'after'
      )
    } else if (type === 'codeBlock') {
      editor.insertBlocks(
        [{
          type: 'codeBlock',
          props: {
            language: 'javascript'
          },
          content: []
        }],
        currentBlock,
        'after'
      )
    } else if (type === 'image') {
      setShowImageModal(true)
    } else {
      editor.insertBlocks(
        [{ type }],
        currentBlock,
        'after'
      )
    }
  }

  const insertImageFromUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      const currentBlock = editor.getTextCursorPosition().block
      editor.insertBlocks(
        [{
          type: 'image',
          props: {
            url: url
          }
        }],
        currentBlock,
        'after'
      )
    }
    setShowImageModal(false)
  }

  const insertImageFromFile = () => {
    fileInputRef.current?.click()
    setShowImageModal(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const currentBlock = editor.getTextCursorPosition().block
        editor.insertBlocks(
          [{
            type: 'image',
            props: {
              url: event.target.result
            }
          }],
          currentBlock,
          'after'
        )
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleStyle = (style) => {
    if (!editor) return
    editor.toggleStyles({ [style]: true })
    
    setTimeout(() => {
      const styles = editor.getActiveStyles()
      setActiveStyles(styles || {})
    }, 10)
  }

  const setHeading = (level) => {
    if (!editor) return
    const currentBlock = editor.getTextCursorPosition().block
    editor.updateBlock(currentBlock, {
      type: 'heading',
      props: { level }
    })
  }

  const deleteBlock = () => {
    if (!editor) return
    const currentBlock = editor.getTextCursorPosition().block
    editor.removeBlocks([currentBlock])
    setContextMenu(null)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    })
  }

  if (!mounted) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const isReadOnly = userRole === 'read'

  return (
    <>
      <style jsx global>{`
        .bn-container {
          background: transparent !important;
        }
        
        .bn-editor {
          background: rgba(255, 255, 255, 0.03) !important;
          border: 1px solid rgba(255, 255, 255, 0.05) !important;
          border-radius: 12px !important;
          padding: 24px !important;
          color: white !important;
          min-height: 500px;
        }
        
        .bn-editor.read-only {
          opacity: 0.8 !important;
          pointer-events: none !important;
        }
        
        .bn-block-content {
          color: white !important;
        }
        
        .ProseMirror {
          color: white !important;
        }
        
        .ProseMirror p {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .ProseMirror h1 {
          color: rgba(255, 255, 255, 1) !important;
          font-size: 2em !important;
          font-weight: 700 !important;
          margin: 0.5em 0 !important;
        }
        
        .ProseMirror h2 {
          color: rgba(255, 255, 255, 1) !important;
          font-size: 1.5em !important;
          font-weight: 600 !important;
          margin: 0.5em 0 !important;
        }
        
        .ProseMirror h3 {
          color: rgba(255, 255, 255, 1) !important;
          font-size: 1.2em !important;
          font-weight: 600 !important;
          margin: 0.5em 0 !important;
        }
        
        .ProseMirror code {
          background: rgba(167, 139, 250, 0.2) !important;
          color: #a78bfa !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          font-family: 'Courier New', monospace !important;
        }
        
        .ProseMirror pre {
          background: rgba(20, 20, 20, 0.8) !important;
          border: 1px solid rgba(167, 139, 250, 0.3) !important;
          padding: 16px !important;
          border-radius: 8px !important;
          overflow-x: auto !important;
          margin: 1em 0 !important;
        }
        
        .ProseMirror pre code {
          background: transparent !important;
          color: #06b6d4 !important;
          padding: 0 !important;
          font-family: 'Courier New', monospace !important;
          font-size: 14px !important;
        }
        
        .ProseMirror table {
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 1em 0 !important;
        }
        
        .ProseMirror table td,
        .ProseMirror table th {
          border: 1px solid rgba(167, 139, 250, 0.3) !important;
          padding: 8px 12px !important;
          color: white !important;
          background: rgba(255, 255, 255, 0.02) !important;
        }
        
        .ProseMirror table th {
          background: rgba(124, 58, 237, 0.2) !important;
          font-weight: 600 !important;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em !important;
          margin: 0.5em 0 !important;
        }
        
        .ProseMirror li {
          color: rgba(255, 255, 255, 0.9) !important;
          margin: 0.25em 0 !important;
        }
        
        .bn-block-content::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        
        .bn-slash-menu {
          background: rgba(20, 20, 20, 0.95) !important;
          border: 1px solid rgba(167, 139, 250, 0.3) !important;
          backdrop-filter: blur(10px) !important;
        }
        
        .bn-slash-menu-item {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        
        .bn-slash-menu-item:hover {
          background: rgba(124, 58, 237, 0.2) !important;
        }
        
        .toolbar-btn {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toolbar-btn:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(167, 139, 250, 0.3);
        }
        
        .toolbar-btn.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.5), rgba(236, 72, 153, 0.5)) !important;
          border-color: rgba(167, 139, 250, 0.8) !important;
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.4) !important;
          color: white !important;
        }
        
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="space-y-4">
        {/* Custom Toolbar */}
        {!isReadOnly && (
          <div className="glass rounded-lg p-3 border border-white/10" style={{background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)'}}>
            <div className="flex flex-wrap gap-2">
              {/* Text Formatting */}
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button
                  onClick={() => toggleStyle('bold')}
                  className={`toolbar-btn ${activeStyles.bold ? 'active' : ''}`}
                  title="Bold (Ctrl+B)"
                  disabled={isReadOnly}
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={() => toggleStyle('italic')}
                  className={`toolbar-btn ${activeStyles.italic ? 'active' : ''}`}
                  title="Italic (Ctrl+I)"
                  disabled={isReadOnly}
                >
                  <em>I</em>
                </button>
                <button
                  onClick={() => toggleStyle('underline')}
                  className={`toolbar-btn ${activeStyles.underline ? 'active' : ''}`}
                  title="Underline (Ctrl+U)"
                  disabled={isReadOnly}
                >
                  <u>U</u>
                </button>
                <button
                  onClick={() => toggleStyle('strike')}
                  className={`toolbar-btn ${activeStyles.strike ? 'active' : ''}`}
                  title="Strikethrough"
                  disabled={isReadOnly}
                >
                  <s>S</s>
                </button>
                <button
                  onClick={() => toggleStyle('code')}
                  className={`toolbar-btn ${activeStyles.code ? 'active' : ''}`}
                  title="Inline Code"
                  disabled={isReadOnly}
                >
                  {'</>'}
                </button>
              </div>

              {/* Headings */}
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button
                  onClick={() => setHeading(1)}
                  className="toolbar-btn"
                  title="Heading 1"
                  disabled={isReadOnly}
                >
                  H1
                </button>
                <button
                  onClick={() => setHeading(2)}
                  className="toolbar-btn"
                  title="Heading 2"
                  disabled={isReadOnly}
                >
                  H2
                </button>
                <button
                  onClick={() => setHeading(3)}
                  className="toolbar-btn"
                  title="Heading 3"
                  disabled={isReadOnly}
                >
                  H3
                </button>
              </div>

              {/* Lists */}
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button
                  onClick={() => insertBlock('bulletListItem')}
                  className="toolbar-btn"
                  title="Bullet List"
                  disabled={isReadOnly}
                >
                  • List
                </button>
                <button
                  onClick={() => insertBlock('numberedListItem')}
                  className="toolbar-btn"
                  title="Numbered List"
                  disabled={isReadOnly}
                >
                  1. List
                </button>
                <button
                  onClick={() => insertBlock('checkListItem')}
                  className="toolbar-btn"
                  title="Todo List"
                  disabled={isReadOnly}
                >
                  ☑ Todo
                </button>
              </div>

              {/* Blocks */}
              <div className="flex gap-1">
                <button
                  onClick={() => insertBlock('codeBlock')}
                  className="toolbar-btn"
                  title="Code Block"
                  disabled={isReadOnly}
                >
                  {'{ } Code'}
                </button>
                <button
                  onClick={() => insertBlock('table')}
                  className="toolbar-btn"
                  title="Table"
                  disabled={isReadOnly}
                >
                  ▦ Table
                </button>
                <button
                  onClick={() => insertBlock('image')}
                  className="toolbar-btn"
                  title="Image"
                  disabled={isReadOnly}
                >
                  🖼 Image
                </button>
              </div>
            </div>
          </div>
        )}

        {isReadOnly && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
            📖 You have read-only access to this document
          </div>
        )}

        {/* Editor */}
        <div onContextMenu={handleContextMenu} className={isReadOnly ? 'read-only' : ''}>
          <BlockNoteView editor={editor} theme="dark" />
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Image Upload Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
            <div className="glass rounded-2xl p-8 max-w-md w-full border border-white/10" style={{background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)'}}>
              <h2 className="text-2xl font-bold mb-6 text-center" style={{background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #06b6d4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Insert Image
              </h2>
              <div className="space-y-3">
                <button
                  onClick={insertImageFromUrl}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                  🔗 From URL
                </button>
                <button
                  onClick={insertImageFromFile}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all"
                >
                  📁 Upload from Device
                </button>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Context Menu */}
        {contextMenu && !isReadOnly && (
          <div
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 1000,
            }}
            className="rounded-lg border border-red-500/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{background: 'rgba(20, 20, 20, 0.95)', backdropFilter: 'blur(10px)'}}>
              <button
                onClick={deleteBlock}
                className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-500/20 transition-colors flex items-center space-x-2"
              >
                <span>🗑️</span>
                <span>Delete Block</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

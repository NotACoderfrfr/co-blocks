import { useEffect, useState, useRef } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

export default function BlockNoteEditor({ initialContent, onChange, userRole, isEditable = true }) {
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const lastContentRef = useRef(JSON.stringify(initialContent))
  const isEditingRef = useRef(false)
  const editTimeoutRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isReadOnly = !isEditable || userRole === 'read'

  const editor = useCreateBlockNote({
    initialContent: initialContent || [{ type: 'paragraph', content: 'Start writing...' }],
  })

  editorRef.current = editor

  useEffect(() => {
    if (!editor || !initialContent || isReadOnly || isEditingRef.current) return
    
    const newContent = JSON.stringify(initialContent)
    if (newContent === lastContentRef.current) return
    
    lastContentRef.current = newContent

    try {
      editor.replaceBlocks(editor.document, initialContent)
    } catch (e) {
      console.error('Update error:', e)
    }
  }, [initialContent, editor, isReadOnly])

  useEffect(() => {
    if (!editor || isReadOnly) return

    const handleChange = () => {
      isEditingRef.current = true
      const newContent = editor.document
      lastContentRef.current = JSON.stringify(newContent)
      onChange(newContent)
      
      if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current)
      editTimeoutRef.current = setTimeout(() => {
        isEditingRef.current = false
      }, 2000)
    }

    editor.onChange(handleChange)

    return () => {
      if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current)
    }
  }, [editor, onChange, isReadOnly])

  const toggleStyle = (style) => {
    if (!editor || isReadOnly) return
    editor.toggleStyles({ [style]: true })
  }

  const setHeading = (level) => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    if (currentBlock) {
      editor.updateBlock(currentBlock, { type: 'heading', props: { level } })
    }
  }

  const insertBlock = (type) => {
    if (!editor || isReadOnly) return
    const currentBlock = editor.getTextCursorPosition().block
    if (currentBlock) {
      if (type === 'codeBlock') {
        editor.insertBlocks([{ type: 'codeBlock', props: { language: 'javascript' }, content: [] }], currentBlock, 'after')
      } else {
        editor.insertBlocks([{ type }], currentBlock, 'after')
      }
    }
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
        .ProseMirror h1, .ProseMirror h2, .ProseMirror h3 { color: rgba(255, 255, 255, 1) !important; }
        .toolbar-btn { padding: 8px 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; cursor: pointer; }
        .toolbar-btn:hover { background: rgba(124, 58, 237, 0.2); }
      `}</style>

      <div className="space-y-4">
        {!isReadOnly && (
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="flex flex-wrap gap-2">
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button onClick={() => toggleStyle('bold')} className="toolbar-btn"><strong>B</strong></button>
                <button onClick={() => toggleStyle('italic')} className="toolbar-btn"><em>I</em></button>
                <button onClick={() => toggleStyle('underline')} className="toolbar-btn"><u>U</u></button>
                <button onClick={() => toggleStyle('strike')} className="toolbar-btn"><s>S</s></button>
              </div>
              <div className="flex gap-1 border-r border-white/10 pr-2">
                <button onClick={() => setHeading(1)} className="toolbar-btn">H1</button>
                <button onClick={() => setHeading(2)} className="toolbar-btn">H2</button>
                <button onClick={() => setHeading(3)} className="toolbar-btn">H3</button>
              </div>
              <div className="flex gap-1">
                <button onClick={() => insertBlock('bulletListItem')} className="toolbar-btn">• List</button>
                <button onClick={() => insertBlock('codeBlock')} className="toolbar-btn">Code</button>
              </div>
            </div>
          </div>
        )}

        {isReadOnly && <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">Read-only</div>}

        <div className={isReadOnly ? 'read-only' : ''}>
          <BlockNoteView editor={editor} theme="dark" editable={!isReadOnly} />
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} />
      </div>
    </>
  )
}

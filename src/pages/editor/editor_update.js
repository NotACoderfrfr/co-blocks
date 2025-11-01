// Replace after line 4
import { useConvex } from 'convex/react'

// Then replace the document query (around line 33-36) with:
const convex = useConvex()
const [document, setDocument] = useState(null)

useEffect(() => {
  if (!documentId) return

  // Fetch immediately
  const fetchDoc = async () => {
    const doc = await convex.query(api.documents.getDocument, { documentId })
    setDocument(doc)
  }

  fetchDoc()

  // Poll every 500ms
  const interval = setInterval(fetchDoc, 500)
  return () => clearInterval(interval)
}, [documentId, convex])

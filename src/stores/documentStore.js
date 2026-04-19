import { reactive } from 'vue'

const DOCS_KEY   = 'dw_documents'
const ACTIVE_KEY = 'dw_active_doc'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadDocs() {
  try {
    const stored = JSON.parse(localStorage.getItem(DOCS_KEY) || '[]')
    if (stored.length) return stored
  } catch {}
  return [{ id: uid(), title: 'Untitled Document', content: '' }]
}

const docs = loadDocs()

export const documentStore = reactive({
  documents: docs,
  activeId: (() => {
    const saved = localStorage.getItem(ACTIVE_KEY)
    return (saved && docs.some(d => d.id === saved)) ? saved : docs[0].id
  })(),

  get active() {
    return this.documents.find(d => d.id === this.activeId) || this.documents[0]
  },

  setActive(id) {
    this.activeId = id
    localStorage.setItem(ACTIVE_KEY, id)
  },

  newDocument() {
    const doc = { id: uid(), title: 'Untitled Document', content: '' }
    this.documents.push(doc)
    this.setActive(doc.id)
    this._save()
    return doc
  },

  close(id) {
    if (this.documents.length <= 1) return
    const idx = this.documents.findIndex(d => d.id === id)
    if (idx < 0) return
    if (this.activeId === id) {
      this.setActive(this.documents[idx > 0 ? idx - 1 : 1].id)
    }
    this.documents.splice(idx, 1)
    this._save()
  },

  updateContent(id, content) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) { doc.content = content; this._save() }
  },

  updateTitle(id, title) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) { doc.title = title; this._save() }
  },

  _save() {
    localStorage.setItem(DOCS_KEY, JSON.stringify(this.documents))
  },
})

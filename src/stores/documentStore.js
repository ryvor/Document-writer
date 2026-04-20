import { reactive } from 'vue'
import TurndownService from 'turndown'

const DOCS_KEY   = 'dw_documents'
const ACTIVE_KEY = 'dw_active_doc'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function slugify(title) {
  const s = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '')
  return s || 'document'
}

function defaultMetadata(existing = {}) {
  return {
    author:      '',
    description: '',
    tags:        '',
    created:     new Date().toISOString(),
    modified:    new Date().toISOString(),
    ...existing,
  }
}

function defaultEsign(existing = {}) {
  return {
    signerName:    '',
    signerEmail:   '',
    signerTitle:   '',
    signerCompany: '',
    signatureNote: '',
    ...existing,
  }
}

function normalise(d) {
  const title = d.title || 'Untitled Document'

  // Migration: old versions stored TipTap HTML in `content`.
  let markdown = typeof d.markdown === 'string' ? d.markdown : ''
  if (!markdown && typeof d.content === 'string' && d.content.trim()) {
    const turndown = new TurndownService({
      codeBlockStyle: 'fenced',
      headingStyle: 'atx',
      bulletListMarker: '-',
      emDelimiter: '*',
      strongDelimiter: '**',
    })

    const html = d.content
      // Convert shortcode spans to tokens before turndown.
      .replace(/<span[^>]*data-type="shortcode"[^>]*data-shortcode-key="([^"]+)"[^>]*>.*?<\/span>/g, (_m, key) => `{{${String(key).toLowerCase()}}}`)
      .replace(/<span[^>]*data-type="shortcode"[^>]*data-shortcode-key="([^"]+)"[^>]*\/>/g, (_m, key) => `{{${String(key).toLowerCase()}}}`)

    try {
      markdown = turndown.turndown(html)
    } catch {
      markdown = ''
    }
  }

  return {
    shortcodeVars: {},
    metadata: defaultMetadata(),
    esign:    defaultEsign(),
    dirty:    false,
    filenameSlug: '',
    markdown: '',
    ...d,
    title,
    filenameSlug: d.filenameSlug ? String(d.filenameSlug) : slugify(title),
    markdown,
    shortcodeVars: (d.shortcodeVars && typeof d.shortcodeVars === 'object') ? d.shortcodeVars : {},
    metadata: defaultMetadata(d.metadata),
    esign:    defaultEsign(d.esign),
    dirty: false,  // always start clean on load
    signAreas: (d.signAreas && typeof d.signAreas === 'object' && !Array.isArray(d.signAreas)) ? d.signAreas : {},
    signModeLocked: d.signModeLocked === true,
  }
}

function loadDocs() {
  try {
    const stored = JSON.parse(localStorage.getItem(DOCS_KEY) || '[]')
    if (stored.length) return stored.map(normalise)
  } catch {}
  return [normalise({ id: uid(), title: 'Untitled Document', markdown: '' })]
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
    const doc = normalise({ id: uid(), title: 'Untitled Document', markdown: '' })
    this.documents.push(doc)
    this.setActive(doc.id)
    this._save()
    return doc
  },

  close(id) {
    const idx = this.documents.findIndex(d => d.id === id)
    if (idx < 0) return
    if (this.documents.length > 1 && this.activeId === id) {
      this.setActive(this.documents[idx > 0 ? idx - 1 : 1].id)
    }
    this.documents.splice(idx, 1)
    this._save()
  },

  nextDocument() {
    if (this.documents.length <= 1) return
    const idx = this.documents.findIndex(d => d.id === this.activeId)
    this.setActive(this.documents[(idx + 1) % this.documents.length].id)
  },

  prevDocument() {
    if (this.documents.length <= 1) return
    const idx = this.documents.findIndex(d => d.id === this.activeId)
    this.setActive(this.documents[(idx - 1 + this.documents.length) % this.documents.length].id)
  },

  updateMarkdown(id, markdown) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) {
      doc.markdown = markdown
      doc.dirty   = true
      if (doc.metadata) doc.metadata.modified = new Date().toISOString()
      this._save()
    }
  },

  updateTitle(id, title) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) {
      doc.title = title
      doc.filenameSlug = slugify(title)
      doc.dirty = true
      this._save()
    }
  },

  updateMetadata(id, patch) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) {
      doc.metadata = { ...doc.metadata, ...patch }
      this._save()
    }
  },

  updateEsign(id, patch) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) {
      doc.esign = { ...doc.esign, ...patch }
      this._save()
    }
  },

  setShortcodeVar(id, key, value) {
    const doc = this.documents.find(d => d.id === id)
    if (!doc) return
    if (!doc.shortcodeVars || typeof doc.shortcodeVars !== 'object') doc.shortcodeVars = {}
    doc.shortcodeVars[key] = value
    this._save()
  },

  removeShortcodeVar(id, key) {
    const doc = this.documents.find(d => d.id === id)
    if (!doc?.shortcodeVars || typeof doc.shortcodeVars !== 'object') return
    delete doc.shortcodeVars[key]
    this._save()
  },

  setSignArea(docId, id, { name, signedAt }) {
    const doc = this.documents.find(d => d.id === docId)
    if (!doc) return
    if (!doc.signAreas || typeof doc.signAreas !== 'object') doc.signAreas = {}
    doc.signAreas[id] = { name, signedAt }
    this._save()
  },

  clearSignArea(docId, id) {
    const doc = this.documents.find(d => d.id === docId)
    if (!doc?.signAreas) return
    delete doc.signAreas[id]
    this._save()
  },

  setSignModeLocked(docId, locked) {
    const doc = this.documents.find(d => d.id === docId)
    if (doc) { doc.signModeLocked = !!locked; this._save() }
  },

  importDwdoc(payload) {
    const { doc } = payload
    const newDoc = normalise({
      id: uid(),
      title: doc.title || 'Untitled Document',
      markdown: doc.markdown || '',
      metadata: doc.metadata || {},
      shortcodeVars: doc.shortcodeVars || {},
      esign: doc.esign || {},
      signAreas: doc.signAreas || {},
      signModeLocked: true,
    })
    this.documents.push(newDoc)
    this.setActive(newDoc.id)
    this._save()
    return newDoc
  },

  clearDirty(id) {
    const doc = this.documents.find(d => d.id === id)
    if (doc) { doc.dirty = false; this._save() }
  },

  _save() {
    localStorage.setItem(DOCS_KEY, JSON.stringify(this.documents))
  },
})

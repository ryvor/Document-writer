import { documentStore } from '../stores/documentStore.js'

const REGISTRY = new WeakMap()

function register(view, nodeView) {
  let set = REGISTRY.get(view)
  if (!set) { set = new Set(); REGISTRY.set(view, set) }
  set.add(nodeView)
}

function unregister(view, nodeView) {
  const set = REGISTRY.get(view)
  if (!set) return
  set.delete(nodeView)
  if (set.size === 0) REGISTRY.delete(view)
}

export function syncSignAreaNodeViews(view) {
  const set = REGISTRY.get(view)
  if (!set) return
  for (const nv of set) nv.sync()
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export class SignAreaNodeView {
  constructor(node, view, getPos, docId, onSignClick) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.docId = docId
    this.onSignClick = onSignClick

    this.dom = document.createElement('div')
    this.dom.className = 'sign-area-node'

    this.dom.addEventListener('click', () => {
      if (typeof this.onSignClick === 'function') {
        this.onSignClick(this.docId, this.node.attrs.id)
      }
    })

    register(this.view, this)
    this.sync()
  }

  sync() {
    const doc = documentStore.documents.find(d => d.id === this.docId) || documentStore.active
    const signed = doc?.signAreas?.[this.node.attrs.id]
    const label = this.node.attrs.label

    if (signed?.name) {
      const date = signed.signedAt
        ? new Date(signed.signedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
        : ''
      this.dom.innerHTML = `
        <div class="sign-area-stamp">
          ${label ? `<div class="sign-area-label">${escHtml(label)}</div>` : ''}
          <div class="sign-area-stamp__name">${escHtml(signed.name)}</div>
          ${date ? `<div class="sign-area-stamp__date">Signed: ${escHtml(date)}</div>` : ''}
        </div>
      `
      this.dom.classList.add('is-signed')
      this.dom.classList.remove('is-unsigned')
    } else {
      this.dom.innerHTML = `
        <div class="sign-area-unsigned">
          ${label ? `<div class="sign-area-label">${escHtml(label)}</div>` : ''}
          <div class="sign-area-hint">Click here to sign</div>
        </div>
      `
      this.dom.classList.add('is-unsigned')
      this.dom.classList.remove('is-signed')
    }
  }

  selectNode() {
    this.dom.classList.add('is-selected')
  }

  deselectNode() {
    this.dom.classList.remove('is-selected')
  }

  update(node) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.sync()
    return true
  }

  destroy() {
    unregister(this.view, this)
  }

  ignoreMutation() {
    return true
  }
}

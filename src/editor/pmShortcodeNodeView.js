import { resolveShortcodeValue } from '../utils/resolveShortcode.js'
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

export function syncShortcodeNodeViews(view) {
  const set = REGISTRY.get(view)
  if (!set) return
  for (const nv of set) nv.sync()
}

function getVarsForDoc(docId) {
  const doc = documentStore.documents.find(d => d.id === docId) || documentStore.active
  return doc?.shortcodeVars || {}
}

function isCursorNear(view, getPos, node) {
  const sel = view.state.selection
  const from = sel.from
  const to = sel.to
  const pos = getPos()
  const start = pos
  const end = pos + node.nodeSize
  if (from !== to) return from <= end && to >= start
  const cursor = from
  const dist = cursor < start ? (start - cursor) : cursor > end ? (cursor - end) : 0
  // Only treat as "near" when the cursor is directly adjacent to the atom node.
  // This allows the value to show as soon as the cursor moves away (e.g. after typing a trailing space).
  return dist === 0
}

export class ShortcodeNodeView {
  constructor(node, view, getPos, docId) {
    this.node = node
    this.view = view
    this.getPos = getPos
    this.docId = docId

    this.dom = document.createElement('span')
    this.dom.className = 'sc-node'
    this.dom.dataset.type = 'shortcode'
    this.dom.dataset.shortcodeKey = node.attrs.key

    this._hovered = false

    this.dom.addEventListener('mouseenter', () => { this._hovered = true; this.sync() })
    this.dom.addEventListener('mouseleave', () => { this._hovered = false; this.sync() })

    register(this.view, this)
    this.sync()
  }

  sync() {
    const near = isCursorNear(this.view, this.getPos, this.node)
    const showKey = this._hovered || near

    this.dom.dataset.shortcodeKey = this.node.attrs.key
    const vars = getVarsForDoc(this.docId)
    const value = resolveShortcodeValue(this.node.attrs.key, vars)

    this.dom.classList.toggle('show-key', showKey)
    this.dom.classList.toggle('show-value', !showKey)
    this.dom.textContent = showKey ? `{{${this.node.attrs.key}}}` : value
  }

  selectNode() {
    this.dom.classList.add('is-selected')
    this.sync()
  }

  deselectNode() {
    this.dom.classList.remove('is-selected')
    this.sync()
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

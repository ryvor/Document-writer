import { reactive } from 'vue'

// Paper sizes at 96 DPI screen resolution
// Width × Height in pixels (portrait orientation)
export const PAGE_SIZES = [
  { id: 'A3',        name: 'A3',        group: 'ISO', subtitle: '297 × 420 mm', width: 1123, height: 1587, marginX: 113, marginY: 113 },
  { id: 'A4',        name: 'A4',        group: 'ISO', subtitle: '210 × 297 mm', width:  794, height: 1123, marginX:  76, marginY:  76 },
  { id: 'A5',        name: 'A5',        group: 'ISO', subtitle: '148 × 210 mm', width:  559, height:  794, marginX:  57, marginY:  57 },
  { id: 'A6',        name: 'A6',        group: 'ISO', subtitle: '105 × 148 mm', width:  397, height:  559, marginX:  38, marginY:  38 },
  { id: 'Letter',    name: 'Letter',    group: 'US',  subtitle: '8.5 × 11 in',  width:  816, height: 1056, marginX:  96, marginY:  96 },
  { id: 'Legal',     name: 'Legal',     group: 'US',  subtitle: '8.5 × 14 in',  width:  816, height: 1344, marginX:  96, marginY:  96 },
  { id: 'Tabloid',   name: 'Tabloid',   group: 'US',  subtitle: '11 × 17 in',   width: 1056, height: 1632, marginX: 115, marginY: 115 },
  { id: 'Executive', name: 'Executive', group: 'US',  subtitle: '7.25 × 10.5 in', width: 696, height: 1008, marginX:  80, marginY:  80 },
  { id: 'Statement', name: 'Statement', group: 'US',  subtitle: '5.5 × 8.5 in', width:  528, height:  816, marginX:  64, marginY:  64 },
]

const PAGE_MAP = Object.fromEntries(PAGE_SIZES.map(p => [p.id, p]))

const UI_KEY = 'dw_ui_state'

function load() {
  try { return JSON.parse(localStorage.getItem(UI_KEY) || '{}') } catch { return {} }
}

const s = load()

const PANEL_IDS = ['shortcodes', 'metadata', 'esign']
const DEFAULT_LAYOUT = Object.fromEntries(PANEL_IDS.map(id => [id, { side: 'right', minimized: false }]))

function normaliseOrder(val, fallback) {
  const arr = Array.isArray(val) ? val.filter(x => PANEL_IDS.includes(x)) : []
  const set = new Set(arr)
  for (const id of fallback) if (!set.has(id)) arr.push(id)
  return arr
}

function normaliseLayout(val) {
  const out = { ...DEFAULT_LAYOUT }
  if (val && typeof val === 'object') {
    for (const id of PANEL_IDS) {
      const item = val[id]
      if (!item || typeof item !== 'object') continue
      const side = item.side === 'left' || item.side === 'right' ? item.side : out[id].side
      const minimized = !!item.minimized
      out[id] = { side, minimized }
    }
  }
  return out
}

// Migration: older versions had a single sidebar with an ordered list of panels.
const migratedPanelLayout = (() => {
  if (s.panelLayout) return normaliseLayout(s.panelLayout)
  const oldOrder = normaliseOrder(s.panelOrder, PANEL_IDS)
  const layout = { ...DEFAULT_LAYOUT }
  for (const id of oldOrder) layout[id] = { side: (s.sidebarPosition === 'left' ? 'left' : 'right'), minimized: false }
  return layout
})()

const migratedOrderRight = (() => {
  if (Array.isArray(s.panelOrderRight)) return normaliseOrder(s.panelOrderRight, PANEL_IDS)
  const oldOrder = normaliseOrder(s.panelOrder, PANEL_IDS)
  const right = oldOrder.filter(id => migratedPanelLayout[id]?.side === 'right')
  return normaliseOrder(right, PANEL_IDS.filter(id => migratedPanelLayout[id]?.side === 'right'))
})()

const migratedOrderLeft = (() => {
  if (Array.isArray(s.panelOrderLeft)) return normaliseOrder(s.panelOrderLeft, [])
  const oldOrder = normaliseOrder(s.panelOrder, PANEL_IDS)
  const left = oldOrder.filter(id => migratedPanelLayout[id]?.side === 'left')
  return normaliseOrder(left, PANEL_IDS.filter(id => migratedPanelLayout[id]?.side === 'left'))
})()

export const uiStore = reactive({
  zoom:            s.zoom             ?? 1.0,
  pageSize:        s.pageSize         ?? 'A4',
  dockCollapsed:   s.dockCollapsed    ?? false,
  panelLayout:     migratedPanelLayout,
  panelOrderLeft:  migratedOrderLeft,
  panelOrderRight: migratedOrderRight,

  get page() { return PAGE_MAP[this.pageSize] ?? PAGE_MAP.A4 },

  setZoom(z)      { this.zoom = Math.max(0.1, Math.min(3.0, parseFloat(z))); this._save() },
  setPageSize(id) { this.pageSize = id; this._save() },

  toggleDockCollapsed() {
    this.dockCollapsed = !this.dockCollapsed
    this._save()
  },

  setDockCollapsed(v) {
    this.dockCollapsed = !!v
    this._save()
  },

  panelSide(id) {
    return this.panelLayout?.[id]?.side === 'left' ? 'left' : 'right'
  },

  isPanelMinimized(id) {
    return !!this.panelLayout?.[id]?.minimized
  },

  setPanelMinimized(id, minimized) {
    if (!this.panelLayout?.[id]) return
    this.panelLayout[id] = { ...this.panelLayout[id], minimized: !!minimized }
    this._save()
  },

  togglePanelMinimized(id) {
    this.setPanelMinimized(id, !this.isPanelMinimized(id))
  },

  panelsForSide(side) {
    const order = side === 'left' ? this.panelOrderLeft : this.panelOrderRight
    const list = order.filter(id => this.panelSide(id) === side)
    // Include any panels assigned to this side but missing in order.
    const set = new Set(list)
    for (const id of PANEL_IDS) {
      if (this.panelSide(id) !== side) continue
      if (!set.has(id)) list.push(id)
    }
    return list
  },

  pinnedPanelsForSide(side) {
    if (this.dockCollapsed) return []
    return this.panelsForSide(side).filter(id => !this.isPanelMinimized(id))
  },

  pillPanelsForSide(side) {
    const list = this.panelsForSide(side)
    if (this.dockCollapsed) return list
    return list.filter(id => this.isPanelMinimized(id))
  },

  movePanelBefore(dragId, targetId, side) {
    if (dragId === targetId) return
    if (this.panelSide(dragId) !== side || this.panelSide(targetId) !== side) return
    const key = side === 'left' ? 'panelOrderLeft' : 'panelOrderRight'
    const order = [...this[key]]
    const from = order.indexOf(dragId)
    const to = order.indexOf(targetId)
    if (from < 0 || to < 0) return
    order.splice(from, 1)
    order.splice(to, 0, dragId)
    this[key] = order
    this._save()
  },

  movePanelToSide(id, side) {
    if (!this.panelLayout?.[id]) return
    const nextSide = side === 'left' ? 'left' : 'right'
    const prevSide = this.panelSide(id)
    if (prevSide === nextSide) return

    this.panelLayout[id] = { ...this.panelLayout[id], side: nextSide }

    const prevKey = prevSide === 'left' ? 'panelOrderLeft' : 'panelOrderRight'
    const nextKey = nextSide === 'left' ? 'panelOrderLeft' : 'panelOrderRight'

    this[prevKey] = this[prevKey].filter(x => x !== id)
    const next = [...this[nextKey]]
    if (!next.includes(id)) next.push(id)
    this[nextKey] = next
    this._save()
  },

  _save() {
    localStorage.setItem(UI_KEY, JSON.stringify({
      zoom: this.zoom,
      pageSize: this.pageSize,
      dockCollapsed: this.dockCollapsed,
      panelLayout: this.panelLayout,
      panelOrderLeft: this.panelOrderLeft,
      panelOrderRight: this.panelOrderRight,
    }))
  },
})

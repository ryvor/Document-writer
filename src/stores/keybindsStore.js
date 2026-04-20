import { reactive } from 'vue'

const KEY = 'dw_keybinds'

export const DEFAULTS = {
  // App
  newDocument:   'Ctrl+T',
  closeDocument: 'Ctrl+W',
  nextDocument:  'Ctrl+Tab',
  prevDocument:  'Ctrl+Shift+Tab',
  goHome:        'Ctrl+H',
  // Editor
  bold:          'Ctrl+B',
  italic:        'Ctrl+I',
  inlineCode:    'Ctrl+`',
  paragraph:     'Ctrl+Shift+0',
  heading1:      'Ctrl+Shift+1',
  heading2:      'Ctrl+Shift+2',
  heading3:      'Ctrl+Shift+3',
  heading4:      'Ctrl+Shift+4',
  heading5:      'Ctrl+Shift+5',
  heading6:      'Ctrl+Shift+6',
  blockquote:    'Ctrl+Shift+.',
  bulletList:    'Ctrl+Shift+8',
  orderedList:   'Ctrl+Shift+9',
}

export const ACTION_META = {
  newDocument:   { label: 'New document',      group: 'App' },
  closeDocument: { label: 'Close document',    group: 'App' },
  nextDocument:  { label: 'Next document',     group: 'App' },
  prevDocument:  { label: 'Previous document', group: 'App' },
  goHome:        { label: 'Go to dashboard',   group: 'App' },
  bold:          { label: 'Bold',              group: 'Editor' },
  italic:        { label: 'Italic',            group: 'Editor' },
  inlineCode:    { label: 'Inline code',       group: 'Editor' },
  paragraph:     { label: 'Paragraph',         group: 'Editor' },
  heading1:      { label: 'Heading 1',         group: 'Editor' },
  heading2:      { label: 'Heading 2',         group: 'Editor' },
  heading3:      { label: 'Heading 3',         group: 'Editor' },
  heading4:      { label: 'Heading 4',         group: 'Editor' },
  heading5:      { label: 'Heading 5',         group: 'Editor' },
  heading6:      { label: 'Heading 6',         group: 'Editor' },
  blockquote:    { label: 'Blockquote',        group: 'Editor' },
  bulletList:    { label: 'Bullet list',       group: 'Editor' },
  orderedList:   { label: 'Ordered list',      group: 'Editor' },
}

export const APP_ACTIONS    = new Set(Object.keys(ACTION_META).filter(k => ACTION_META[k].group === 'App'))
export const EDITOR_ACTIONS = new Set(Object.keys(ACTION_META).filter(k => ACTION_META[k].group === 'Editor'))

function codeToKey(code) {
  const letter = code.match(/^Key([A-Z])$/)
  if (letter) return letter[1]
  const digit = code.match(/^Digit(\d)$/)
  if (digit) return digit[1]
  const map = {
    Tab: 'Tab', Enter: 'Enter', Space: 'Space', Escape: 'Escape',
    Backspace: 'Backspace', Delete: 'Delete',
    ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown',
    Backquote: '`', Minus: '-', Equal: '=',
    BracketLeft: '[', BracketRight: ']',
    Backslash: '\\', Semicolon: ';', Quote: "'",
    Comma: ',', Period: '.', Slash: '/',
    F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4',
    F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8',
    F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
  }
  return map[code] ?? null
}

export function captureCombo(event) {
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) return null
  const key = codeToKey(event.code)
  if (!key) return null
  const parts = []
  if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  parts.push(key)
  return parts.join('+')
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export const keybindsStore = reactive({
  bindings: { ...DEFAULTS, ...load() },

  matchEvent(event, filter) {
    const combo = captureCombo(event)
    if (!combo) return null
    for (const [action, stored] of Object.entries(this.bindings)) {
      if (stored && stored === combo && (!filter || filter.has(action))) return action
    }
    return null
  },

  matchAppEvent(event)    { return this.matchEvent(event, APP_ACTIONS) },
  matchEditorEvent(event) { return this.matchEvent(event, EDITOR_ACTIONS) },

  set(action, combo) {
    if (combo) {
      for (const other of Object.keys(this.bindings)) {
        if (other !== action && this.bindings[other] === combo) this.bindings[other] = ''
      }
    }
    this.bindings[action] = combo
    this._save()
  },

  reset(action) {
    if (action) {
      this.bindings[action] = DEFAULTS[action] ?? ''
    } else {
      for (const k of Object.keys(this.bindings)) {
        this.bindings[k] = DEFAULTS[k] ?? ''
      }
    }
    this._save()
  },

  _save() {
    localStorage.setItem(KEY, JSON.stringify({ ...this.bindings }))
  },
})

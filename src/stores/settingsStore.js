import { reactive } from 'vue'

const KEY = 'dw_settings'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

const s = load()

function clampNumber(v, { min, max, fallback }) {
  const n = Number(v)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

export const settingsStore = reactive({
  openHomeOnStart: !!s.openHomeOnStart,
  showStats:       s.showStats !== false,

  spellcheck:      s.spellcheck !== false,
  editorFontSize:  clampNumber(s.editorFontSize, { min: 11, max: 22, fallback: 14 }),
  editorLineHeight: clampNumber(s.editorLineHeight, { min: 1.2, max: 2.2, fallback: 1.75 }),

  reduceMotion:    !!s.reduceMotion,

  set(key, value) {
    this[key] = value
    this._save()
  },

  reset() {
    this.openHomeOnStart = false
    this.showStats = true
    this.spellcheck = true
    this.editorFontSize = 14
    this.editorLineHeight = 1.75
    this.reduceMotion = false
    this._save()
  },

  _save() {
    localStorage.setItem(KEY, JSON.stringify({
      openHomeOnStart: this.openHomeOnStart,
      showStats: this.showStats,
      spellcheck: this.spellcheck,
      editorFontSize: this.editorFontSize,
      editorLineHeight: this.editorLineHeight,
      reduceMotion: this.reduceMotion,
    }))
  },
})


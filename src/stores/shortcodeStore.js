import { reactive } from 'vue'
import { resolveBuiltin, BUILTIN_KEYS } from '../utils/builtinShortcodes.js'

const STORAGE_KEY = 'dw_custom_shortcodes'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export const shortcodeStore = reactive({
  custom: load(),

  resolve(key) {
    if (BUILTIN_KEYS.has(key)) return resolveBuiltin(key)
    const found = this.custom.find(s => s.key === key)
    return found ? found.value : `{${key}}`
  },

  isBuiltin(key) { return BUILTIN_KEYS.has(key) },

  add(key, value, description = '') {
    const idx = this.custom.findIndex(s => s.key === key)
    if (idx >= 0) this.custom[idx] = { key, value, description }
    else this.custom.push({ key, value, description })
    this._save()
  },

  update(key, value) {
    const found = this.custom.find(s => s.key === key)
    if (found) { found.value = value; this._save() }
  },

  remove(key) {
    const idx = this.custom.findIndex(s => s.key === key)
    if (idx >= 0) { this.custom.splice(idx, 1); this._save() }
  },

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.custom))
  },
})

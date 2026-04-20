import { BUILTIN_KEYS, resolveBuiltin } from './builtinShortcodes.js'
import { shortcodeStore } from '../stores/shortcodeStore.js'

export function resolveShortcodeValue(key, shortcodeVars = {}) {
  if (BUILTIN_KEYS.has(key)) return resolveBuiltin(key)

  if (shortcodeVars && Object.prototype.hasOwnProperty.call(shortcodeVars, key)) {
    return shortcodeVars[key]
  }

  const found = shortcodeStore.custom.find(s => s.key === key)
  return found ? found.value : `{{${key}}}`
}

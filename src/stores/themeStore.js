import { ref, computed } from 'vue'

const STORAGE_KEY = 'dw_theme'

const mode       = ref(localStorage.getItem(STORAGE_KEY) || 'system')
const systemDark = ref(window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false)

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    systemDark.value = e.matches
  })
}

export const themeStore = {
  mode,
  systemDark,
  resolved: computed(() => {
    if (mode.value === 'system') return systemDark.value ? 'dark' : 'light'
    return mode.value
  }),
  set(newMode) {
    mode.value = newMode
    localStorage.setItem(STORAGE_KEY, newMode)
  },
}

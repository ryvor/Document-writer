<template>
  <div class="app" :data-theme="theme.resolved.value">

    <!-- Title bar -->
    <header class="title-bar">
      <span class="title-bar-logo">Document Writer</span>
      <div class="title-bar-actions">
        <button
          v-for="opt in themeOptions"
          :key="opt.mode"
          class="theme-btn"
          :class="{ active: theme.mode.value === opt.mode }"
          :title="opt.label"
          @click="theme.set(opt.mode)"
        >
          <font-awesome-icon :icon="opt.icon" />
        </button>
      </div>
    </header>

    <!-- Tab bar -->
    <TabBar />

    <!-- Main area -->
    <div class="main-area">
      <EditorPane
        ref="editorPaneRef"
        :model-value="activeDoc.content"
        :doc-id="activeDoc.id"
        @update:model-value="onContentUpdate"
        @stats="stats = $event"
        @export-pdf="exportPdf"
        @export-signable="exportSignable"
      />

      <transition name="panel-slide">
        <ShortcodePanel
          v-if="panelOpen"
          :used-keys="usedShortcodeKeys"
          @close="panelOpen = false"
          @insert="insertShortcode"
        />
      </transition>
    </div>

    <!-- Status bar -->
    <footer class="status-bar">
      <span>{{ stats.words }} words · {{ stats.characters }} characters</span>
      <div class="status-bar-right">
        <button class="status-panel-btn" @click="panelOpen = !panelOpen" title="Toggle shortcodes panel">
          <font-awesome-icon :icon="panelOpen ? 'chevron-right' : 'chevron-down'" />
          Shortcodes
        </button>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { themeStore as theme }   from './stores/themeStore.js'
import { documentStore }         from './stores/documentStore.js'
import TabBar        from './components/TabBar.vue'
import EditorPane    from './components/EditorPane.vue'
import ShortcodePanel from './components/ShortcodePanel.vue'

const themeOptions = [
  { mode: 'light',  icon: 'sun',     label: 'Light mode'  },
  { mode: 'dark',   icon: 'moon',    label: 'Dark mode'   },
  { mode: 'system', icon: 'desktop', label: 'System theme' },
]

const activeDoc = computed(() => documentStore.active)

const stats = ref({ words: 0, characters: 0 })

const panelOpen     = ref(false)
const editorPaneRef = ref(null)

function onContentUpdate(html) {
  documentStore.updateContent(activeDoc.value.id, html)
}

// Collect shortcode keys used in the current document
const usedShortcodeKeys = computed(() => {
  const editor = editorPaneRef.value?.editorRef?.value
  if (!editor) return []
  const keys = new Set()
  editor.state.doc.descendants(node => {
    if (node.type.name === 'shortcode') keys.add(node.attrs.key)
  })
  return [...keys]
})

function insertShortcode(key) {
  const editor = editorPaneRef.value?.editorRef?.value
  editor?.chain().focus().insertContent({ type: 'shortcode', attrs: { key } }).run()
}

import { shortcodeStore } from './stores/shortcodeStore.js'

// ── Exports ─────────────────────────────────────────────
function resolveHtmlForExport(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  div.querySelectorAll('span[data-type="shortcode"]').forEach(el => {
    const key   = el.getAttribute('data-shortcode-key')
    el.replaceWith(document.createTextNode(shortcodeStore.resolve(key)))
  })
  return div.innerHTML
}

async function exportPdf() {
  if (!window.electronAPI?.exportPDF) {
    alert('PDF export unavailable — run in Electron.')
    return
  }
  const result = await window.electronAPI.exportPDF({
    title:       activeDoc.value.title,
    htmlContent: resolveHtmlForExport(activeDoc.value.content),
    signable:    false,
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}

async function exportSignable() {
  if (!window.electronAPI?.exportPDF) {
    alert('Export unavailable — run in Electron.')
    return
  }
  const result = await window.electronAPI.exportPDF({
    title:       activeDoc.value.title,
    htmlContent: resolveHtmlForExport(activeDoc.value.content),
    signable:    true,
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}
</script>

<style>
.panel-slide-enter-active,
.panel-slide-leave-active { transition: width 0.2s ease, opacity 0.2s ease; overflow: hidden; }
.panel-slide-enter-from,
.panel-slide-leave-to     { width: 0 !important; opacity: 0; }
</style>

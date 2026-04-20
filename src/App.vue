<template>
  <div
    class="app"
    :data-theme="themeStore.resolved.value"
    :data-reduce-motion="settingsStore.reduceMotion ? 'true' : 'false'"
    :data-view="showHome ? 'home' : 'doc'"
    :style="{
      '--editor-font-size': `${settingsStore.editorFontSize}px`,
      '--editor-line-height': settingsStore.editorLineHeight,
    }"
  >

    <TabBar
      ref="tabBarRef"
      @home="showHome = true"
      @open-doc="showHome = false"
      @export-pdf="exportPdfForDoc"
      @new-doc="newDocFromUi"
    />

    <FormatBar
      v-if="!showHome && !isSignModeLocked"
      :editor-view="activeEditorView"
      @export-markdown="exportMarkdown"
      @export-pdf="exportPdf"
      @export-signable="exportSignable"
      @export-esign-html="exportEsignHtml"
      @export-dwdoc="exportDwdoc"
    />

    <div class="main-area">
      <SideDock
        v-if="!showHome && !isSignModeLocked"
        side="left"
        :doc-id="activeDoc.id"
        :used-keys="usedShortcodeKeys"
        @insert="insertShortcode"
      />

      <HomeView
        v-if="showHome"
        :documents="documentStore.documents"
        @new-doc="newDocFromUi"
        @open-doc="openDoc"
        @open-dwdoc="openDwdoc"
      />

      <EditorArea
        v-else
        ref="editorAreaRef"
        :model-value="activeDoc.markdown"
        :doc-id="activeDoc.id"
        :sign-mode-locked="isSignModeLocked"
        @update:model-value="onMarkdownUpdate"
        @stats="stats = $event"
        @sign-click="openSignModal"
      />

      <SideDock
        v-if="!showHome && !isSignModeLocked"
        side="right"
        :doc-id="activeDoc.id"
        :used-keys="usedShortcodeKeys"
        @insert="insertShortcode"
      />
    </div>

    <FooterBar
      v-if="!showHome"
      :stats="stats"
      @fit="editorAreaRef?.fit($event)"
    />

    <ModalSignArea
      v-if="signModalOpen"
      :label="signModalLabel"
      :default-name="signModalDefaultName"
      :is-signed="signModalIsSigned"
      @sign="onSignConfirm"
      @clear="onSignClear"
      @cancel="onSignCancel"
    />

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { themeStore }    from './stores/themeStore.js'
import { documentStore } from './stores/documentStore.js'
import { uiStore }       from './stores/uiStore.js'
import { settingsStore } from './stores/settingsStore.js'
import { keybindsStore } from './stores/keybindsStore.js'
import { buildExportHtmlFromMarkdown, buildMarkdownWithFrontmatter } from './utils/markdownExport.js'

import TabBar       from './components/TabBar.vue'
import FormatBar    from './components/FormatBar.vue'
import EditorArea   from './components/EditorArea.vue'
import FooterBar    from './components/FooterBar.vue'
import HomeView     from './components/HomeView.vue'
import SideDock     from './components/SideDock.vue'
import ModalSignArea from './components/ModalSignArea.vue'

const activeDoc      = computed(() => documentStore.active)
const editorAreaRef  = ref(null)
const tabBarRef      = ref(null)
const stats          = ref({ words: 0, characters: 0 })
const showHome       = ref(false)

const isSignModeLocked = computed(() => !!activeDoc.value?.signModeLocked)

// Sign modal state
const signModalOpen   = ref(false)
const signModalDocId  = ref(null)
const signModalAreaId = ref(null)

const signModalDoc = computed(() =>
  signModalDocId.value
    ? documentStore.documents.find(d => d.id === signModalDocId.value) || null
    : null
)
const signModalLabel = computed(() => {
  if (!signModalDoc.value || !signModalAreaId.value) return ''
  // Extract label from the markdown token if needed; for now just return empty
  return ''
})
const signModalDefaultName = computed(() => signModalDoc.value?.esign?.signerName || '')
const signModalIsSigned = computed(() =>
  !!(signModalDoc.value?.signAreas?.[signModalAreaId.value])
)

function openSignModal({ docId, areaId }) {
  signModalDocId.value  = docId
  signModalAreaId.value = areaId
  signModalOpen.value   = true
}

function onSignConfirm({ name, signedAt }) {
  documentStore.setSignArea(signModalDocId.value, signModalAreaId.value, { name, signedAt })
  signModalOpen.value = false
}

function onSignClear() {
  documentStore.clearSignArea(signModalDocId.value, signModalAreaId.value)
  signModalOpen.value = false
}

function onSignCancel() {
  signModalOpen.value = false
}

const activeEditorView = computed(() => editorAreaRef.value?.editorView?.value ?? null)

const usedShortcodeKeys = computed(() => {
  const view = activeEditorView.value
  if (!view) return []
  const keys = new Set()
  view.state.doc.descendants(node => {
    if (node.type.name === 'shortcode') keys.add(node.attrs.key)
  })
  return [...keys]
})

function insertShortcode(key) {
  const view = activeEditorView.value
  const schema = view?.state.schema
  if (!view || !schema) return
  const node = schema.nodes.shortcode.create({ key })
  view.dispatch(view.state.tr.replaceSelectionWith(node).scrollIntoView())
  view.focus()
}

function onMarkdownUpdate(markdown) {
  documentStore.updateMarkdown(activeDoc.value.id, markdown)
}

// ── Exports ──────────────────────────────────────────────────────────────────

function resolveHtmlForExport(doc) {
  return buildExportHtmlFromMarkdown(doc.markdown || '', doc.shortcodeVars, uiStore.pageSize)
}

async function exportPdf() {
  if (!window.electronAPI?.exportPDF) { alert('PDF export unavailable — run in Electron.'); return }
  const result = await window.electronAPI.exportPDF({
    title:       activeDoc.value.title,
    htmlContent: resolveHtmlForExport(activeDoc.value),
    signable:    false,
    pageSize:    uiStore.pageSize,
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}

async function exportPdfForDoc(doc) {
  if (!window.electronAPI?.exportPDF) { alert('PDF export unavailable — run in Electron.'); return }
  const result = await window.electronAPI.exportPDF({
    title:       doc.title,
    htmlContent: resolveHtmlForExport(doc),
    signable:    false,
    pageSize:    uiStore.pageSize,
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
  documentStore.close(doc.id)
}

async function exportSignable() {
  if (!window.electronAPI?.exportPDF) { alert('Export unavailable — run in Electron.'); return }
  const result = await window.electronAPI.exportPDF({
    title:       activeDoc.value.title,
    htmlContent: resolveHtmlForExport(activeDoc.value),
    signable:    true,
    esign:       activeDoc.value.esign,
    pageSize:    uiStore.pageSize,
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}

async function exportEsignHtml() {
  if (!window.electronAPI?.exportSignableHtml) { alert('Export unavailable — run in Electron.'); return }
  const result = await window.electronAPI.exportSignableHtml({
    title:       activeDoc.value.title,
    htmlContent: resolveHtmlForExport(activeDoc.value),
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}

async function exportDwdoc() {
  if (!window.electronAPI?.exportDwdoc) { alert('Export unavailable — run in Electron.'); return }
  const doc = activeDoc.value
  const result = await window.electronAPI.exportDwdoc({
    doc: {
      title:         doc.title,
      markdown:      doc.markdown,
      metadata:      doc.metadata,
      shortcodeVars: doc.shortcodeVars,
      esign:         doc.esign,
      signAreas:     doc.signAreas || {},
    },
  })
  if (!result?.canceled) alert(`Saved: ${result.filePath}`)
}

async function openDwdoc() {
  if (!window.electronAPI?.openDwdoc) { alert('Open signable unavailable — run in Electron.'); return }
  const result = await window.electronAPI.openDwdoc()
  if (result?.canceled || !result?.data) return
  const newDoc = documentStore.importDwdoc(result.data)
  showHome.value = false
  setTimeout(() => editorAreaRef.value?.focusEditor?.(), 0)
  return newDoc
}

async function exportMarkdown() {
  const md = buildMarkdownWithFrontmatter(activeDoc.value)
  if (window.electronAPI?.exportMarkdown) {
    const result = await window.electronAPI.exportMarkdown({
      title: activeDoc.value.title,
      markdown: md,
    })
    if (!result?.canceled) alert(`Saved: ${result.filePath}`)
    return
  }
  // Browser fallback
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${activeDoc.value.filenameSlug || 'document'}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}

function newDocFromUi() {
  showHome.value = false
  const doc = documentStore.newDocument()
  setTimeout(() => editorAreaRef.value?.focusEditor?.(), 0)
  return doc
}

function openDoc(id) {
  showHome.value = false
  documentStore.setActive(id)
  setTimeout(() => editorAreaRef.value?.focusEditor?.(), 0)
}

function onKeyDown(e) {
  const action = keybindsStore.matchAppEvent(e)
  if (!action) return
  e.preventDefault()
  switch (action) {
    case 'newDocument':
      newDocFromUi()
      break
    case 'closeDocument':
      if (!showHome.value) tabBarRef.value?.requestCloseActive()
      break
    case 'nextDocument':
      if (documentStore.documents.length > 1) {
        documentStore.nextDocument()
        showHome.value = false
      }
      break
    case 'prevDocument':
      if (documentStore.documents.length > 1) {
        documentStore.prevDocument()
        showHome.value = false
      }
      break
    case 'goHome':
      showHome.value = true
      break
  }
}

onMounted(() => window.addEventListener('keydown', onKeyDown, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown, true))

onMounted(() => {
  if (settingsStore.openHomeOnStart) showHome.value = true
})

watch(() => documentStore.documents.length, (len) => {
  if (len === 0) showHome.value = true
})

function syncRootTheme() {
  const root = document.documentElement
  root.dataset.theme = themeStore.resolved.value
  root.dataset.reduceMotion = settingsStore.reduceMotion ? 'true' : 'false'
  root.style.setProperty('--editor-font-size', `${settingsStore.editorFontSize}px`)
  root.style.setProperty('--editor-line-height', String(settingsStore.editorLineHeight))
}

onMounted(() => {
  syncRootTheme()
})

watch(
  () => [
    themeStore.resolved.value,
    settingsStore.reduceMotion,
    settingsStore.editorFontSize,
    settingsStore.editorLineHeight,
  ],
  () => syncRootTheme(),
  { immediate: true }
)
</script>

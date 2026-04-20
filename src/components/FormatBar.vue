<template>
  <div class="format-bar">

    <div class="ribbon-tabs">
      <button
        class="ribbon-tab"
        :class="{ active: activeTab === 'home' }"
        @click="activeTab = 'home'"
      >
        Home
      </button>
      <button
        class="ribbon-tab"
        :class="{ active: activeTab === 'input' }"
        @click="activeTab = 'input'"
      >
        Input
      </button>
      <button
        class="ribbon-tab"
        :class="{ active: activeTab === 'settings' }"
        @click="activeTab = 'settings'"
      >
        Settings
      </button>

      <div class="ribbon-tab__right">
        <div class="ribbon-tab-dd" ref="exportWrapRef">
          <button
            class="ribbon-tab ribbon-tab--export"
            :class="{ active: exportOpen }"
            @click.stop="exportOpen = !exportOpen"
            title="Export"
          >
            Export
            <font-awesome-icon :icon="exportOpen ? 'chevron-up' : 'chevron-down'" />
          </button>
          <div v-if="exportOpen" class="fb-dropdown fb-dropdown--right">
            <div class="fb-dd-label">Export</div>
            <button class="fb-dd-item" @click="doExport('markdown')">
              <font-awesome-icon icon="file-arrow-down" />
              <span>Markdown (.md)</span>
            </button>
            <button class="fb-dd-item" @click="doExport('pdf')">
              <font-awesome-icon icon="file-pdf" />
              <span>PDF</span>
            </button>
            <button class="fb-dd-item" @click="doExport('signable')">
              <font-awesome-icon icon="file-signature" />
              <span>Signable PDF</span>
            </button>
            <button class="fb-dd-item" @click="doExport('esign')">
              <font-awesome-icon icon="file-code" />
              <span>E-sign HTML</span>
            </button>
            <button class="fb-dd-item" @click="doExport('dwdoc')">
              <font-awesome-icon icon="file-signature" />
              <span>Signable document (.dwdoc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="ribbon-tools">
      <transition name="ribbon" mode="out-in">
        <div class="ribbon-pane" :key="activeTab">
          <template v-if="activeTab === 'home'">
            <div class="fb-group pill">
              <button class="fb-btn btn" :class="{ active: isMarkActive('strong') }" title="Bold (Ctrl+B)" @click="toggleMark('strong')">
                <font-awesome-icon icon="bold" />
              </button>
              <button class="fb-btn btn" :class="{ active: isMarkActive('em') }" title="Italic (Ctrl+I)" @click="toggleMark('em')">
                <font-awesome-icon icon="italic" />
              </button>
              <button class="fb-btn btn" :class="{ active: isMarkActive('code') }" title="Inline code (Ctrl+`)" @click="toggleMark('code')">
                <font-awesome-icon icon="code" />
              </button>
            </div>

            <div class="fb-group pill">
              <select class="fb-select" :value="activeHeading" @change="setHeading($event.target.value)" title="Paragraph style">
                <option value="0">Normal</option>
                <option value="1">Heading 1</option>
                <option value="2">Heading 2</option>
                <option value="3">Heading 3</option>
                <option value="4">Heading 4</option>
                <option value="5">Heading 5</option>
                <option value="6">Heading 6</option>
              </select>
              <button class="fb-btn btn" title="Blockquote" @click="wrapBlockquote()">
                <font-awesome-icon icon="quote-left" />
              </button>
              <button class="fb-btn btn" title="Code block" @click="toggleCodeBlock()">
                <font-awesome-icon icon="file-code" />
              </button>
              <button class="fb-btn btn" title="Bulleted list" @click="wrapList('bullet_list')">
                <font-awesome-icon icon="list-ul" />
              </button>
              <button class="fb-btn btn" title="Numbered list" @click="wrapList('ordered_list')">
                <font-awesome-icon icon="list-ol" />
              </button>
              <button class="fb-btn btn" title="Horizontal rule" @click="insertHorizontalRule()">
                <font-awesome-icon icon="minus" />
              </button>
            </div>

            <div class="fb-group fb-group--dropdown pill" ref="scWrapRef">
              <button class="fb-btn fb-btn--labeled btn fb-btn--tall" @click.stop="scOpen = !scOpen" title="Insert shortcode">
                <font-awesome-icon icon="tag" /><span>Shortcode</span>
              </button>
              <div v-if="scOpen" class="fb-dropdown">
                <div class="fb-dd-label">Built-in</div>
                <button
                  v-for="sc in BUILTIN_DEFINITIONS"
                  :key="sc.key"
                  class="fb-dd-item"
                  @click="insertShortcode(sc.key)"
                >
                  <code>{{ token(sc.key) }}</code>
                  <span>{{ sc.description }}</span>
                </button>
                <template v-if="customShortcodes.length">
                  <div class="fb-dd-label">Custom</div>
                  <button
                    v-for="sc in customShortcodes"
                    :key="sc.key"
                    class="fb-dd-item"
                    @click="insertShortcode(sc.key)"
                  >
                    <code>{{ token(sc.key) }}</code>
                    <span>{{ sc.value }}</span>
                  </button>
                </template>
                <div v-if="!customShortcodes.length" class="fb-dd-hint">
                  Add custom shortcodes in the sidebar →
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'input'">
            <div class="fb-group pill">
              <button class="fb-btn btn fb-btn--tall" title="Insert link" @click="insertLink()">
                <font-awesome-icon icon="link" />
                Link
              </button>
              <button class="fb-btn btn fb-btn--tall" title="Insert image" @click="insertImage()">
                <font-awesome-icon icon="image" />
                Image
              </button>
              <button class="fb-btn btn fb-btn--tall" title="Insert table (Markdown)" @click="insertTable()">
                <font-awesome-icon icon="table" />
                Table
              </button>
            </div>
            <div class="fb-group pill">
              <button class="fb-btn btn fb-btn--tall" title="Insert a signable area block" @click="insertSignArea()">
                <font-awesome-icon icon="file-signature" />
                Signable area
              </button>
            </div>
          </template>

          <template v-else>
            <div class="fb-group pill" aria-label="Theme">
              <button class="btn" :class="{ active: themeStore.mode.value === 'light' }" title="Light" @click="themeStore.set('light')">
                <font-awesome-icon icon="sun" />
              </button>
              <button class="btn" :class="{ active: themeStore.mode.value === 'system' }" title="System" @click="themeStore.set('system')">
                <font-awesome-icon icon="desktop" />
              </button>
              <button class="btn" :class="{ active: themeStore.mode.value === 'dark' }" title="Dark" @click="themeStore.set('dark')">
                <font-awesome-icon icon="moon" />
              </button>
            </div>

            <div class="fb-group pill" aria-label="Toggles">
              <button class="pill btn" :class="{ active: settingsStore.spellcheck }" title="Toggle spellcheck" @click="settingsStore.set('spellcheck', !settingsStore.spellcheck)">
                Spellcheck
              </button>
              <button class="pill btn" :class="{ active: settingsStore.showStats }" title="Toggle word/char count" @click="settingsStore.set('showStats', !settingsStore.showStats)">
                Stats
              </button>
              <button class="pill btn" :class="{ active: settingsStore.reduceMotion }" title="Reduce motion" @click="settingsStore.set('reduceMotion', !settingsStore.reduceMotion)">
                Motion
              </button>
              <button class="pill btn" :class="{ active: uiStore.dockCollapsed }" title="Collapse panels to pills" @click="uiStore.setDockCollapsed(!uiStore.dockCollapsed)">
                Panels
              </button>
              <button class="pill btn" :class="{ active: settingsStore.openHomeOnStart }" title="Open Home on start" @click="settingsStore.set('openHomeOnStart', !settingsStore.openHomeOnStart)">
                Home
              </button>
            </div>

            <div class="fb-group pill" aria-label="Typography">
              <select class="fb-select" :value="settingsStore.editorFontSize" title="Font size" @change="settingsStore.set('editorFontSize', +$event.target.value)">
                <option v-for="n in [12,13,14,15,16,17,18]" :key="n" :value="n">{{ n }}px</option>
              </select>
              <select class="fb-select" :value="settingsStore.editorLineHeight" title="Line height" @change="settingsStore.set('editorLineHeight', +$event.target.value)">
                <option v-for="n in [1.4,1.55,1.65,1.75,1.9,2.05]" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>

            <div class="fb-group pill" aria-label="Actions">
              <button class="pill btn" title="Manage custom shortcodes" @click="shortcodesOpen = true">
                Shortcodes
              </button>
              <button class="pill btn" title="Keyboard shortcuts" @click="keybindsOpen = true">
                Keybinds
              </button>
              <button class="pill btn" title="Reset settings" @click="settingsStore.reset()">
                Reset
              </button>
              <button class="pill btn btn--primary" title="About" @click="aboutOpen = true">
                About
              </button>
            </div>
          </template>
        </div>
      </transition>

    </div>

  </div>

  <ModalAbout     v-if="aboutOpen"      @close="aboutOpen = false" />
  <ModalShortcodes v-if="shortcodesOpen" @close="shortcodesOpen = false" />
  <ModalKeybinds  v-if="keybindsOpen"  @close="keybindsOpen = false" />
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { TextSelection } from 'prosemirror-state'
import { toggleMark as pmToggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'

import { BUILTIN_DEFINITIONS } from '../utils/builtinShortcodes.js'
import { shortcodeStore } from '../stores/shortcodeStore.js'
import { uiStore } from '../stores/uiStore.js'
import { themeStore } from '../stores/themeStore.js'
import { settingsStore } from '../stores/settingsStore.js'
import ModalAbout     from './ModalAbout.vue'
import ModalShortcodes from './ModalShortcodes.vue'
import ModalKeybinds   from './ModalKeybinds.vue'

const props = defineProps({
  editorView: { type: Object, default: null },
})

const emit = defineEmits([
  'export-markdown',
  'export-pdf',
  'export-signable',
  'export-esign-html',
  'export-dwdoc',
])

const customShortcodes = computed(() => shortcodeStore.custom)

const activeTab = ref('home')
const aboutOpen = ref(false)
const shortcodesOpen = ref(false)
const keybindsOpen = ref(false)

function run(cmd) {
  const view = props.editorView
  if (!view) return
  cmd(view.state, view.dispatch, view)
  view.focus()
}

function isMarkActive(markName) {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return false
  const { from, $from, to, empty } = view.state.selection
  const mark = schema.marks[markName]
  if (!mark) return false
  if (empty) return !!mark.isInSet(view.state.storedMarks || $from.marks())
  return view.state.doc.rangeHasMark(from, to, mark)
}

function toggleMarkName(markName) {
  const schema = props.editorView?.state?.schema
  if (!schema) return
  const mark = schema.marks[markName]
  if (!mark) return
  run(pmToggleMark(mark))
}

function toggleMark(markName) { toggleMarkName(markName) }

const activeHeading = computed(() => {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return 0
  const { $from } = view.state.selection
  const h = schema.nodes.heading
  if (!$from.parent || $from.parent.type !== h) return 0
  return $from.parent.attrs.level || 0
})

function setHeading(levelStr) {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return
  const level = parseInt(levelStr, 10)
  if (!level) run(setBlockType(schema.nodes.paragraph))
  else run(setBlockType(schema.nodes.heading, { level }))
}

function wrapBlockquote() {
  const schema = props.editorView?.state?.schema
  if (!schema) return
  run(wrapIn(schema.nodes.blockquote))
}

function wrapList(name) {
  const schema = props.editorView?.state?.schema
  if (!schema) return
  const list = schema.nodes[name]
  if (!list) return
  run(wrapInList(list))
}

function toggleCodeBlock() {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return
  const { $from } = view.state.selection
  if ($from.parent.type === schema.nodes.code_block) run(setBlockType(schema.nodes.paragraph))
  else run(setBlockType(schema.nodes.code_block))
}

function insertHorizontalRule() {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return
  const hr = schema.nodes.horizontal_rule
  if (!hr) return
  const tr = view.state.tr.replaceSelectionWith(hr.create()).scrollIntoView()
  view.dispatch(tr)
  view.focus()
}

const scOpen = ref(false)
const scWrapRef = ref(null)
const exportOpen = ref(false)
const exportWrapRef = ref(null)

function insertShortcode(key) {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema) return
  const node = schema.nodes.shortcode.create({ key })
  const tr = view.state.tr.replaceSelectionWith(node).scrollIntoView()
  view.dispatch(tr)
  view.focus()
  scOpen.value = false
}

function onDocClick(e) {
  if (!scWrapRef.value?.contains(e.target)) scOpen.value = false
  if (!exportWrapRef.value?.contains(e.target)) exportOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function doExport(kind) {
  exportOpen.value = false
  if (kind === 'markdown') emit('export-markdown')
  if (kind === 'pdf') emit('export-pdf')
  if (kind === 'signable') emit('export-signable')
  if (kind === 'esign') emit('export-esign-html')
  if (kind === 'dwdoc') emit('export-dwdoc')
}

function insertSignArea() {
  const view = props.editorView
  const schema = view?.state?.schema
  if (!view || !schema?.nodes.sign_area) return
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const node = schema.nodes.sign_area.create({ id, label: '' })
  const tr = view.state.tr.replaceSelectionWith(node).scrollIntoView()
  view.dispatch(tr)
  view.focus()
}

function insertSnippet(text, cursorOffset = null) {
  const view = props.editorView
  if (!view) return
  const { from, to } = view.state.selection
  let tr = view.state.tr.insertText(text, from, to)
  if (cursorOffset !== null) {
    const pos = Math.max(0, Math.min(tr.doc.content.size, from + cursorOffset))
    tr = tr.setSelection(TextSelection.create(tr.doc, pos))
  }
  view.dispatch(tr.scrollIntoView())
  view.focus()
}

function insertLink() {
  // []() with cursor inside []
  insertSnippet('[]()', 1)
}

function insertImage() {
  // ![]() with cursor inside []
  insertSnippet('![]()', 2)
}

function insertTable() {
  // Markdown table snippet (may render as plain text depending on Markdown config)
  const snippet = `\n| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n`
  insertSnippet(snippet, null)
}

function token(key) {
  return `{{${key}}}`
}
</script>

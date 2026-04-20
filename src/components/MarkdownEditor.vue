<template>
  <div class="md-editor">
    <div ref="mountRef" class="md-editor__content" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

import { buildSchema } from '../editor/pmSchema.js'
import { buildPlugins } from '../editor/pmPlugins.js'
import { buildMarkdownParser, buildMarkdownSerializer } from '../editor/pmMarkdown.js'
import { ShortcodeNodeView, syncShortcodeNodeViews } from '../editor/pmShortcodeNodeView.js'
import { SignAreaNodeView, syncSignAreaNodeViews } from '../editor/pmSignAreaNodeView.js'
import { documentStore } from '../stores/documentStore.js'
import { settingsStore } from '../stores/settingsStore.js'

const props = defineProps({
  modelValue:      { type: String, default: '' }, // Markdown
  docId:           { type: String, required: true },
  signModeLocked:  { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'stats', 'sign-click'])

const mountRef = ref(null)

const schema = buildSchema()
const mdParser = buildMarkdownParser(schema)
const mdSerializer = buildMarkdownSerializer(schema)

let view = null
let lastEmitted = ''

function docToMarkdown(doc) {
  return mdSerializer.serialize(doc, { tightLists: true })
}

function computeStats(doc) {
  const text = doc.textBetween(0, doc.content.size, ' ', ' ')
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  return { words, characters: text.length }
}

function buildState(markdown) {
  const doc = mdParser.parse(markdown || '')
  return EditorState.create({
    schema,
    doc,
    plugins: buildPlugins(schema),
  })
}

function setFromMarkdown(markdown) {
  if (!view) return
  view.updateState(buildState(markdown))
}

onMounted(() => {
  const state = buildState(props.modelValue)
  view = new EditorView(mountRef.value, {
    state,
    dispatchTransaction(tr) {
      const prevState = view.state
      const next = view.state.apply(tr)
      view.updateState(next)

      // Keep shortcode node views in sync with selection/transactions
      // (ProseMirror will call NodeView.update; we also re-sync on selection changes)
      if (tr.selectionSet || tr.docChanged || tr.getMeta('sc-vars') || tr.getMeta('sa-vars')) {
        syncShortcodeNodeViews(view)
        syncSignAreaNodeViews(view)
      } else if (prevState.selection.from !== next.selection.from || prevState.selection.to !== next.selection.to) {
        syncShortcodeNodeViews(view)
        syncSignAreaNodeViews(view)
      }

      const md = docToMarkdown(next.doc)
      if (md !== lastEmitted) {
        lastEmitted = md
        emit('update:modelValue', md)
      }
      emit('stats', computeStats(next.doc))
    },
    editable: () => !props.signModeLocked,
    nodeViews: {
      shortcode(node, view, getPos) {
        return new ShortcodeNodeView(node, view, getPos, props.docId)
      },
      sign_area(node, editorView, getPos) {
        return new SignAreaNodeView(node, editorView, getPos, props.docId, (docId, areaId) => {
          emit('sign-click', { docId, areaId })
        })
      },
    },
    attributes: {
      class: 'md-prosemirror',
      spellcheck: settingsStore.spellcheck ? 'true' : 'false',
    },
  })

  lastEmitted = docToMarkdown(state.doc)
  emit('stats', computeStats(state.doc))
})

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

watch(() => props.docId, () => {
  // When doc changes, replace content wholesale.
  lastEmitted = ''
  setFromMarkdown(props.modelValue)
})

watch(() => props.modelValue, val => {
  if (!view) return
  const current = docToMarkdown(view.state.doc)
  if (val !== current) setFromMarkdown(val)
})

watch(
  () => JSON.stringify((documentStore.documents.find(d => d.id === props.docId) || documentStore.active)?.shortcodeVars || {}),
  () => {
    if (!view) return
    view.dispatch(view.state.tr.setMeta('sc-vars', true))
  }
)

watch(
  () => JSON.stringify((documentStore.documents.find(d => d.id === props.docId) || documentStore.active)?.signAreas || {}),
  () => {
    if (!view) return
    view.dispatch(view.state.tr.setMeta('sa-vars', true))
  }
)

watch(() => props.signModeLocked, () => {
  if (!view) return
  view.setProps({ editable: () => !props.signModeLocked })
})

watch(() => settingsStore.spellcheck, val => {
  if (!view) return
  try {
    view.dom.setAttribute('spellcheck', val ? 'true' : 'false')
  } catch {}
})

function focus() {
  view?.focus()
}

defineExpose({
  focus,
  get view() { return view },
})
</script>

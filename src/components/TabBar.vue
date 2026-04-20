<template>
  <div class="top-nav">
    <div class="top-nav__left pill">
      <button class="btn" @click="emit('home')" title="Home">
        <font-awesome-icon icon="house" />
      </button>
    </div>

    <transition-group
      name="doc-tab"
      tag="div"
      class="top-nav__tabs"
      ref="scrollRef"
      aria-label="Open documents"
    >
      <button
        v-for="doc in documentStore.documents"
        :key="doc.id"
        class="top-nav__tab pill btn"
        :class="{ active: doc.id === documentStore.activeId }"
        @click="handleTabClick(doc)"
        :title="doc.title || 'Untitled'"
      >
        <span v-if="renamingId !== doc.id" class="top-nav__tab-title">
          {{ doc.title || 'Untitled' }}
          <span v-if="doc.dirty" class="top-nav__tab-dirty">●</span>
        </span>
        <input
          v-else
          ref="renameInputRef"
          class="top-nav__tab-rename"
          :value="doc.title"
          @blur="finishRename(doc, $event)"
          @keydown.enter.prevent="finishRename(doc, $event)"
          @keydown.escape.prevent="renamingId = null"
          @click.stop
        />
        <button
          v-if="doc.id === documentStore.activeId"
          class="top-nav__tab-close"
          @click.stop="requestClose(doc)"
          title="Close"
        >
          <font-awesome-icon icon="xmark" />
        </button>
      </button>

      <button class="pill btn" @click="emit('new-doc')" :title="`New tab (${keybindsStore.bindings.newDocument || 'Ctrl+T'})`">
        <font-awesome-icon icon="plus" />
      </button>
    </transition-group>

    <div class="top-nav__right">
    </div>

    <ModalConfirm
      v-if="closingDoc"
      :title="`Close '${closingDoc.title || 'Untitled'}'?`"
      message="This document has unsaved changes."
      confirm-label="Close Anyway"
      cancel-label="Cancel"
      export-label="Export PDF"
      @confirm="forceClose"
      @cancel="closingDoc = null"
      @export="exportAndClose"
    />
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { documentStore } from '../stores/documentStore.js'
import { themeStore }    from '../stores/themeStore.js'
import { keybindsStore } from '../stores/keybindsStore.js'
import ModalConfirm      from './ModalConfirm.vue'

const emit = defineEmits(['home', 'open-doc', 'export-pdf', 'new-doc'])

const themeOptions = [
  { mode: 'light',  icon: 'sun',     label: 'Light mode'   },
  { mode: 'system', icon: 'desktop', label: 'System theme' },
  { mode: 'dark',   icon: 'moon',    label: 'Dark mode'    },
]

const renamingId     = ref(null)
const renameInputRef = ref(null)
const closingDoc     = ref(null)
const scrollRef      = ref(null)

function handleTabClick(doc) {
  emit('open-doc', doc.id)
  if (doc.id === documentStore.activeId && renamingId.value !== doc.id) {
    renamingId.value = doc.id
    nextTick(() => {
      const el = renameInputRef.value
      const inp = Array.isArray(el) ? el[0] : el
      inp?.select()
    })
  } else if (doc.id !== documentStore.activeId) {
    renamingId.value = null
    documentStore.setActive(doc.id)
  }
}

function finishRename(doc, e) {
  const newTitle = (e.target.value || '').trim()
  if (newTitle) documentStore.updateTitle(doc.id, newTitle)
  renamingId.value = null
}

function requestClose(doc) {
  if (doc.dirty) {
    closingDoc.value = doc
  } else {
    documentStore.close(doc.id)
  }
}

function forceClose() {
  documentStore.close(closingDoc.value.id)
  closingDoc.value = null
}

function exportAndClose() {
  emit('export-pdf', closingDoc.value)
  closingDoc.value = null
}

function requestCloseActive() {
  const active = documentStore.active
  if (active) requestClose(active)
}

defineExpose({ requestCloseActive })
</script>

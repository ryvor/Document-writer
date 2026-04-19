<template>
  <div class="tab-bar">
    <div class="tabs-scroll">
      <button
        v-for="doc in documents"
        :key="doc.id"
        class="tab"
        :class="{ active: doc.id === activeId }"
        @click="documentStore.setActive(doc.id)"
        @dblclick="startRename(doc)"
      >
        <span v-if="renamingId !== doc.id" class="tab-title">{{ doc.title || 'Untitled' }}</span>
        <input
          v-else
          ref="renameInput"
          class="tab-rename"
          :value="doc.title"
          @blur="finishRename(doc, $event)"
          @keydown.enter.prevent="finishRename(doc, $event)"
          @keydown.escape.prevent="renamingId = null"
          @click.stop
        />
        <span class="tab-close" @click.stop="documentStore.close(doc.id)" title="Close tab">
          <font-awesome-icon icon="xmark" />
        </span>
      </button>
    </div>
    <button class="tab-new" @click="documentStore.newDocument()" title="New document">
      <font-awesome-icon icon="plus" />
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { documentStore } from '../stores/documentStore.js'

const { documents, activeId } = documentStore

const renamingId  = ref(null)
const renameInput = ref(null)

function startRename(doc) {
  renamingId.value = doc.id
  nextTick(() => renameInput.value?.focus())
}

function finishRename(doc, e) {
  const newTitle = e.target.value.trim()
  if (newTitle) documentStore.updateTitle(doc.id, newTitle)
  renamingId.value = null
}
</script>

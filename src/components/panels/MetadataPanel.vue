<template>
  <div class="panel-body">

    <div class="meta-field">
      <label class="meta-label">Author</label>
      <input class="sc-input" :value="meta.author" @input="update('author', $event.target.value)" placeholder="Author name" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Description</label>
      <textarea class="sc-input meta-textarea" :value="meta.description" @input="update('description', $event.target.value)" placeholder="Document description" rows="3" />
    </div>

    <div class="meta-field">
      <label class="meta-label">Tags</label>
      <input class="sc-input" :value="meta.tags" @input="update('tags', $event.target.value)" placeholder="tag1, tag2, tag3" />
    </div>

    <div class="meta-dates">
      <div class="meta-date-row">
        <span class="meta-date-label">Created</span>
        <span class="meta-date-value">{{ formatDate(meta.created) }}</span>
      </div>
      <div class="meta-date-row">
        <span class="meta-date-label">Modified</span>
        <span class="meta-date-value">{{ formatDate(meta.modified) }}</span>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { documentStore } from '../../stores/documentStore.js'

const props = defineProps({
  docId: { type: String, required: true },
})

const meta = computed(() => {
  const doc = documentStore.documents.find(d => d.id === props.docId) || documentStore.active
  return doc?.metadata || {}
})

function update(field, value) {
  documentStore.updateMetadata(props.docId, { [field]: value })
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium', timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
</script>

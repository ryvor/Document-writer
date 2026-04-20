<template>
  <teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ appName }}</h3>
        <p class="modal-message">{{ description }}</p>

        <div class="about-grid">
          <div class="about-row">
            <div class="about-k">Version</div>
            <div class="about-v">{{ version }}</div>
          </div>
          <div class="about-row">
            <div class="about-k">Author</div>
            <div class="about-v">{{ author }}</div>
          </div>
        </div>

        <div class="modal-actions">
          <div class="modal-spacer" />
          <button class="modal-btn modal-btn-ghost" @click="emit('close')">Close</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import pkg from '../../package.json'

defineProps({
  appName:     { type: String, default: 'Document Writer' },
  description: { type: String, default: pkg?.description || '' },
  author:      { type: String, default: (pkg?.author && String(pkg.author).trim()) ? String(pkg.author).trim() : '—' },
  version:     { type: String, default: pkg?.version || '—' },
})

const emit = defineEmits(['close'])
</script>


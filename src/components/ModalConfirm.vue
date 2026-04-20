<template>
  <teleport to="body">
    <div class="modal-backdrop" @click.self="emit('cancel')">
      <div class="modal-box" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        <div class="modal-actions">
          <button v-if="exportLabel" class="modal-btn modal-btn-export" @click="emit('export')">
            <font-awesome-icon icon="file-arrow-down" />
            {{ exportLabel }}
          </button>
          <div class="modal-spacer" />
          <button class="modal-btn modal-btn-ghost" @click="emit('cancel')">{{ cancelLabel }}</button>
          <button class="modal-btn modal-btn-danger" @click="emit('confirm')">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  title:        { type: String, required: true },
  message:      { type: String, default: '' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel:  { type: String, default: 'Cancel' },
  exportLabel:  { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'cancel', 'export'])
</script>

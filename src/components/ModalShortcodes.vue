<template>
  <teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-box modal-box--wide" role="dialog" aria-modal="true">
        <h3 class="modal-title">Custom Shortcodes</h3>
        <p class="modal-message">
          These are saved on this device and can be inserted into any document.
        </p>

        <div class="scm-list">
          <div v-if="!shortcodeStore.custom.length" class="scm-empty">
            No custom shortcodes yet.
          </div>

          <div v-for="sc in shortcodeStore.custom" :key="sc.key" class="scm-row">
            <div class="scm-key">
              <code class="scm-code">{{ token(sc.key) }}</code>
              <div class="scm-desc">{{ sc.description || '—' }}</div>
            </div>

            <input
              class="scm-input"
              :value="sc.value"
              @input="shortcodeStore.update(sc.key, $event.target.value)"
              placeholder="Value…"
            />

            <button class="scm-del" title="Delete" @click="shortcodeStore.remove(sc.key)">
              <font-awesome-icon icon="trash" />
            </button>
          </div>
        </div>

        <div class="scm-add">
          <div class="scm-add-title">Add shortcode</div>
          <div class="scm-add-grid">
            <input v-model="newKey" class="scm-input" placeholder="key (e.g. company)" />
            <input v-model="newValue" class="scm-input" placeholder="value" />
            <input v-model="newDesc" class="scm-input" placeholder="description (optional)" />
            <button class="pill btn btn--primary" @click="add">
              Add
            </button>
          </div>
          <div v-if="addError" class="scm-error">{{ addError }}</div>
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
import { ref } from 'vue'
import { shortcodeStore } from '../stores/shortcodeStore.js'
import { BUILTIN_KEYS } from '../utils/builtinShortcodes.js'

const emit = defineEmits(['close'])

const newKey = ref('')
const newValue = ref('')
const newDesc = ref('')
const addError = ref('')

const KEY_RE = /^[a-z0-9_]+$/

function add() {
  const k = newKey.value.trim().toLowerCase()
  if (!k) { addError.value = 'Key is required.'; return }
  if (!KEY_RE.test(k)) { addError.value = 'Lowercase letters, numbers, underscores only.'; return }
  if (BUILTIN_KEYS.has(k)) { addError.value = `"${k}" is a built-in key.`; return }
  shortcodeStore.add(k, newValue.value.trim(), newDesc.value.trim())
  newKey.value = ''
  newValue.value = ''
  newDesc.value = ''
  addError.value = ''
}

function token(key) {
  return `{{${key}}}`
}
</script>

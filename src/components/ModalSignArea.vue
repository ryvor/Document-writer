<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="emit('cancel')">
      <div class="modal-box sign-modal" role="dialog" aria-modal="true">

        <div class="modal-head">
          <div class="modal-title">{{ label ? label : 'Sign' }}</div>
          <button class="btn modal-close" @click="emit('cancel')" title="Close">×</button>
        </div>

        <div class="modal-body">
          <div class="sign-modal-preview" :class="{ 'is-signed': name.trim() }">
            <template v-if="name.trim()">
              <div class="sign-modal-stamp__name">{{ name }}</div>
              <div class="sign-modal-stamp__date">Signed: {{ todayFormatted }}</div>
            </template>
            <template v-else>
              <div class="sign-modal-stamp__hint">Enter name below to preview stamp</div>
            </template>
          </div>

          <label class="sign-modal-field-label" for="sign-name-input">Name</label>
          <input
            id="sign-name-input"
            ref="nameInputRef"
            class="sign-modal-input"
            v-model="name"
            placeholder="Full name"
            autocomplete="off"
            @keydown.enter="name.trim() && doSign()"
            @keydown.escape="emit('cancel')"
          />
        </div>

        <div class="modal-footer">
          <button class="btn sign-modal-clear" @click="doClear">Clear signature</button>
          <div class="sign-modal-footer-right">
            <button class="btn" @click="emit('cancel')">Cancel</button>
            <button class="btn btn--primary" :disabled="!name.trim()" @click="doSign">Sign</button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  label:       { type: String, default: '' },
  defaultName: { type: String, default: '' },
  isSigned:    { type: Boolean, default: false },
})

const emit = defineEmits(['sign', 'clear', 'cancel'])

const name = ref(props.defaultName || '')
const nameInputRef = ref(null)

const todayFormatted = computed(() => {
  return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
})

onMounted(() => {
  nameInputRef.value?.focus()
  nameInputRef.value?.select()
})

function doSign() {
  if (!name.value.trim()) return
  emit('sign', { name: name.value.trim(), signedAt: new Date().toISOString() })
}

function doClear() {
  emit('clear')
}
</script>

<style scoped>
.sign-modal {
  width: min(420px, calc(100vw - 32px));
}

.sign-modal-preview {
  border: 1px dashed var(--border, #d1d5db);
  border-radius: 8px;
  padding: 14px 16px;
  min-height: 64px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  background: var(--bg2, #f9fafb);
}

.sign-modal-preview.is-signed {
  border-color: var(--accent, #2563eb);
  border-style: solid;
  background: var(--bg, #fff);
}

.sign-modal-stamp__name {
  font-weight: 600;
  font-size: 1em;
}

.sign-modal-stamp__date {
  font-size: 0.8em;
  color: var(--text2, #555);
  margin-top: 2px;
}

.sign-modal-stamp__hint {
  font-size: 0.85em;
  color: var(--text3, #9ca3af);
  font-style: italic;
}

.sign-modal-field-label {
  display: block;
  font-size: 0.82em;
  color: var(--text2, #555);
  margin-bottom: 4px;
}

.sign-modal-input {
  width: 100%;
  border: 1px solid var(--border, #d1d5db);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.95em;
  background: var(--bg, #fff);
  color: var(--text, #111);
  outline: none;
}

.sign-modal-input:focus {
  border-color: var(--accent, #2563eb);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent, #2563eb) 15%, transparent);
}

.sign-modal-clear {
  color: var(--text2, #555);
}

.sign-modal-footer-right {
  display: flex;
  gap: 8px;
}
</style>

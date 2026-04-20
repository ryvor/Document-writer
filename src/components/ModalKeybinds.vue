<template>
  <teleport to="body">
    <div class="modal-backdrop" @click.self="handleBackdropClick">
      <div class="modal-box kb-modal" role="dialog" aria-modal="true">
        <h3 class="modal-title">Keyboard Shortcuts</h3>
        <p class="modal-message">Click a shortcut to rebind it. Press Escape to cancel.</p>

        <div class="kb-content">
          <div v-for="group in ['App', 'Editor']" :key="group" class="kb-section">
            <div class="kb-section-title">{{ group }}</div>
            <div
              v-for="action in groupActions(group)"
              :key="action"
              class="kb-row"
              :class="{ 'kb-row--active': capturing === action }"
            >
              <span class="kb-label">{{ ACTION_META[action].label }}</span>

              <button
                class="kb-chip"
                :class="{
                  'kb-chip--capturing': capturing === action,
                  'kb-chip--unbound': !keybindsStore.bindings[action],
                }"
                @click="startCapture(action)"
              >
                <template v-if="capturing === action">
                  <span class="kb-wait">Press keys…</span>
                </template>
                <template v-else-if="keybindsStore.bindings[action]">
                  <kbd
                    v-for="(part, i) in keybindsStore.bindings[action].split('+')"
                    :key="i"
                    class="kb-key"
                  >{{ part }}</kbd>
                </template>
                <span v-else class="kb-none">Unbound</span>
              </button>

              <div class="kb-btns">
                <button
                  v-if="keybindsStore.bindings[action]"
                  class="kb-icon-btn"
                  title="Clear binding"
                  @click.stop="keybindsStore.set(action, '')"
                >
                  <font-awesome-icon icon="xmark" />
                </button>
                <button
                  class="kb-icon-btn"
                  :class="{ 'kb-icon-btn--changed': keybindsStore.bindings[action] !== DEFAULTS[action] }"
                  title="Reset to default"
                  @click.stop="keybindsStore.reset(action)"
                >
                  <font-awesome-icon icon="rotate-left" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-btn modal-btn-ghost" @click="keybindsStore.reset()">Reset all</button>
          <div class="modal-spacer" />
          <button class="modal-btn modal-btn-ghost" @click="handleClose">Close</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { keybindsStore, ACTION_META, DEFAULTS, captureCombo } from '../stores/keybindsStore.js'

const emit = defineEmits(['close'])

const capturing = ref(null)

function groupActions(group) {
  return Object.keys(ACTION_META).filter(k => ACTION_META[k].group === group)
}

function startCapture(action) {
  capturing.value = action
}

function handleCaptureKeyDown(event) {
  event.preventDefault()
  event.stopImmediatePropagation()
  if (event.key === 'Escape') {
    capturing.value = null
    return
  }
  const combo = captureCombo(event)
  if (!combo) return
  keybindsStore.set(capturing.value, combo)
  capturing.value = null
}

watch(capturing, (val, old) => {
  if (val) {
    window.addEventListener('keydown', handleCaptureKeyDown, true)
  } else if (old) {
    window.removeEventListener('keydown', handleCaptureKeyDown, true)
  }
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleCaptureKeyDown, true))

function handleBackdropClick() {
  if (capturing.value) { capturing.value = null; return }
  emit('close')
}

function handleClose() {
  if (capturing.value) { capturing.value = null; return }
  emit('close')
}
</script>

<style scoped>
.kb-modal {
  max-width: 560px;
  width: min(560px, calc(100vw - 40px));
}

.kb-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1rem 0;
  max-height: 58vh;
  overflow-y: auto;
  padding-right: 2px;
}

.kb-section-title {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text3);
  padding: 0 4px;
  margin-bottom: 3px;
}

.kb-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-radius: var(--radius-sm);
  transition: background 0.1s;
}

.kb-row:hover      { background: var(--btn-hover); }
.kb-row--active    { background: var(--btn-hover); }

.kb-label {
  font-size: 12px;
  color: var(--text);
}

.kb-chip {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 3px 8px;
  min-width: 138px;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}

.kb-chip:hover {
  border-color: var(--accent);
  background: var(--btn-hover);
}

.kb-chip--capturing {
  border-color: var(--accent);
  background: var(--btn-hover);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

.kb-chip--unbound {
  border-style: dashed;
  opacity: 0.55;
}

.kb-key {
  display: inline-block;
  padding: 1px 5px;
  font-size: 10px;
  font-family: monospace;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--text);
  line-height: 1.6;
}

.kb-wait {
  font-size: 11px;
  font-style: italic;
  color: var(--accent);
  animation: kb-pulse 1s ease-in-out infinite;
}

.kb-none {
  font-size: 11px;
  color: var(--text3);
  font-style: italic;
}

.kb-btns {
  display: flex;
  gap: 1px;
}

.kb-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text3);
  font-size: 10px;
  transition: color 0.1s, background 0.1s;
}

.kb-icon-btn:hover {
  background: var(--btn-hover);
  color: var(--text);
}

.kb-icon-btn--changed {
  color: var(--accent);
}

@keyframes kb-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}
</style>

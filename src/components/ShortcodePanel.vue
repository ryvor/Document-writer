<template>
  <aside class="sc-panel">
    <div class="sc-panel-header">
      <span class="sc-panel-title">
        <font-awesome-icon icon="tag" /> Shortcodes
      </span>
      <button class="sc-panel-close" @click="emit('close')" title="Close panel">
        <font-awesome-icon icon="xmark" />
      </button>
    </div>

    <!-- Used custom shortcodes — one accordion per key -->
    <template v-if="usedVariableKeys.length">
      <div class="sc-section-label">Variables in Document</div>
      <div
        v-for="key in usedVariableKeys"
        :key="key"
        class="sc-used-card"
      >
        <div class="sc-used-header" @click="toggleExpanded(key)">
          <code class="sc-key">{{ '{' + key + '}' }}</code>
          <font-awesome-icon :icon="expanded.has(key) ? 'chevron-down' : 'chevron-right'" class="sc-chevron" />
        </div>
        <div v-if="expanded.has(key)" class="sc-used-body">
          <label class="sc-field-label">Value</label>
          <div class="sc-row">
            <input
              class="sc-input"
              :value="getVarValue(key)"
              @input="setVarValue(key, $event.target.value)"
              placeholder="Variable value…"
            />
            <button
              class="sc-clear-btn"
              @click="clearVar(key)"
              title="Clear override (use default)"
            >
              <font-awesome-icon icon="rotate-left" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Built-in shortcodes -->
    <div class="sc-section-label">
      Built-in
      <button class="sc-toggle" @click="builtinOpen = !builtinOpen">
        <font-awesome-icon :icon="builtinOpen ? 'chevron-down' : 'chevron-right'" />
      </button>
    </div>
    <div v-if="builtinOpen" class="sc-builtin-list">
      <div v-for="sc in BUILTIN_DEFINITIONS" :key="sc.key" class="sc-builtin-row">
        <code class="sc-key">{{ '{' + sc.key + '}' }}</code>
        <span class="sc-desc">{{ sc.description }}</span>
        <button class="sc-insert-btn" @click="emit('insert', sc.key)" title="Insert into document">
          <font-awesome-icon icon="plus" />
        </button>
      </div>
    </div>

    <!-- Custom shortcodes -->
    <div class="sc-section-label">
      Custom
      <button class="sc-toggle" @click="customOpen = !customOpen">
        <font-awesome-icon :icon="customOpen ? 'chevron-down' : 'chevron-right'" />
      </button>
    </div>
    <div v-if="customOpen">
      <div v-for="sc in shortcodeStore.custom" :key="sc.key" class="sc-custom-row">
        <code class="sc-key">{{ '{' + sc.key + '}' }}</code>
        <span class="sc-value-preview">{{ sc.value }}</span>
        <button class="sc-insert-btn" @click="emit('insert', sc.key)" title="Insert">
          <font-awesome-icon icon="plus" />
        </button>
        <button class="sc-delete-btn" @click="shortcodeStore.remove(sc.key)" title="Delete">
          <font-awesome-icon icon="trash" />
        </button>
      </div>

      <!-- Add new shortcode form -->
      <div class="sc-add-form">
        <div class="sc-add-title">New Shortcode</div>
        <input v-model="newKey"   class="sc-input" placeholder="key (e.g. company)" @keydown.enter="addShortcode" />
        <input v-model="newValue" class="sc-input" placeholder="value"              @keydown.enter="addShortcode" />
        <input v-model="newDesc"  class="sc-input" placeholder="description (optional)" @keydown.enter="addShortcode" />
        <div v-if="addError" class="sc-error">{{ addError }}</div>
        <button class="sc-add-btn" @click="addShortcode">
          <font-awesome-icon icon="plus" /> Add Shortcode
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { BUILTIN_DEFINITIONS, BUILTIN_KEYS } from '../utils/builtinShortcodes.js'
import { shortcodeStore } from '../stores/shortcodeStore.js'
import { documentStore } from '../stores/documentStore.js'

const props = defineProps({
  docId:    { type: String, required: true },
  usedKeys: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'insert'])

const usedVariableKeys = computed(() =>
  props.usedKeys.filter(k => !BUILTIN_KEYS.has(k))
)

const expanded   = reactive(new Set())
const builtinOpen = ref(true)
const customOpen  = ref(true)

function toggleExpanded(key) {
  if (expanded.has(key)) expanded.delete(key)
  else expanded.add(key)
}

function docForId() {
  return documentStore.documents.find(d => d.id === props.docId) || documentStore.active
}

function getVarValue(key) {
  const doc = docForId()
  const vars = doc?.shortcodeVars || {}
  if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key]
  return shortcodeStore.custom.find(s => s.key === key)?.value ?? ''
}

function setVarValue(key, value) {
  if (value === '') documentStore.removeShortcodeVar(props.docId, key)
  else documentStore.setShortcodeVar(props.docId, key, value)
}

function clearVar(key) {
  documentStore.removeShortcodeVar(props.docId, key)
}

const newKey   = ref('')
const newValue = ref('')
const newDesc  = ref('')
const addError = ref('')

const KEY_RE = /^[a-z0-9_]+$/

function addShortcode() {
  const k = newKey.value.trim().toLowerCase()
  if (!k) { addError.value = 'Key is required.'; return }
  if (!KEY_RE.test(k)) { addError.value = 'Key must be lowercase letters, numbers, or underscores.'; return }
  if (BUILTIN_KEYS.has(k)) { addError.value = `"${k}" is a built-in key.`; return }
  shortcodeStore.add(k, newValue.value.trim(), newDesc.value.trim())
  newKey.value = ''; newValue.value = ''; newDesc.value = ''; addError.value = ''
}
</script>

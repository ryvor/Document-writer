<template>
  <div class="panel-body">

    <!-- Used variables accordion -->
    <template v-if="usedVariableKeys.length">
      <div class="panel-section-label">Variables in Document</div>
      <div v-for="key in usedVariableKeys" :key="key" class="sc-used-card">
        <div class="sc-used-header" @click="toggleExpanded(key)">
          <code class="sc-key">{{ token(key) }}</code>
          <font-awesome-icon :icon="expanded.has(key) ? 'chevron-down' : 'chevron-right'" class="sc-chevron" />
        </div>
        <div v-if="expanded.has(key)" class="sc-used-body">
          <div class="sc-row">
            <input
              class="sc-input"
              :value="getVarValue(key)"
              @input="setVarValue(key, $event.target.value)"
              placeholder="Variable value…"
            />
            <button class="sc-clear-btn" @click="clearVar(key)" title="Clear override">
              <font-awesome-icon icon="rotate-left" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Built-in shortcodes -->
    <div class="panel-section-label">
      Built-in
      <button class="sc-toggle" @click="builtinOpen = !builtinOpen">
        <font-awesome-icon :icon="builtinOpen ? 'chevron-down' : 'chevron-right'" />
      </button>
    </div>
    <div v-if="builtinOpen" class="sc-builtin-list">
      <div v-for="sc in BUILTIN_DEFINITIONS" :key="sc.key" class="sc-builtin-row">
        <code class="sc-key">{{ token(sc.key) }}</code>
        <span class="sc-desc">{{ sc.description }}</span>
        <button class="sc-insert-btn" @click="emit('insert', sc.key)" title="Insert">
          <font-awesome-icon icon="plus" />
        </button>
      </div>
    </div>

    <!-- Custom shortcodes -->
    <div class="panel-section-label">
      Custom
      <button class="sc-toggle" @click="customOpen = !customOpen">
        <font-awesome-icon :icon="customOpen ? 'chevron-down' : 'chevron-right'" />
      </button>
    </div>
    <div v-if="customOpen">
      <div v-for="sc in shortcodeStore.custom" :key="sc.key" class="sc-custom-row">
        <code class="sc-key">{{ token(sc.key) }}</code>
        <span class="sc-value-preview">{{ sc.value }}</span>
        <button class="sc-insert-btn" @click="emit('insert', sc.key)" title="Insert">
          <font-awesome-icon icon="plus" />
        </button>
        <button class="sc-delete-btn" @click="shortcodeStore.remove(sc.key)" title="Delete">
          <font-awesome-icon icon="trash" />
        </button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { BUILTIN_DEFINITIONS, BUILTIN_KEYS } from '../../utils/builtinShortcodes.js'
import { shortcodeStore } from '../../stores/shortcodeStore.js'
import { documentStore }  from '../../stores/documentStore.js'

const props = defineProps({
  docId:    { type: String, required: true },
  usedKeys: { type: Array, default: () => [] },
})
const emit = defineEmits(['insert'])

const usedVariableKeys = computed(() => props.usedKeys.filter(k => !BUILTIN_KEYS.has(k)))

const expanded    = reactive(new Set())
const builtinOpen = ref(true)
const customOpen  = ref(true)

// If the document uses a variable shortcode that isn't in the custom set, auto-add it
// so it appears consistently in the sidebar + can be set via Settings modal.
watch(usedVariableKeys, keys => {
  for (const key of keys) {
    if (shortcodeStore.custom.some(s => s.key === key)) continue
    shortcodeStore.add(key, '', 'Auto-added from document')
    expanded.add(key)
  }
}, { immediate: true })

function toggleExpanded(key) {
  expanded.has(key) ? expanded.delete(key) : expanded.add(key)
}

function getVarValue(key) {
  const doc  = documentStore.documents.find(d => d.id === props.docId) || documentStore.active
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

function token(key) {
  return `{{${key}}}`
}
</script>

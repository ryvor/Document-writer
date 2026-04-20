<template>
  <div class="editor-area">

    <!-- Scrollable canvas (gray background) -->
    <div class="editor-canvas" ref="canvasRef" @click.self="focusEditor">
      <div
        class="editor-page"
        :style="{
          width:     `${page.width}px`,
          minHeight: `${page.height}px`,
          padding:   `${page.marginY}px ${page.marginX}px`,
          zoom:      uiStore.zoom,
        }"
        @click="focusEditor"
      >
        <MarkdownEditor
          ref="paneRef"
          :model-value="modelValue"
          :doc-id="docId"
          :sign-mode-locked="signModeLocked"
          @update:model-value="emit('update:modelValue', $event)"
          @stats="emit('stats', $event)"
          @sign-click="emit('sign-click', $event)"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { uiStore }    from '../stores/uiStore.js'
import MarkdownEditor from './MarkdownEditor.vue'

const props = defineProps({
  modelValue:     { type: String, default: '' },
  docId:          { type: String, required: true },
  signModeLocked: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'stats', 'sign-click'])

const paneRef   = ref(null)
const canvasRef = ref(null)
const page      = computed(() => uiStore.page)

function focusEditor() {
  paneRef.value?.focus?.()
}

function fit(type) {
  const canvas = canvasRef.value
  if (!canvas) return
  const pw = page.value.width
  const ph = page.value.height
  const cw = canvas.clientWidth  - 80
  const ch = canvas.clientHeight - 80
  if (type === 'width')  uiStore.setZoom(cw / pw)
  if (type === 'height') uiStore.setZoom(ch / ph)
  if (type === 'all')    uiStore.setZoom(Math.min(cw / pw, ch / ph))
  if (type === 'reset')  uiStore.setZoom(1)
}

defineExpose({
  editorView: computed(() => paneRef.value?.view ?? null),
  focusEditor,
  fit,
})
</script>

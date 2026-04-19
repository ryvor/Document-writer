<template>
  <node-view-wrapper as="span" class="shortcode-node" :class="{ 'is-selected': selected }">
    <span class="sc-value">{{ resolvedValue }}</span>
    <span class="sc-tooltip">{{ '{' + node.attrs.key + '}' }}</span>
  </node-view-wrapper>
</template>

<script setup>
import { computed } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { shortcodeStore } from '../stores/shortcodeStore.js'

const props = defineProps({
  node:             { type: Object,   required: true },
  selected:         { type: Boolean,  default: false },
  editor:           { type: Object,   default: null },
  getPos:           { type: Function, default: null },
  updateAttributes: { type: Function, default: null },
})

const resolvedValue = computed(() => shortcodeStore.resolve(props.node.attrs.key))
</script>

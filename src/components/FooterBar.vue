<template>
  <footer class="footer-bar">

    <!-- Page size (moved from top bar) -->
    <select
      class="footer-page-select"
      :value="uiStore.pageSize"
      @change="uiStore.setPageSize($event.target.value)"
      title="Page size"
    >
      <optgroup v-for="group in pageGroups" :key="group.label" :label="group.label">
        <option v-for="size in group.sizes" :key="size.id" :value="size.id">
          {{ size.name }}
        </option>
      </optgroup>
    </select>

    <!-- Word / char count -->
    <span v-if="settingsStore.showStats" class="footer-stats">
      {{ stats.words }} words · {{ stats.characters }} chars
    </span>

    <!-- Spacer -->
    <div class="footer-spacer" />

    <!-- Zoom controls -->
    <div class="footer-zoom">
      <button class="footer-icon-btn" title="Zoom out" @click="uiStore.setZoom(uiStore.zoom - 0.1)">
        <font-awesome-icon icon="magnifying-glass-minus" />
      </button>
      <input
        class="footer-zoom-slider"
        type="range"
        min="0.25"
        max="3"
        step="0.05"
        :value="uiStore.zoom"
        @input="uiStore.setZoom(+$event.target.value)"
        title="Zoom"
      />
      <button class="footer-icon-btn" title="Zoom in" @click="uiStore.setZoom(uiStore.zoom + 0.1)">
        <font-awesome-icon icon="magnifying-glass-plus" />
      </button>
      <span class="footer-zoom-pct">{{ Math.round(uiStore.zoom * 100) }}%</span>
      <button class="footer-fit-btn" title="Fit width"  @click="emit('fit', 'width')">W</button>
      <button class="footer-fit-btn" title="Fit height" @click="emit('fit', 'height')">H</button>
      <button class="footer-fit-btn" title="Fit all"    @click="emit('fit', 'all')">
        <font-awesome-icon icon="expand" />
      </button>
      <button class="footer-fit-btn" title="100%"       @click="uiStore.setZoom(1)">100%</button>
    </div>

  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { uiStore, PAGE_SIZES } from '../stores/uiStore.js'
import { settingsStore } from '../stores/settingsStore.js'

defineProps({
  stats: { type: Object, default: () => ({ words: 0, characters: 0 }) },
})

const emit = defineEmits(['fit'])

const pageGroups = computed(() => {
  const groups = {}
  for (const s of PAGE_SIZES) {
    if (!groups[s.group]) groups[s.group] = { label: s.group, sizes: [] }
    groups[s.group].sizes.push(s)
  }
  return Object.values(groups)
})
</script>

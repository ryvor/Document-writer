<template>
  <aside
    class="sidebar"
    :class="[`sidebar--${uiStore.sidebarPosition}`]"
  >

    <!-- Sidebar controls -->
    <div class="sidebar-controls pill">
      <button
        class="sidebar-snap-btn btn"
        :class="{ active: uiStore.sidebarPosition === 'left' }"
        title="Snap to left"
        @click="uiStore.setSidebarPos('left')"
      >
        <font-awesome-icon icon="arrow-left" />
      </button>
      <button
        class="sidebar-snap-btn btn"
        :class="{ active: uiStore.sidebarPosition === 'right' }"
        title="Snap to right"
        @click="uiStore.setSidebarPos('right')"
      >
        <font-awesome-icon icon="arrow-right" />
      </button>
      <div class="sidebar-controls-spacer" />
      <button class="sidebar-close-btn btn" title="Close sidebar" @click="uiStore.toggleSidebar()">
        <font-awesome-icon icon="xmark" />
      </button>
    </div>

    <!-- Panels in drag order -->
    <div
      class="sidebar-panels"
      @dragover.prevent
      @drop.prevent="onDrop($event)"
    >
      <div
        v-for="panelId in uiStore.panelOrder"
        :key="panelId"
        class="sidebar-panel"
        :class="{ expanded: uiStore.isExpanded(panelId) }"
        :data-panel-id="panelId"
        draggable="true"
        @dragstart="onDragStart($event, panelId)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, panelId)"
      >
        <!-- Panel header -->
        <div class="panel-header" @click="uiStore.togglePanel(panelId)">
          <font-awesome-icon icon="grip-vertical" class="panel-grip" />
          <font-awesome-icon :icon="panelIcons[panelId]" class="panel-icon" />
          <span class="panel-title">{{ panelTitles[panelId] }}</span>
          <font-awesome-icon
            :icon="uiStore.isExpanded(panelId) ? 'chevron-down' : 'chevron-right'"
            class="panel-chevron"
          />
        </div>

        <!-- Panel content -->
        <transition name="panel-collapse">
          <div v-if="uiStore.isExpanded(panelId)" class="panel-content">
            <ShortcodesPanel
              v-if="panelId === 'shortcodes'"
              :doc-id="docId"
              :used-keys="usedKeys"
              @insert="emit('insert', $event)"
            />
            <MetadataPanel
              v-else-if="panelId === 'metadata'"
              :doc-id="docId"
            />
            <ESignPanel
              v-else-if="panelId === 'esign'"
              :doc-id="docId"
            />
          </div>
        </transition>
      </div>
    </div>

  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { uiStore } from '../stores/uiStore.js'
import ShortcodesPanel from './panels/ShortcodesPanel.vue'
import MetadataPanel   from './panels/MetadataPanel.vue'
import ESignPanel      from './panels/ESignPanel.vue'

defineProps({
  docId:    { type: String, required: true },
  usedKeys: { type: Array, default: () => [] },
})

const emit = defineEmits(['insert'])

const panelTitles = { shortcodes: 'Shortcodes', metadata: 'Metadata', esign: 'E-Sign' }
const panelIcons  = { shortcodes: 'tag', metadata: 'circle-info', esign: 'signature' }

const dragId   = ref(null)
const dragOver = ref(null)

function onDragStart(e, id) {
  dragId.value = id
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragId.value   = null
  dragOver.value = null
}

function onDragOver(e, id) {
  if (id !== dragId.value) dragOver.value = id
}

function onDrop(e) {
  const targetId = e.target.closest('[data-panel-id]')?.dataset.panelId
  if (targetId && dragId.value && targetId !== dragId.value) {
    uiStore.movePanelBefore(dragId.value, targetId)
  }
  dragId.value   = null
  dragOver.value = null
}
</script>

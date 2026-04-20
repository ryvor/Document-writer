<template>
  <aside
    v-if="hasAny"
    class="dock"
    :class="[`dock--${side}`]"
  >
    <transition-group
      v-if="pillPanels.length"
      name="dock-pill"
      tag="div"
      class="dock-pills"
      :class="[`dock-pills--${side}`]"
    >
      <button
        v-for="panelId in pillPanels"
        :key="panelId"
        class="dock-pill"
        :title="panelTitles[panelId]"
        @click="onPillClick(panelId, $event)"
      >
        <font-awesome-icon :icon="panelIcons[panelId]" />
        <span class="dock-pill__text">{{ panelTitles[panelId] }}</span>
      </button>
    </transition-group>

    <transition-group
      v-if="pinnedPanels.length"
      name="dock-panel"
      tag="div"
      class="dock-panels"
    >
      <div
        v-for="panelId in pinnedPanels"
        :key="panelId"
        class="dock-panel"
        :data-panel-id="panelId"
        draggable="true"
        @dragstart="onDragStart($event, panelId)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, panelId)"
        @drop.prevent="onDrop($event)"
      >
        <div class="dock-panel__head">
          <font-awesome-icon icon="grip-vertical" class="dock-panel__grip" />
          <font-awesome-icon :icon="panelIcons[panelId]" class="dock-panel__icon" />
          <div class="dock-panel__title">{{ panelTitles[panelId] }}</div>
          <div class="dock-panel__spacer" />
          <button
            class="dock-panel__btn"
            title="Minimize"
            @click.stop="uiStore.setPanelMinimized(panelId, true)"
          >
            <font-awesome-icon icon="compress" />
          </button>
          <button
            class="dock-panel__btn"
            :title="side === 'left' ? 'Move to right' : 'Move to left'"
            @click.stop="uiStore.movePanelToSide(panelId, side === 'left' ? 'right' : 'left')"
          >
            <font-awesome-icon :icon="side === 'left' ? 'arrow-right' : 'arrow-left'" />
          </button>
        </div>

        <div class="dock-panel__body">
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
      </div>
    </transition-group>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue'
import { uiStore } from '../stores/uiStore.js'
import ShortcodesPanel from './panels/ShortcodesPanel.vue'
import MetadataPanel   from './panels/MetadataPanel.vue'
import ESignPanel      from './panels/ESignPanel.vue'

const props = defineProps({
  side:    { type: String, required: true }, // left|right
  docId:   { type: String, required: true },
  usedKeys:{ type: Array, default: () => [] },
})

const emit = defineEmits(['insert'])

const panelTitles = { shortcodes: 'Shortcodes', metadata: 'Metadata', esign: 'E-Sign' }
const panelIcons  = { shortcodes: 'tag', metadata: 'circle-info', esign: 'signature' }

const pinnedPanels = computed(() => uiStore.pinnedPanelsForSide(props.side))
const pillPanels   = computed(() => uiStore.pillPanelsForSide(props.side))
const hasAny       = computed(() => pinnedPanels.value.length || pillPanels.value.length)

function restore(panelId) {
  uiStore.setDockCollapsed(false)
  uiStore.setPanelMinimized(panelId, false)
}

function onPillClick(panelId, e) {
  if (e?.shiftKey) {
    uiStore.movePanelToSide(panelId, props.side === 'left' ? 'right' : 'left')
    return
  }
  restore(panelId)
}

const dragId   = ref(null)
const dragOver = ref(null)

function onDragStart(e, id) {
  dragId.value = id
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  dragId.value = null
  dragOver.value = null
}

function onDragOver(_e, id) {
  if (id !== dragId.value) dragOver.value = id
}

function onDrop(e) {
  const targetId = e.target.closest('[data-panel-id]')?.dataset.panelId
  if (targetId && dragId.value && targetId !== dragId.value) {
    uiStore.movePanelBefore(dragId.value, targetId, props.side)
  }
  dragId.value = null
  dragOver.value = null
}
</script>

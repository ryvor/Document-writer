<template>
  <div class="home-view">
    <section class="home-hero card">
      <div class="home-hero__left">
        <div class="home-hero__kicker">
          <span class="home-hero__dot" aria-hidden="true" />
          Document Writer
        </div>

        <h1 class="home-hero__title">Your documents, perfected</h1>
        <p class="home-hero__sub">
          Write in Markdown, drop in shortcodes, and export clean PDFs in seconds. Designed for fast drafting and polished output.
        </p>

        <div class="home-hero__actions">
          <button class="pill btn btn--primary" @click="emit('new-doc')">
            Start writing
          </button>
          <button class="pill btn" @click="jumpToRecent">
            Explore recent
          </button>
          <button class="pill btn" @click="emit('open-dwdoc')" title="Open a .dwdoc signable document">
            Open signable (.dwdoc)
          </button>
        </div>

        <div class="home-hero__chips">
          <div class="chip">
            <span class="home-chip__num">{{ documents.length }}</span>
            <span class="home-chip__label">documents</span>
          </div>
          <div class="chip">
            <span class="home-chip__num">{{ recentDocuments.length }}</span>
            <span class="home-chip__label">recent</span>
          </div>
          <div v-if="lastModifiedLabel" class="chip">
            <span class="home-chip__num">Last edited</span>
            <span class="home-chip__label">{{ lastModifiedLabel }}</span>
          </div>
        </div>
      </div>

      <div class="home-hero__right" aria-hidden="true">
        <div class="home-blob">
          <div class="home-blob__chip home-blob__chip--a">
            <span class="home-blob__chip-dot" />
            PDF export ready
          </div>
          <div class="home-blob__chip home-blob__chip--b">
            <span class="home-blob__chip-dot" />
            Shortcodes
          </div>
          <div class="home-blob__chip home-blob__chip--c">
            <span class="home-blob__chip-dot" />
            E-sign HTML
          </div>
        </div>
      </div>
    </section>

    <section class="home-grid">
      <div class="home-panel card" id="recent">
        <div class="home-panel__head">
          <div class="home-panel__title">Recent documents</div>
          <button class="pill btn" @click="emit('new-doc')">New document</button>
        </div>

        <div class="home-list">
          <button
            v-for="d in recentDocuments"
            :key="d.id"
            class="home-doc"
            @click="emit('open-doc', d.id)"
            :title="d.title || 'Untitled'"
          >
            <div class="home-doc__title">
              {{ d.title || 'Untitled' }}
              <span v-if="d.dirty" class="home-doc__dirty">●</span>
            </div>
            <div class="home-doc__sub">
              {{ d.filenameSlug || '' }}
              <span v-if="formatDate(d.metadata?.modified)" class="home-doc__meta">
                · {{ formatDate(d.metadata?.modified) }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <div class="home-panel card">
        <div class="home-panel__head">
          <div class="home-panel__title">Quick actions</div>
        </div>

        <div class="home-actions">
          <div class="home-action">
            <div class="home-action__title">Export PDF</div>
            <div class="home-action__sub">Use the toolbar to export a clean PDF with page sizing.</div>
          </div>
          <div class="home-action">
            <div class="home-action__title">Insert shortcodes</div>
            <div class="home-action__sub">Add variables like <code>{{ token('company') }}</code> and fill them in from the sidebar.</div>
          </div>
          <div class="home-action">
            <div class="home-action__title">E-sign HTML</div>
            <div class="home-action__sub">Export a self-contained HTML file with click-to-sign.</div>
          </div>
          <div class="home-action home-action--kbd">
            <div class="home-action__title">Keyboard</div>
            <div class="home-action__sub">
              <span class="home-kbd">Ctrl</span>+<span class="home-kbd">T</span> new tab · <span class="home-kbd">Ctrl</span>+<span class="home-kbd">B</span> bold · <span class="home-kbd">Ctrl</span>+<span class="home-kbd">I</span> italic
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  documents: { type: Array, default: () => [] },
})

const emit = defineEmits(['new-doc', 'open-doc', 'open-dwdoc'])

function docTime(doc) {
  const raw = doc?.metadata?.modified || doc?.metadata?.created || ''
  const ms = Date.parse(raw)
  return Number.isFinite(ms) ? ms : 0
}

const recentDocuments = computed(() => {
  const docs = Array.isArray(props.documents) ? props.documents : []
  return [...docs]
    .sort((a, b) => docTime(b) - docTime(a))
    .slice(0, 10)
})

const lastModifiedLabel = computed(() => {
  const d = recentDocuments.value[0]
  if (!d) return ''
  return formatDate(d.metadata?.modified)
})

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

function jumpToRecent() {
  document.getElementById('recent')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function token(key) {
  return `{{${key}}}`
}
</script>

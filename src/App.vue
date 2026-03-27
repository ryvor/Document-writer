<template>
  <div class="layout">
    <header>
      <h1>Document Writer</h1>
      <p>Tabbed WYSIWYG editor with token replacement and PDF export.</p>
    </header>

    <section class="tabs">
      <button
        v-for="doc in documents"
        :key="doc.id"
        :class="['tab', { active: doc.id === activeDocId }]"
        @click="selectDoc(doc.id)"
      >
        {{ doc.title || 'Untitled' }}
        <span class="close" @click.stop="closeDoc(doc.id)">×</span>
      </button>
      <button class="new-tab" @click="newDoc">+ New tab</button>
    </section>

    <section class="toolbar">
      <button @click="execCmd('bold')"><b>B</b></button>
      <button @click="execCmd('italic')"><i>I</i></button>
      <button @click="execCmd('underline')"><u>U</u></button>
      <button @click="execCmd('insertUnorderedList')">• List</button>
      <button @click="insertToken">Insert [curr_date]</button>
      <button class="export" @click="exportActive">Export PDF</button>
    </section>

    <section class="meta">
      <label>
        Title:
        <input v-model="activeDoc.title" placeholder="Document title" />
      </label>
    </section>

    <main
      ref="editor"
      class="editor"
      contenteditable="true"
      @input="onInput"
      @keydown.tab.prevent="insertTabSpaces"
      :key="activeDoc.id"
      v-html="activeDoc.content"
    ></main>

    <footer>
      Use <code>[curr_date]</code> anywhere in your content. It will be replaced during export.
    </footer>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const documents = ref([
  { id: crypto.randomUUID(), title: 'Document 1', content: '<p>Start writing...</p>' }
]);
const activeDocId = ref(documents.value[0].id);
const editor = ref(null);

const activeDoc = computed(() =>
  documents.value.find((doc) => doc.id === activeDocId.value) || documents.value[0]
);

watch(activeDocId, async () => {
  await nextTick();
  if (editor.value) {
    editor.value.innerHTML = activeDoc.value.content;
  }
});

function newDoc() {
  const newDocument = {
    id: crypto.randomUUID(),
    title: `Document ${documents.value.length + 1}`,
    content: '<p></p>'
  };
  documents.value.push(newDocument);
  activeDocId.value = newDocument.id;
}

function selectDoc(id) {
  activeDocId.value = id;
}

function closeDoc(id) {
  if (documents.value.length === 1) return;

  const index = documents.value.findIndex((doc) => doc.id === id);
  documents.value = documents.value.filter((doc) => doc.id !== id);

  if (activeDocId.value === id) {
    const next = documents.value[index] || documents.value[index - 1] || documents.value[0];
    activeDocId.value = next.id;
  }
}

function onInput(event) {
  activeDoc.value.content = event.target.innerHTML;
}

function execCmd(command) {
  document.execCommand(command, false);
  if (editor.value) {
    activeDoc.value.content = editor.value.innerHTML;
  }
}

function insertToken() {
  document.execCommand('insertText', false, '[curr_date]');
  if (editor.value) {
    activeDoc.value.content = editor.value.innerHTML;
  }
}

function insertTabSpaces() {
  document.execCommand('insertText', false, '    ');
  if (editor.value) {
    activeDoc.value.content = editor.value.innerHTML;
  }
}

function withResolvedTokens(html) {
  const today = new Date().toISOString().split('T')[0];
  return html.replaceAll('[curr_date]', today);
}

async function exportActive() {
  if (!window.electronAPI?.exportPDF) {
    alert('PDF export API unavailable. Ensure app is running in Electron.');
    return;
  }

  const result = await window.electronAPI.exportPDF({
    title: activeDoc.value.title,
    htmlContent: withResolvedTokens(activeDoc.value.content)
  });

  if (!result?.canceled) {
    alert(`Exported to: ${result.filePath}`);
  }
}
</script>

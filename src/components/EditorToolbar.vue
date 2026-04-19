<template>
  <div class="toolbar">

    <!-- History -->
    <div class="tb-group">
      <button class="tb-btn" title="Undo (Ctrl+Z)" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()">
        <font-awesome-icon icon="rotate-left" />
      </button>
      <button class="tb-btn" title="Redo (Ctrl+Y)" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()">
        <font-awesome-icon icon="rotate-right" />
      </button>
    </div>

    <div class="tb-sep" />

    <!-- Paragraph style -->
    <div class="tb-group">
      <select class="tb-select" :value="activeHeading" @change="setHeading($event.target.value)" title="Paragraph style">
        <option value="0">Normal</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="4">Heading 4</option>
        <option value="5">Heading 5</option>
        <option value="6">Heading 6</option>
      </select>
    </div>

    <div class="tb-sep" />

    <!-- Character formatting -->
    <div class="tb-group">
      <button class="tb-btn" :class="{ active: editor?.isActive('bold') }"        title="Bold (Ctrl+B)"       @click="editor?.chain().focus().toggleBold().run()"><font-awesome-icon icon="bold" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('italic') }"      title="Italic (Ctrl+I)"     @click="editor?.chain().focus().toggleItalic().run()"><font-awesome-icon icon="italic" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('underline') }"   title="Underline (Ctrl+U)"  @click="editor?.chain().focus().toggleUnderline().run()"><font-awesome-icon icon="underline" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('strike') }"      title="Strikethrough"       @click="editor?.chain().focus().toggleStrike().run()"><font-awesome-icon icon="strikethrough" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('subscript') }"   title="Subscript"           @click="editor?.chain().focus().toggleSubscript().run()"><font-awesome-icon icon="subscript" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('superscript') }" title="Superscript"         @click="editor?.chain().focus().toggleSuperscript().run()"><font-awesome-icon icon="superscript" /></button>
    </div>

    <div class="tb-sep" />

    <!-- Color -->
    <div class="tb-group">
      <label class="tb-btn color-pick" title="Text color">
        <font-awesome-icon icon="font" />
        <input type="color" class="hidden-color" @input="e => editor?.chain().focus().setColor(e.target.value).run()" />
      </label>
      <label class="tb-btn color-pick" title="Highlight color">
        <font-awesome-icon icon="highlighter" />
        <input type="color" class="hidden-color" value="#ffd700" @input="e => editor?.chain().focus().setHighlight({ color: e.target.value }).run()" />
      </label>
    </div>

    <div class="tb-sep" />

    <!-- Alignment -->
    <div class="tb-group">
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'left' }) }"    title="Align left"    @click="editor?.chain().focus().setTextAlign('left').run()"><font-awesome-icon icon="align-left" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'center' }) }"  title="Align centre"  @click="editor?.chain().focus().setTextAlign('center').run()"><font-awesome-icon icon="align-center" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'right' }) }"   title="Align right"   @click="editor?.chain().focus().setTextAlign('right').run()"><font-awesome-icon icon="align-right" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive({ textAlign: 'justify' }) }" title="Justify"       @click="editor?.chain().focus().setTextAlign('justify').run()"><font-awesome-icon icon="align-justify" /></button>
    </div>

    <div class="tb-sep" />

    <!-- Lists -->
    <div class="tb-group">
      <button class="tb-btn" :class="{ active: editor?.isActive('bulletList') }"  title="Bullet list"    @click="editor?.chain().focus().toggleBulletList().run()"><font-awesome-icon icon="list-ul" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('orderedList') }" title="Numbered list"  @click="editor?.chain().focus().toggleOrderedList().run()"><font-awesome-icon icon="list-ol" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('taskList') }"    title="Task list"      @click="editor?.chain().focus().toggleTaskList().run()"><font-awesome-icon icon="square-check" /></button>
    </div>

    <div class="tb-sep" />

    <!-- Insert -->
    <div class="tb-group">
      <button class="tb-btn" :class="{ active: editor?.isActive('link') }"      title="Link"           @click="insertLink"><font-awesome-icon icon="link" /></button>
      <button class="tb-btn"                                                     title="Image URL"      @click="insertImage"><font-awesome-icon icon="image" /></button>
      <button class="tb-btn"                                                     title="Insert table"   @click="insertTable"><font-awesome-icon icon="table" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('codeBlock') }" title="Code block"     @click="editor?.chain().focus().toggleCodeBlock().run()"><font-awesome-icon icon="code" /></button>
      <button class="tb-btn" :class="{ active: editor?.isActive('blockquote') }" title="Blockquote"    @click="editor?.chain().focus().toggleBlockquote().run()"><font-awesome-icon icon="quote-left" /></button>
      <button class="tb-btn"                                                     title="Horizontal rule" @click="editor?.chain().focus().setHorizontalRule().run()"><font-awesome-icon icon="minus" /></button>
    </div>

    <div class="tb-sep" />

    <!-- Shortcodes dropdown -->
    <div class="tb-group tb-dropdown-wrap" ref="scWrapRef">
      <button class="tb-btn tb-labeled" @click.stop="scOpen = !scOpen" title="Insert shortcode">
        <font-awesome-icon icon="tag" /><span>Shortcode</span>
      </button>
      <div v-if="scOpen" class="tb-dropdown">
        <div class="dd-label">Built-in</div>
        <button
          v-for="sc in BUILTIN_DEFINITIONS"
          :key="sc.key"
          class="dd-item"
          @click="insertShortcode(sc.key)"
        >
          <code>{{ '{' + sc.key + '}' }}</code>
          <span>{{ sc.description }}</span>
        </button>
        <template v-if="customShortcodes.length">
          <div class="dd-label">Custom</div>
          <button
            v-for="sc in customShortcodes"
            :key="sc.key"
            class="dd-item"
            @click="insertShortcode(sc.key)"
          >
            <code>{{ '{' + sc.key + '}' }}</code>
            <span>{{ sc.value }}</span>
          </button>
        </template>
        <div v-if="!customShortcodes.length" class="dd-hint">
          Add custom shortcodes in the Shortcodes panel →
        </div>
      </div>
    </div>

    <div class="tb-spacer" />

    <!-- Export -->
    <div class="tb-group">
      <button class="tb-btn tb-labeled accent" title="Export as PDF"      @click="emit('export-pdf')"><font-awesome-icon icon="file-pdf" /><span>PDF</span></button>
      <button class="tb-btn tb-labeled"         title="Export signable copy" @click="emit('export-signable')"><font-awesome-icon icon="file-signature" /><span>Sign</span></button>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { BUILTIN_DEFINITIONS } from '../utils/builtinShortcodes.js'
import { shortcodeStore } from '../stores/shortcodeStore.js'

const props = defineProps({
  editor: { type: Object, default: null },
})

const emit = defineEmits(['export-pdf', 'export-signable'])

const customShortcodes = computed(() => shortcodeStore.custom)

const activeHeading = computed(() => {
  if (!props.editor) return 0
  for (let i = 1; i <= 6; i++) {
    if (props.editor.isActive('heading', { level: i })) return i
  }
  return 0
})

function setHeading(value) {
  const level = parseInt(value)
  if (!props.editor) return
  if (level === 0) props.editor.chain().focus().setParagraph().run()
  else props.editor.chain().focus().toggleHeading({ level }).run()
}

function insertLink() {
  if (!props.editor) return
  const prev = props.editor.getAttributes('link').href || ''
  const url  = window.prompt('Enter URL', prev)
  if (url === null) return
  if (url === '') { props.editor.chain().focus().unsetLink().run(); return }
  props.editor.chain().focus().setLink({ href: url }).run()
}

function insertImage() {
  if (!props.editor) return
  const url = window.prompt('Enter image URL')
  if (url) props.editor.chain().focus().setImage({ src: url }).run()
}

function insertTable() {
  props.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

const scOpen    = ref(false)
const scWrapRef = ref(null)

function insertShortcode(key) {
  props.editor?.chain().focus().insertContent({ type: 'shortcode', attrs: { key } }).run()
  scOpen.value = false
}

function onDocClick(e) {
  if (!scWrapRef.value?.contains(e.target)) scOpen.value = false
}

onMounted(()        => document.addEventListener('click', onDocClick))
onBeforeUnmount(()  => document.removeEventListener('click', onDocClick))
</script>

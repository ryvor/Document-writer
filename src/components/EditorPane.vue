<template>
  <div class="editor-pane">
    <EditorToolbar
      :editor="editorInstance"
      @export-pdf="emit('export-pdf')"
      @export-signable="emit('export-signable')"
    />
    <div class="editor-scroll" @click="editorInstance?.chain().focus().run()">
      <editor-content :editor="editorInstance" class="editor-content-wrap" />
    </div>
  </div>
</template>

<script setup>
import { watch, onBeforeUnmount, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit      from '@tiptap/starter-kit'
import Underline       from '@tiptap/extension-underline'
import TextAlign       from '@tiptap/extension-text-align'
import Link            from '@tiptap/extension-link'
import Image           from '@tiptap/extension-image'
import Highlight       from '@tiptap/extension-highlight'
import Color           from '@tiptap/extension-color'
import TextStyle       from '@tiptap/extension-text-style'
import TaskList        from '@tiptap/extension-task-list'
import TaskItem        from '@tiptap/extension-task-item'
import Table           from '@tiptap/extension-table'
import TableRow        from '@tiptap/extension-table-row'
import TableCell       from '@tiptap/extension-table-cell'
import TableHeader     from '@tiptap/extension-table-header'
import Subscript       from '@tiptap/extension-subscript'
import Superscript     from '@tiptap/extension-superscript'
import CharacterCount  from '@tiptap/extension-character-count'
import EditorToolbar   from './EditorToolbar.vue'
import { ShortcodeExtension } from '../extensions/ShortcodeExtension.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  docId:      { type: String, required: true },
})

const emit = defineEmits(['update:modelValue', 'stats', 'export-pdf', 'export-signable'])

const editorRef = useEditor({
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
    Image,
    Highlight.configure({ multicolor: true }),
    Color,
    TextStyle,
    TaskList,
    TaskItem.configure({ nested: true }),
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Subscript,
    Superscript,
    CharacterCount,
    ShortcodeExtension,
  ],
  content: props.modelValue || '',
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
    emit('stats', {
      words:      editor.storage.characterCount.words(),
      characters: editor.storage.characterCount.characters(),
    })
  },
})

const editorInstance = computed(() => editorRef.value)

watch(() => props.docId, () => {
  editorRef.value?.commands.setContent(props.modelValue || '', false)
})

watch(() => props.modelValue, val => {
  if (editorRef.value && editorRef.value.getHTML() !== val) {
    editorRef.value.commands.setContent(val || '', false)
  }
})

onBeforeUnmount(() => editorRef.value?.destroy())

defineExpose({ editorRef })
</script>

import { Node, mergeAttributes } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ShortcodeNodeView from '../components/ShortcodeNodeView.vue'

export const ShortcodeExtension = Node.create({
  name: 'shortcode',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML:  el   => el.getAttribute('data-shortcode-key'),
        renderHTML: attrs => ({ 'data-shortcode-key': attrs.key }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="shortcode"]' }]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-type': 'shortcode',
      'data-shortcode-key': node.attrs.key,
    })]
  },

  addNodeView() {
    return VueNodeViewRenderer(ShortcodeNodeView)
  },
})

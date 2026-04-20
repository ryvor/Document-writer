import { Schema } from 'prosemirror-model'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { addListNodes } from 'prosemirror-schema-list'

// WYSIWYG schema that maps cleanly to Markdown v1.
// - Tables/images intentionally omitted from UI (but basic schema includes image; we keep it unused).
// - Adds a custom inline atom node for shortcodes: {{key}}
export function buildSchema() {
  const nodes = addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block')
    .addToEnd('sign_area', {
      group: 'block',
      atom: true,
      selectable: true,
      attrs: {
        id:    { default: '' },
        label: { default: '' },
      },
      parseDOM: [
        {
          tag: 'div[data-type="sign-area"]',
          getAttrs: dom => ({
            id:    dom.getAttribute('data-sign-id') || '',
            label: dom.getAttribute('data-sign-label') || '',
          }),
        },
      ],
      toDOM(node) {
        return [
          'div',
          {
            'data-type': 'sign-area',
            'data-sign-id': node.attrs.id,
            'data-sign-label': node.attrs.label,
            class: 'sign-area-node',
          },
        ]
      },
    })
    .addToEnd('shortcode', {
      group: 'inline',
      inline: true,
      atom: true,
      selectable: true,
      attrs: { key: { default: '' } },
      parseDOM: [
        {
          tag: 'span[data-type="shortcode"][data-shortcode-key]',
          getAttrs: dom => ({ key: dom.getAttribute('data-shortcode-key') || '' }),
        },
      ],
      toDOM(node) {
        return [
          'span',
          {
            'data-type': 'shortcode',
            'data-shortcode-key': node.attrs.key,
            class: 'sc-node',
          },
        ]
      },
    })

  return new Schema({
    nodes,
    marks: basicSchema.spec.marks,
  })
}


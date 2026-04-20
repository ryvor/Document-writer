import MarkdownIt from 'markdown-it'
import { MarkdownParser, MarkdownSerializer, defaultMarkdownSerializer } from 'prosemirror-markdown'
import { Fragment } from 'prosemirror-model'

const SHORTCODE_RE = /\{\{([a-z0-9_]+)\}\}/gi
const SIGN_AREA_RE = /^\[\[sign:([a-z0-9_-]+)(?:\|([^\]])*)?\]\]$/

export function buildMarkdownIt() {
  return new MarkdownIt({
    html: false,
    linkify: true,
    breaks: false,
  })
}

function textToInlineContent(schema, text) {
  const out = []
  let last = 0
  for (const match of text.matchAll(SHORTCODE_RE)) {
    const idx = match.index ?? 0
    const key = (match[1] || '').toLowerCase()
    if (idx > last) out.push(schema.text(text.slice(last, idx)))
    if (key) out.push(schema.nodes.shortcode.create({ key }))
    else out.push(schema.text(match[0]))
    last = idx + match[0].length
  }
  if (last < text.length) out.push(schema.text(text.slice(last)))
  return out
}

function replaceShortcodesInNode(schema, node) {
  if (node.isText) {
    if (!SHORTCODE_RE.test(node.text || '')) return node
    SHORTCODE_RE.lastIndex = 0
    const inlines = textToInlineContent(schema, node.text || '')
    return Fragment.fromArray(inlines)
  }

  if (!node.content || node.content.size === 0) return node

  let changed = false
  const children = []
  node.forEach(child => {
    const replaced = replaceShortcodesInNode(schema, child)
    if (replaced === child) {
      children.push(child)
      return
    }
    changed = true
    if (replaced instanceof Fragment) {
      replaced.forEach(n => children.push(n))
    } else {
      children.push(replaced)
    }
  })

  if (!changed) return node
  return node.type.create(node.attrs, Fragment.fromArray(children), node.marks)
}

function replaceSignAreasInNode(schema, node) {
  if (!schema.nodes.sign_area) return node

  if (node.type === schema.nodes.paragraph) {
    const text = node.textContent.trim()
    const m = SIGN_AREA_RE.exec(text)
    if (m) return schema.nodes.sign_area.create({ id: m[1], label: m[2] || '' })
    return node
  }

  if (!node.content || node.content.size === 0) return node

  let changed = false
  const children = []
  node.forEach(child => {
    const replaced = replaceSignAreasInNode(schema, child)
    if (replaced !== child) changed = true
    children.push(replaced)
  })

  if (!changed) return node
  return node.type.create(node.attrs, Fragment.fromArray(children), node.marks)
}

export function buildMarkdownParser(schema) {
  const md = buildMarkdownIt()

  // Start from prosemirror-markdown defaults; extend for lists/hard_break/etc.
  const parser = new MarkdownParser(schema, md, {
    blockquote: { block: 'blockquote' },
    paragraph:  { block: 'paragraph' },
    list_item:  { block: 'list_item' },
    bullet_list:{ block: 'bullet_list' },
    ordered_list:{ block: 'ordered_list', getAttrs: tok => ({ order: +tok.attrGet('start') || 1 }) },
    heading:    { block: 'heading', getAttrs: tok => ({ level: +tok.tag.slice(1) }) },
    code_block: { block: 'code_block' },
    fence:      { block: 'code_block', getAttrs: tok => ({ params: tok.info || '' }) },
    hr:         { node: 'horizontal_rule' },
    hardbreak:  { node: 'hard_break' },
    em:         { mark: 'em' },
    strong:     { mark: 'strong' },
    code_inline:{ mark: 'code' },
    link:       { mark: 'link', getAttrs: tok => ({ href: tok.attrGet('href'), title: tok.attrGet('title') }) },
  })

  return {
    md,
    parse(markdown) {
      const doc = parser.parse(markdown || '')
      const withShortcodes = replaceShortcodesInNode(schema, doc)
      return replaceSignAreasInNode(schema, withShortcodes)
    },
  }
}

export function buildMarkdownSerializer(schema) {
  const nodes = {
    ...defaultMarkdownSerializer.nodes,
    shortcode(state, node) {
      state.text(`{{${node.attrs.key}}}`, false)
    },
    sign_area(state, node) {
      const label = node.attrs.label ? `|${node.attrs.label}` : ''
      state.write(`[[sign:${node.attrs.id}${label}]]`)
      state.closeBlock(node)
    },
  }

  // Keep default marks (strong/em/code/link)
  const marks = { ...defaultMarkdownSerializer.marks }

  return new MarkdownSerializer(nodes, marks)
}


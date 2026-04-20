import { Plugin } from 'prosemirror-state'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap, toggleMark, setBlockType, wrapIn, lift } from 'prosemirror-commands'
import { inputRules, textblockTypeInputRule, wrappingInputRule, InputRule } from 'prosemirror-inputrules'
import { liftListItem, sinkListItem, splitListItem, wrapInList } from 'prosemirror-schema-list'
import { keybindsStore } from '../stores/keybindsStore.js'

export function buildInputRules(schema) {
  const rules = []

  // Headings: "# " .. "###### "
  rules.push(textblockTypeInputRule(new RegExp('^(#{1,6})\\s$'), schema.nodes.heading, m => ({ level: m[1].length })))

  // Blockquote: "> "
  rules.push(wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote))

  // Lists: "- " or "* "
  rules.push(wrappingInputRule(/^\s*([-*])\s$/, schema.nodes.bullet_list))

  // Ordered list: "1. "
  rules.push(wrappingInputRule(/^\s*(\d+)\.\s$/, schema.nodes.ordered_list, m => ({ order: +m[1] || 1 })))

  // Shortcode token: "{{key}}" -> shortcode atom
  rules.push(
    new InputRule(/\{\{([a-z0-9_]+)\}\}$/, (state, match, start, end) => {
      const key = String(match[1] || '').toLowerCase()
      const node = schema.nodes.shortcode.create({ key })
      return state.tr.replaceWith(start, end, node)
    })
  )

  return inputRules({ rules })
}

function buildFormatKeymap(schema) {
  const COMMANDS = {
    bold:       toggleMark(schema.marks.strong),
    italic:     toggleMark(schema.marks.em),
    inlineCode: toggleMark(schema.marks.code),
    paragraph:  setBlockType(schema.nodes.paragraph),
    heading1:   setBlockType(schema.nodes.heading, { level: 1 }),
    heading2:   setBlockType(schema.nodes.heading, { level: 2 }),
    heading3:   setBlockType(schema.nodes.heading, { level: 3 }),
    heading4:   setBlockType(schema.nodes.heading, { level: 4 }),
    heading5:   setBlockType(schema.nodes.heading, { level: 5 }),
    heading6:   setBlockType(schema.nodes.heading, { level: 6 }),
    blockquote: wrapIn(schema.nodes.blockquote),
    bulletList: wrapInList(schema.nodes.bullet_list),
    orderedList: wrapInList(schema.nodes.ordered_list),
  }

  return new Plugin({
    props: {
      handleKeyDown(view, event) {
        const action = keybindsStore.matchEditorEvent(event)
        if (action && COMMANDS[action]) {
          const applied = COMMANDS[action](view.state, view.dispatch)
          if (applied) { event.preventDefault(); return true }
        }
        return false
      },
    },
  })
}

export function buildPlugins(schema) {
  return [
    history(),
    buildInputRules(schema),
    buildFormatKeymap(schema),
    keymap({
      'Tab':       sinkListItem(schema.nodes.list_item),
      'Shift-Tab': liftListItem(schema.nodes.list_item),
      'Enter':     splitListItem(schema.nodes.list_item),
      'Mod-]':     sinkListItem(schema.nodes.list_item),
      'Mod-[':     liftListItem(schema.nodes.list_item),
      'Mod-\\':    lift,
    }),
    keymap(baseKeymap),
  ]
}

---
name: Document Writer v2 Architecture
description: Full feature set, stack, and file structure of the Document Writer Electron app after v2 rebuild
type: project
---

Complete rewrite completed April 2026. Stack: Electron + Vue 3 + Vite + TipTap v2 + FontAwesome 6.

**Key features implemented:**
- Light / Dark / System theme via CSS custom properties (`data-theme` on `.app`), `src/stores/themeStore.js`
- VS Code-style tabbed editor layout — `src/components/TabBar.vue`
- TipTap WYSIWYG with all markdown: bold/italic/underline/strike/sub/super, headings 1-6, bullet/ordered/task lists, table, code block, blockquote, link, image, HR, text align, text colour, highlight — `src/components/EditorPane.vue`
- Word-style toolbar with grouped icon buttons — `src/components/EditorToolbar.vue`
- Built-in shortcodes: `{date}`, `{time}`, `{datetime}`, `{year}`, `{month}`, `{month_num}`, `{day}`, `{day_name}`, `{timestamp}` — `src/utils/builtinShortcodes.js`
- Custom shortcodes stored in localStorage — `src/stores/shortcodeStore.js`
- Shortcodes render as their resolved value with a dotted underline; hover or cursor-on shows `{key}` tooltip — `src/components/ShortcodeNodeView.vue`, `src/extensions/ShortcodeExtension.js`
- Collapsible right panel shows used custom shortcodes as editable accordion tabs, plus manage/add custom shortcodes — `src/components/ShortcodePanel.vue`
- PDF export + Signable PDF export (adds signature block) — `electron/main.js` `export-pdf` IPC handler, `signable: true` flag
- Documents and shortcodes persisted in localStorage

**How:** No external state library. Module-level reactive stores (Vue `reactive`/`ref`). TipTap node views use `VueNodeViewRenderer`. Shortcode HTML is resolved at export time by querying `span[data-type="shortcode"]` elements.

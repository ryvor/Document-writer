import MarkdownIt from 'markdown-it'
import yaml from 'js-yaml'
import { resolveShortcodeValue } from './resolveShortcode.js'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
})

const SC_RE = /\{\{([a-z0-9_]+)\}\}/gi

function resolveInText(text, vars) {
  return text.replace(SC_RE, (_m, key) => resolveShortcodeValue(String(key || '').toLowerCase(), vars))
}

function resolveShortcodesInTokens(tokens, vars) {
  for (const token of tokens) {
    if (token.type === 'inline' && Array.isArray(token.children)) {
      for (const child of token.children) {
        if (child.type === 'text' && typeof child.content === 'string') {
          child.content = resolveInText(child.content, vars)
        }
      }
    }
  }
}

export function buildExportHtmlFromMarkdown(markdown, shortcodeVars, pageSizeId) {
  const env = {}
  const tokens = md.parse(markdown || '', env)
  resolveShortcodesInTokens(tokens, shortcodeVars || {})
  // Page sizing is controlled in Electron export HTML/CSS. We pass content only.
  // (pageSizeId kept for future: can be used to set @page size/margins).
  void pageSizeId
  return md.renderer.render(tokens, md.options, env)
}

export function buildMarkdownWithFrontmatter(doc) {
  const front = {
    title: doc.title || 'Untitled',
    shortcode_vars: doc.shortcodeVars || {},
    esign: doc.esign || {},
  }
  const fm = yaml.dump(front, { lineWidth: 120, noRefs: true }).trimEnd()
  const body = String(doc.markdown || '').trimEnd()
  return `---\n${fm}\n---\n\n${body}\n`
}


export const BUILTIN_DEFINITIONS = [
  { key: 'date',       description: 'Current date (YYYY-MM-DD)' },
  { key: 'time',       description: 'Current time (HH:MM)' },
  { key: 'datetime',   description: 'Current date and time' },
  { key: 'year',       description: 'Current year (4 digits)' },
  { key: 'month',      description: 'Current month name' },
  { key: 'month_num',  description: 'Current month number (01–12)' },
  { key: 'day',        description: 'Current day of month (01–31)' },
  { key: 'day_name',   description: 'Current day of week' },
  { key: 'timestamp',  description: 'Unix timestamp (seconds)' },
]

export const BUILTIN_KEYS = new Set(BUILTIN_DEFINITIONS.map(d => d.key))

const pad = n => String(n).padStart(2, '0')

export function resolveBuiltin(key) {
  const now = new Date()
  switch (key) {
    case 'date':      return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
    case 'time':      return `${pad(now.getHours())}:${pad(now.getMinutes())}`
    case 'datetime':  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    case 'year':      return String(now.getFullYear())
    case 'month':     return now.toLocaleString('default', { month: 'long' })
    case 'month_num': return pad(now.getMonth() + 1)
    case 'day':       return pad(now.getDate())
    case 'day_name':  return now.toLocaleString('default', { weekday: 'long' })
    case 'timestamp': return String(Math.floor(now.getTime() / 1000))
    default:          return null
  }
}

export function buildExportHtml(content, shortcodes) {
  const div = document.createElement('div')
  div.innerHTML = content
  div.querySelectorAll('span[data-type="shortcode"]').forEach(node => {
    const key = node.getAttribute('data-shortcode-key')
    let value = resolveBuiltin(key)
    if (value === null) {
      const custom = shortcodes.find(s => s.key === key)
      value = custom ? custom.value : `{${key}}`
    }
    node.replaceWith(document.createTextNode(value))
  })
  return div.innerHTML
}

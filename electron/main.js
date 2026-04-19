const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs   = require('fs/promises')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width:  1380,
    height: 900,
    minWidth:  800,
    minHeight: 600,
    frame: true,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── Shared PDF renderer ──────────────────────────────────
function buildPageHtml(title, htmlContent, signable) {
  const signBlock = signable ? `
    <div class="signature-section">
      <h3>Signatures</h3>
      <p class="sign-note">This document requires signature(s) before it is considered binding.</p>
      <table class="sign-table">
        <tr>
          <td><div class="sign-label">Full Name</div><div class="sign-line"></div></td>
          <td><div class="sign-label">Title / Role</div><div class="sign-line"></div></td>
        </tr>
        <tr>
          <td><div class="sign-label">Signature</div><div class="sign-line signature-area"></div></td>
          <td><div class="sign-label">Date</div><div class="sign-line"></div></td>
        </tr>
      </table>
    </div>` : ''

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 20mm 18mm; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      margin: 0;
    }
    h1 { font-size: 2em; margin: 0.8em 0 0.3em; }
    h2 { font-size: 1.5em; margin: 0.7em 0 0.25em; }
    h3 { font-size: 1.2em; margin: 0.6em 0 0.2em; }
    h4, h5, h6 { font-size: 1em; font-weight: bold; margin: 0.5em 0 0.2em; }
    p  { margin: 0.4em 0; }
    ul, ol { padding-left: 1.5em; margin: 0.4em 0; }
    li { margin: 0.15em 0; }
    code {
      font-family: 'Courier New', monospace;
      font-size: 0.85em;
      background: #f0f0f0;
      padding: 0.1em 0.35em;
      border-radius: 3px;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px 16px;
      overflow-x: auto;
      font-size: 0.85em;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 3px solid #0078d4;
      padding: 4px 0 4px 14px;
      color: #555;
      margin: 0.8em 0;
    }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #f0f0f0; font-weight: bold; }
    hr { border: none; border-top: 1px solid #ddd; margin: 1.2em 0; }
    a  { color: #0078d4; }
    mark { border-radius: 2px; padding: 0.1em 0; }
    img { max-width: 100%; border-radius: 4px; }
    /* Task list */
    ul[data-type="taskList"] { list-style: none; padding-left: 0; }
    ul[data-type="taskList"] li { display: flex; gap: 6px; }

    /* Signature block */
    .signature-section {
      margin-top: 48pt;
      padding-top: 20pt;
      border-top: 2px solid #0078d4;
      page-break-inside: avoid;
    }
    .signature-section h3 { font-size: 1em; color: #0078d4; margin-bottom: 6pt; }
    .sign-note { font-size: 0.8em; color: #666; margin-bottom: 16pt; }
    .sign-table { width: 100%; border: none; margin: 0; }
    .sign-table td { border: none; padding: 0 24pt 20pt 0; vertical-align: bottom; width: 50%; }
    .sign-label { font-size: 0.75em; color: #555; margin-bottom: 4pt; }
    .sign-line { border-bottom: 1px solid #333; height: 28pt; }
    .sign-line.signature-area { height: 48pt; }
  </style>
</head>
<body>
  ${htmlContent}
  ${signBlock}
</body>
</html>`
}

// ── IPC: export PDF (regular or signable) ───────────────
ipcMain.handle('export-pdf', async (_event, payload) => {
  const { htmlContent, title, signable = false } = payload
  const safeTitle = (title || 'document').trim()
  const suffix    = signable ? '-signable' : ''

  const { canceled, filePath } = await dialog.showSaveDialog({
    title:       signable ? 'Export Signable Copy' : 'Export as PDF',
    defaultPath: `${safeTitle}${suffix}.pdf`,
    filters:     [{ name: 'PDF', extensions: ['pdf'] }],
  })

  if (canceled || !filePath) return { canceled: true }

  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } })
  await win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(buildPageHtml(safeTitle, htmlContent, signable))}`
  )

  const buf = await win.webContents.printToPDF({
    printBackground:   true,
    pageSize:          'A4',
    marginsType:       0,
  })

  win.close()
  await fs.writeFile(filePath, buf)

  return { canceled: false, filePath }
})

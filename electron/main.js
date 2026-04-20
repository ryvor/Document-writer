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
    autoHideMenuBar: true,
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
function buildPageHtml(title, htmlContent, signable, pageSize) {
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
    @page { size: ${pageSize || 'A4'}; margin: 20mm 18mm; }
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

// ── Signable web export (self-contained HTML with click-to-sign) ──
function buildSignableWebHtml(title, htmlContent) {
  const safeTitleRaw = String(title || 'document').slice(0, 200)
  const safeTitle = safeTitleRaw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} (e-sign)</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #111;
      background: #f6f7fb;
    }
    .bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 10px 14px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .bar-title {
      font-weight: 600;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .btn {
      border: 1px solid #d1d5db;
      background: #fff;
      color: #111;
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      font-size: 13px;
    }
    .btn.primary {
      background: #2563eb;
      border-color: #2563eb;
      color: #fff;
    }
    .wrap {
      max-width: 900px;
      margin: 16px auto 28px;
      padding: 0 14px;
    }
    .page {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 22px 22px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.06);
    }
    /* Basic content styles (kept intentionally minimal) */
    h1 { font-size: 28px; margin: 0.8em 0 0.3em; }
    h2 { font-size: 22px; margin: 0.7em 0 0.25em; }
    h3 { font-size: 18px; margin: 0.6em 0 0.2em; }
    p  { margin: 0.45em 0; line-height: 1.6; }
    ul, ol { padding-left: 1.3em; margin: 0.4em 0; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #f3f4f6; padding: 0.1em 0.35em; border-radius: 4px; }
    pre { background: #f3f4f6; border-radius: 8px; padding: 12px 14px; overflow-x: auto; }
    blockquote { border-left: 3px solid #2563eb; padding: 6px 0 6px 14px; color: #444; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; vertical-align: top; }
    th { background: #f3f4f6; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.2em 0; }
    img { max-width: 100%; }

    .sign {
      margin-top: 28px;
      border-top: 2px solid #2563eb;
      padding-top: 16px;
    }
    .sign h3 { margin: 0 0 8px; font-size: 16px; color: #2563eb; }
    .note { margin: 0 0 14px; color: #555; font-size: 13px; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    label { font-size: 12px; color: #374151; display: block; margin-bottom: 4px; }
    input {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 9px 10px;
      font-size: 13px;
      outline: none;
    }
    input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
    .sig-box {
      grid-column: 1 / -1;
      border: 1px dashed #9ca3af;
      border-radius: 12px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
      min-height: 120px;
    }
    .sig-preview {
      width: 320px;
      height: 96px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .sig-preview img { max-width: 100%; max-height: 100%; }
    .sig-actions { display: flex; flex-direction: column; gap: 8px; }

    dialog {
      border: none;
      border-radius: 12px;
      padding: 0;
      width: min(760px, calc(100vw - 24px));
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
    }
    dialog::backdrop { background: rgba(0,0,0,0.45); }
    .dlg-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid #e5e7eb; background: #fff; }
    .dlg-title { font-weight: 600; }
    .dlg-body { padding: 14px; background: #fff; }
    .pad {
      width: 100%;
      height: 260px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      touch-action: none;
      display: block;
      background: #fff;
    }
    .dlg-actions { display: flex; gap: 10px; justify-content: flex-end; padding: 12px 14px; border-top: 1px solid #e5e7eb; background: #fff; }

    @media print {
      body { background: #fff; }
      .bar { display: none; }
      .wrap { max-width: none; margin: 0; padding: 0; }
      .page { border: none; border-radius: 0; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="bar">
    <div class="bar-title">${safeTitle}</div>
    <button class="btn" id="btnPrint" type="button">Print / Save PDF</button>
    <button class="btn primary" id="btnDownload" type="button">Download Signed HTML</button>
  </div>

  <div class="wrap">
    <div class="page" id="page">
      <div id="doc">
        ${htmlContent}
      </div>

      <div class="sign">
        <h3>Click to Sign</h3>
        <p class="note">Fill your details and add a signature. Then print or download the signed copy.</p>

        <div class="grid">
          <div>
            <label for="fullName">Full Name</label>
            <input id="fullName" autocomplete="name" />
          </div>
          <div>
            <label for="role">Title / Role</label>
            <input id="role" />
          </div>
          <div>
            <label for="date">Date</label>
            <input id="date" />
          </div>

          <div class="sig-box">
            <div class="sig-preview" id="sigPreview"><span style="color:#6b7280;font-size:13px;">No signature</span></div>
            <div class="sig-actions">
              <button class="btn primary" id="btnSign" type="button">Click to sign</button>
              <button class="btn" id="btnClear" type="button">Clear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <dialog id="sigDialog">
    <div class="dlg-head">
      <div class="dlg-title">Draw signature</div>
      <button class="btn" id="btnClose" type="button">Close</button>
    </div>
    <div class="dlg-body">
      <canvas class="pad" id="sigPad"></canvas>
      <div style="margin-top:10px;color:#6b7280;font-size:12px;">Tip: Use mouse, trackpad, or touch to draw.</div>
    </div>
    <div class="dlg-actions">
      <button class="btn" id="btnPadClear" type="button">Clear</button>
      <button class="btn primary" id="btnPadSave" type="button">Use Signature</button>
    </div>
  </dialog>

  <script>
    const $ = (id) => document.getElementById(id);

    function todayISO() {
      const d = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return \`\${d.getFullYear()}-\${pad(d.getMonth()+1)}-\${pad(d.getDate())}\`;
    }

    const fullName = $('fullName');
    const role = $('role');
    const date = $('date');
    date.value = todayISO();

    const sigPreview = $('sigPreview');
    const sigDialog = $('sigDialog');
    const canvas = $('sigPad');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let sigDataUrl = '';

    function resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#111';
    }

    function clearPad() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDraw(e) {
      drawing = true;
      const p = pointFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      e.preventDefault();
    }
    function moveDraw(e) {
      if (!drawing) return;
      const p = pointFromEvent(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      e.preventDefault();
    }
    function endDraw(e) {
      if (!drawing) return;
      drawing = false;
      e.preventDefault();
    }

    function setSignature(dataUrl) {
      sigDataUrl = dataUrl || '';
      sigPreview.innerHTML = sigDataUrl
        ? '<img alt=\"Signature\" src=\"' + sigDataUrl + '\" />'
        : '<span style=\"color:#6b7280;font-size:13px;\">No signature</span>';
    }

    function serializeSignedHtml() {
      const state = {
        fullName: fullName.value || '',
        role: role.value || '',
        date: date.value || '',
        sigDataUrl: sigDataUrl || '',
      };
      const docHtml = $('doc').innerHTML;

      const esc = (s) => String(s).replace(/</g, '\\u003c');
      return \`<!doctype html>\n<html>\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n<title>\${esc(${JSON.stringify(safeTitleRaw)})} (signed)</title>\n</head>\n<body>\n<div id="doc">\${docHtml}</div>\n<div id="signed" style="margin-top:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">\n  <h3 style="margin:0 0 10px;">Signature</h3>\n  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:900px;">\n    <div><div style="font-size:12px;color:#444;margin-bottom:4px;">Full Name</div><div style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;">\${esc(state.fullName)}</div></div>\n    <div><div style="font-size:12px;color:#444;margin-bottom:4px;">Title / Role</div><div style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;">\${esc(state.role)}</div></div>\n    <div><div style="font-size:12px;color:#444;margin-bottom:4px;">Date</div><div style="padding:8px 10px;border:1px solid #ddd;border-radius:8px;">\${esc(state.date)}</div></div>\n    <div style="grid-column:1/-1;">\n      <div style="font-size:12px;color:#444;margin-bottom:4px;">Signature</div>\n      <div style="padding:10px;border:1px solid #ddd;border-radius:8px;min-height:120px;display:flex;align-items:center;justify-content:flex-start;">\n        \${state.sigDataUrl ? '<img alt=\"Signature\" style=\"max-height:96px;\" src=\"' + state.sigDataUrl + '\" />' : '<span style=\"color:#666;\">(no signature)</span>'}\n      </div>\n    </div>\n  </div>\n</div>\n<script>/* state: \${esc(JSON.stringify(state))} */<\\/script>\n</body>\n</html>\`;
    }

    function download(filename, text) {
      const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }

    $('btnPrint').addEventListener('click', () => window.print());
    $('btnDownload').addEventListener('click', () => {
      const out = serializeSignedHtml();
      const base = ${JSON.stringify(safeTitleRaw)}.replace(/[^a-z0-9_-]+/ig, '-').replace(/-+/g, '-').replace(/(^-|-$)/g, '') || 'document';
      download(base + '-signed.html', out);
    });

    $('btnSign').addEventListener('click', () => {
      sigDialog.showModal();
      requestAnimationFrame(() => { resizeCanvas(); clearPad(); });
    });
    $('btnClose').addEventListener('click', () => sigDialog.close());
    $('btnPadClear').addEventListener('click', () => clearPad());
    $('btnPadSave').addEventListener('click', () => {
      const rect = canvas.getBoundingClientRect();
      const temp = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      temp.width = Math.floor(rect.width * dpr);
      temp.height = Math.floor(rect.height * dpr);
      const tctx = temp.getContext('2d');
      tctx.drawImage(canvas, 0, 0, temp.width, temp.height);
      setSignature(temp.toDataURL('image/png'));
      sigDialog.close();
    });

    $('btnClear').addEventListener('click', () => setSignature(''));

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    window.addEventListener('touchend', endDraw, { passive: false });
    window.addEventListener('resize', () => { if (sigDialog.open) resizeCanvas(); });
  </script>
</body>
</html>`
}

// ── IPC: export PDF (regular or signable) ───────────────
ipcMain.handle('export-pdf', async (_event, payload) => {
  const { htmlContent, title, signable = false, pageSize = 'A4' } = payload
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
    `data:text/html;charset=utf-8,${encodeURIComponent(buildPageHtml(safeTitle, htmlContent, signable, pageSize))}`
  )

  const buf = await win.webContents.printToPDF({
    printBackground:   true,
    pageSize:          pageSize || 'A4',
    marginsType:       0,
  })

  win.close()
  await fs.writeFile(filePath, buf)

  return { canceled: false, filePath }
})

// ── IPC: export signable HTML (click-to-sign) ───────────
ipcMain.handle('export-signable-html', async (_event, payload) => {
  const { htmlContent, title } = payload
  const safeTitle = (title || 'document').trim()

  const { canceled, filePath } = await dialog.showSaveDialog({
    title:       'Export Signable (E-sign) HTML',
    defaultPath: `${safeTitle}-esign.dw-signable.html`,
    filters:     [{ name: 'HTML', extensions: ['html'] }],
  })

  if (canceled || !filePath) return { canceled: true }

  const html = buildSignableWebHtml(safeTitle, htmlContent)
  await fs.writeFile(filePath, html, 'utf8')

  return { canceled: false, filePath }
})

// ── IPC: export signable document (.dwdoc) ──────────────
ipcMain.handle('export-dwdoc', async (_event, payload) => {
  const { doc } = payload
  const safeTitle = ((doc?.title) || 'document').trim()

  const { canceled, filePath } = await dialog.showSaveDialog({
    title:       'Export Signable Document',
    defaultPath: `${safeTitle}.dwdoc`,
    filters:     [{ name: 'Document Writer Signable', extensions: ['dwdoc'] }],
  })

  if (canceled || !filePath) return { canceled: true }

  const json = JSON.stringify({
    format:     'document-writer',
    type:       'dwdoc',
    version:    1,
    exportedAt: new Date().toISOString(),
    doc,
  }, null, 2)

  await fs.writeFile(filePath, json, 'utf8')
  return { canceled: false, filePath }
})

// ── IPC: open signable document (.dwdoc) ────────────────
ipcMain.handle('open-dwdoc', async (_event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title:       'Open Signable Document',
    filters:     [{ name: 'Document Writer Signable', extensions: ['dwdoc'] }],
    properties:  ['openFile'],
  })

  if (canceled || !filePaths?.length) return { canceled: true }

  const raw  = await fs.readFile(filePaths[0], 'utf8')
  const data = JSON.parse(raw)
  return { canceled: false, data }
})

// ── IPC: export markdown (with frontmatter) ─────────────
ipcMain.handle('export-markdown', async (_event, payload) => {
  const { markdown, title } = payload
  const safeTitle = (title || 'document').trim()

  const { canceled, filePath } = await dialog.showSaveDialog({
    title:       'Export Markdown',
    defaultPath: `${safeTitle}.md`,
    filters:     [{ name: 'Markdown', extensions: ['md'] }],
  })

  if (canceled || !filePath) return { canceled: true }

  await fs.writeFile(filePath, String(markdown || ''), 'utf8')
  return { canceled: false, filePath }
})

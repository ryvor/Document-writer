const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('export-pdf', async (_event, payload) => {
  const { htmlContent, title } = payload;
  const safeTitle = title && title.trim() ? title.trim() : 'document';

  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Export document as PDF',
    defaultPath: `${safeTitle}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  const previewWin = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true }
  });

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.5; }
        h1,h2,h3 { margin-top: 1.2em; }
        p { margin: 0.6em 0; }
      </style>
    </head>
    <body>${htmlContent}</body>
  </html>`;

  await previewWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  const pdfBuffer = await previewWin.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4'
  });

  await require('fs/promises').writeFile(filePath, pdfBuffer);
  previewWin.close();

  return { canceled: false, filePath };
});

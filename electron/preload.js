const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  exportPDF:          payload => ipcRenderer.invoke('export-pdf', payload),
  exportSignableHtml: payload => ipcRenderer.invoke('export-signable-html', payload),
  exportMarkdown:     payload => ipcRenderer.invoke('export-markdown', payload),
  exportDwdoc:        payload => ipcRenderer.invoke('export-dwdoc', payload),
  openDwdoc:          ()      => ipcRenderer.invoke('open-dwdoc'),
})

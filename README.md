# Document Writer

Electron + Vue 3 desktop application for writing documents in a tabbed WYSIWYG editor and exporting to PDF.

## Features

- WYSIWYG editing (`contenteditable`) with quick formatting controls (bold, italic, underline, bullet list)
- Multiple open documents via tabs
- Token shortcuts like `[curr_date]` that are replaced with the current date (`YYYY-MM-DD`) during export
- Save/export active tab as a PDF file
- Packaging support for Windows, macOS, and Linux via `electron-builder`

## Requirements

- Node.js 20+
- npm 10+

## Run in development

```bash
npm install
npm run dev
```

This starts Vite for the renderer and launches Electron after the dev server is ready.

## Build renderer

```bash
npm run build
```

## Package installers

```bash
npm run dist
```

Electron Builder targets configured:

- **Windows**: NSIS installer
- **macOS**: DMG
- **Linux**: AppImage

## Project structure

- `electron/main.js` - Electron main process and PDF export IPC handler
- `electron/preload.js` - secure preload bridge for renderer-to-main IPC
- `src/App.vue` - tab management, editor UI, token replacement, export trigger
- `src/styles.css` - application styling

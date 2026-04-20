## Document Writer — “Signable Area” + Internal Signable Export (`.dwdoc`)

### Summary
Add a new **Insert → Signable area** block that can be placed in the document, clicked to sign, and rendered as:
- **Unsigned:** “Click here to sign”
- **Signed:** a **stamp** showing **name + signed date**
Support exporting/importing **internal signable documents** as a versioned JSON file (`.dwdoc`). When opened, these docs are **locked (sign-only mode)**.

---

### Key Implementation Changes

#### 1) ProseMirror: new block node + Markdown token
- Add a new schema node `sign_area` (block, atom, selectable) with attrs:
  - `id` (unique, required)
  - `label` (optional; shown above/inside the stamp)
- Represent it in markdown as a single-line token (serializer + parser post-pass):
  - `[[sign:<id>|<label>]]` (label optional)
- Parsing:
  - After Markdown parsing, replace any **paragraph whose full text matches** the token with a `sign_area` block node.
- Serialization:
  - Output the token on its own line so it round-trips cleanly.

Files:
- `src/editor/pmSchema.js` (add `sign_area`)
- `src/editor/pmMarkdown.js` (parse/serialize token + paragraph replacement)

#### 2) Signing state stored per-document (not inside markdown)
- Extend each document in `documentStore` with:
  - `signAreas: { [id]: { name: string, signedAt: string /* ISO */ } }`
  - `signModeLocked: boolean` (true for `.dwdoc` opened docs)
- Add store helpers:
  - `setSignArea(docId, id, { name, signedAt })`
  - `clearSignArea(docId, id)`
  - `setSignModeLocked(docId, locked)`
  - Optional cleanup: prune `signAreas` entries no longer present in the doc.

Files:
- `src/stores/documentStore.js`

#### 3) Editor rendering + click-to-sign UX
- Implement a `SignAreaNodeView` similar to `ShortcodeNodeView`:
  - Renders unsigned vs signed stamp
  - Click opens a signing modal (unless already open)
  - Uses `documentStore.signAreas` to decide what to display
- Sync behavior:
  - Add `syncSignAreaNodeViews(view)` registry + trigger on:
    - selection/transactions (like shortcodes)
    - signAreas changes (watch doc’s `signAreas` JSON and dispatch a meta transaction to resync)

Files:
- `src/editor/pmSignAreaNodeView.js` (new)
- `src/components/MarkdownEditor.vue` (register nodeView + sync triggers)

#### 4) Signing modal (stamp: name + date)
- Add `ModalSignArea.vue`:
  - Shows label + preview
  - Name input (default: document `esign.signerName`)
  - Date is “now” (display + stored as ISO)
  - Actions: **Sign**, **Clear signature**, **Cancel**

Files:
- `src/components/ModalSignArea.vue` (new)
- `src/App.vue` (host modal state + pass active doc/id)

#### 5) Insert UI: “Signable area” in Input tab
- Add a new button under the **Input** ribbon:
  - “Signable area”
- Inserts a `sign_area` node at selection (like HR insertion), generating a stable id.

Files:
- `src/components/FormatBar.vue`

#### 6) Locked “sign-only mode” for opened `.dwdoc`
- When `signModeLocked` is true:
  - Make ProseMirror non-editable (`editable: () => false`)
  - Keep sign areas clickable (NodeView handles click)
  - Hide editing chrome that’s not useful for signing:
    - hide `FormatBar` and `SideDock`
    - keep `FooterBar` (zoom/page size) and `TabBar`

Files:
- `src/components/MarkdownEditor.vue` (editable toggle)
- `src/App.vue` (conditional chrome visibility)

#### 7) Internal signable export/import (`.dwdoc`) via Electron
- Add new Electron IPC:
  - `export-dwdoc` → save JSON to `.dwdoc`
  - `open-dwdoc` → open file dialog, read JSON, return parsed payload
- `.dwdoc` v1 JSON shape (decision-complete):
  ```json
  {
    "format": "document-writer",
    "type": "dwdoc",
    "version": 1,
    "exportedAt": "ISO",
    "doc": {
      "title": "string",
      "markdown": "string",
      "metadata": { "...": "..." },
      "shortcodeVars": { "k": "v" },
      "esign": { "...": "..." },
      "signAreas": { "areaId": { "name": "string", "signedAt": "ISO" } }
    }
  }
  ```
- UI entry points:
  - Export dropdown: add “Signable document (.dwdoc)”
  - Dashboard: add “Open signable (.dwdoc)” button (Electron-only; otherwise show a friendly alert)
- On open:
  - Create a new doc in `documentStore` from payload
  - Set `signModeLocked: true`
  - Open it as the active tab

Files:
- `electron/main.js` (new IPC handlers)
- `electron/preload.js` (expose `exportDwdoc`, `openDwdoc`)
- `src/App.vue` (wire export + open)
- `src/components/HomeView.vue` (open button)

---

### Public Interfaces / API Changes
- New Electron preload APIs:
  - `window.electronAPI.exportDwdoc(payload)`
  - `window.electronAPI.openDwdoc()`
- New document fields persisted in localStorage:
  - `signAreas`
  - `signModeLocked`
- New internal file format: `.dwdoc` (JSON, versioned)

---

### Test Plan (Manual)
- Insert:
  - Input → “Signable area” inserts a block; markdown contains `[[sign:...]]` line; reload preserves it.
- Unsigned UI:
  - Shows “Click here to sign”; hover/selection states look correct.
- Sign:
  - Click → modal opens; default name prefilled from ESign signer name; “Sign” stamps name + date immediately.
- Clear:
  - “Clear signature” returns to unsigned hint.
- Locked mode:
  - Export `.dwdoc`, then open it from dashboard; editor is not editable but signable areas still sign/clear.
- Export/import integrity:
  - Multiple sign areas persist; signed states persist; unknown signAreas entries in file are ignored safely.
- Regression:
  - Shortcodes still resolve; PDF/markdown export still works (sign tokens render as tokens unless later enhanced).

---

### Assumptions (Locked)
- Signable area is a **block** element and is inserted/represented via the markdown token `[[sign:<id>|<label>]]`.
- Stamp is **text-only** (name + signed date), no drawn signature.
- Opening `.dwdoc` puts the doc in **locked (sign-only)** mode.
- Default signer name comes from the document’s existing **ESign panel** (`esign.signerName`).

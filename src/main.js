import { createApp } from 'vue'
import { library }   from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  // Text formatting
  faBold, faItalic, faUnderline, faStrikethrough, faSubscript, faSuperscript,
  // Alignment
  faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify,
  // Lists
  faListUl, faListOl, faSquareCheck,
  // Insert
  faLink, faImage, faTable, faCode, faQuoteLeft, faMinus,
  // Color
  faFont, faHighlighter,
  // Export
  faFilePdf, faFileSignature, faFileCode,
  // Shortcodes
  faTag,
  // Undo/Redo
  faRotateLeft, faRotateRight,
  // UI / Navigation
  faPlus, faXmark, faChevronRight, faChevronLeft, faChevronDown, faChevronUp,
  faHouse, faBars, faEllipsisVertical,
  // Theme
  faMoon, faSun, faDesktop,
  // Sidebar / panel
  faGripVertical, faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
  faArrowsLeftRight, faArrowsUpDown,
  // Shortcode panel
  faTrash, faPen,
  // Zoom
  faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus,
  faExpand, faCompress,
  // Metadata / E-Sign
  faCircleInfo, faSignature, faCheck,
  faTriangleExclamation,
  // File menu
  faFloppyDisk, faFolderOpen, faFile, faPrint, faFileExport,
  faFileArrowDown,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faBold, faItalic, faUnderline, faStrikethrough, faSubscript, faSuperscript,
  faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify,
  faListUl, faListOl, faSquareCheck,
  faLink, faImage, faTable, faCode, faQuoteLeft, faMinus,
  faFont, faHighlighter,
  faFilePdf, faFileSignature, faFileCode,
  faTag,
  faRotateLeft, faRotateRight,
  faPlus, faXmark, faChevronRight, faChevronLeft, faChevronDown, faChevronUp,
  faHouse, faBars, faEllipsisVertical,
  faMoon, faSun, faDesktop,
  faGripVertical, faArrowUp, faArrowDown, faArrowLeft, faArrowRight,
  faArrowsLeftRight, faArrowsUpDown,
  faTrash, faPen,
  faMagnifyingGlass, faMagnifyingGlassPlus, faMagnifyingGlassMinus,
  faExpand, faCompress,
  faCircleInfo, faSignature, faCheck,
  faTriangleExclamation,
  faFloppyDisk, faFolderOpen, faFile, faPrint, faFileExport,
  faFileArrowDown,
)

import App from './App.vue'
import './styles/main.css'
import './styles/editor.css'

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.mount('#app')

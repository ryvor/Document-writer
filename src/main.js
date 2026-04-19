import { createApp } from 'vue'
import { library }   from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import {
  faBold, faItalic, faUnderline, faStrikethrough,
  faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify,
  faListUl, faListOl, faLink, faImage, faTable, faCode,
  faQuoteLeft, faMinus, faFont, faHighlighter,
  faFilePdf, faFileSignature, faTag,
  faPlus, faXmark, faChevronRight, faChevronDown,
  faMoon, faSun, faDesktop, faTrash,
  faRotateLeft, faRotateRight, faSubscript, faSuperscript,
  faSquareCheck,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faBold, faItalic, faUnderline, faStrikethrough,
  faAlignLeft, faAlignCenter, faAlignRight, faAlignJustify,
  faListUl, faListOl, faLink, faImage, faTable, faCode,
  faQuoteLeft, faMinus, faFont, faHighlighter,
  faFilePdf, faFileSignature, faTag,
  faPlus, faXmark, faChevronRight, faChevronDown,
  faMoon, faSun, faDesktop, faTrash,
  faRotateLeft, faRotateRight, faSubscript, faSuperscript,
  faSquareCheck,
)

import App from './App.vue'
import './styles/main.css'
import './styles/editor.css'

const app = createApp(App)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.mount('#app')

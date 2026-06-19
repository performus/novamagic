import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import 'lenis/dist/lenis.css'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/reset.css'
import './styles/globals.css'

import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { AuthProvider } from './context/AuthContext'
import { AppRouter } from './routes'
import { applyRandomBackground } from './lib/background'
import { installLiquidLens } from './lib/liquidLens'
import './styles/global.css'

// Liquid Glass boot sequence — must run before React render
applyRandomBackground()
installLiquidLens()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
)

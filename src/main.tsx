import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapOffline } from './lib/offlineBootstrap'

// Kick off offline-first wiring (persistent storage + eTIMS sync triggers).
bootstrapOffline()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

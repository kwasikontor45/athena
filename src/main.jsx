import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './index.css'
import App from './App.jsx'

navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

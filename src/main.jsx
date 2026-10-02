import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { migrateLegacyTrades } from './utils/tradeStore'
import { getAllStoredTrades } from './utils/storage'

// One-time move of trades from the old per-day keys into the single trade store.
migrateLegacyTrades(getAllStoredTrades)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

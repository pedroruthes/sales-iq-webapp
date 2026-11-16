import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { installAxiosDefaults } from '@/api/client'
import './index.css'
import App from './App'

installAxiosDefaults()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

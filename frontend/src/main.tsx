import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'

// Configure Axios baseURL for Production Deployment (Vercel -> Render backend)
const apiBase = import.meta.env.VITE_API_URL;
if (apiBase) {
  // Clean trailing slashes or duplicate /api segments so '/api/...' calls route cleanly
  const cleanBase = apiBase.replace(/\/+$/, '').replace(/\/api$/, '');
  axios.defaults.baseURL = cleanBase;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

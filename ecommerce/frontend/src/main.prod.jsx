import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Set API URL for production
if (process.env.NODE_ENV === 'production') {
  window.API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://ecommerce-backend.onrender.com'
} else {
  window.API_BASE_URL = 'http://localhost:5000'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
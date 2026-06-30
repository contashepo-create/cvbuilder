import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './i18n/index.js'
import './index.css'

// Detect GitHub Pages subpath basename
const basename = window.location.hostname.includes('github.io')
  ? '/' + window.location.pathname.split('/')[1] + '/'
  : '/'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

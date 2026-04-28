import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main className="w-full h-full dark text-foreground bg-background">
      <App />
    </main>
  </React.StrictMode>,
)

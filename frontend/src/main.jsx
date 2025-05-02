import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent text selection globally
document.addEventListener('selectstart', (e) => {
  // Allow selection on inputs and textareas
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.classList.contains('selectable-text')) {
    return true;
  }
  // Prevent selection on all other elements
  e.preventDefault();
  return false;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

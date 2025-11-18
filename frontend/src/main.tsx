import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useThemeStore } from './store/themeStore'

// Initialize theme on app load - set immediately to prevent flash
const initializeTheme = () => {
  // Set background immediately before React renders
  const html = document.documentElement;
  const body = document.body;
  const root = document.getElementById('root');
  
  // Set dark background immediately
  html.style.background = '#030712';
  body.style.background = '#030712';
  if (root) {
    root.style.background = '#030712';
  }
  
  const theme = useThemeStore.getState().theme;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.style.background = '#030712';
    body.style.background = '#030712';
  } else {
    html.classList.remove('dark');
    html.style.background = '#000000';
    body.style.background = '#000000';
  }
};

// Run immediately, before React renders
initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


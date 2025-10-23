import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Hide splash screen when React app is ready
declare global {
  interface Window {
    Capacitor?: any;
  }
}

if (typeof window !== 'undefined' && window.Capacitor) {
  import('@capacitor/splash-screen').then(({ SplashScreen }) => {
    SplashScreen.hide();
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

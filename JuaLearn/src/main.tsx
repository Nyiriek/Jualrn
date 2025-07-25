/// <reference types="vite-plugin-pwa/client" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New content available, please refresh.");
  },
  onOfflineReady() {
    console.log("App ready to work offline.");
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);


export function useOnlineStatus() {
  const [online, setOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    function goOnline() {
      setOnline(true);
    }
    function goOffline() {
      setOnline(false);
    }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}

// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { MessageNotificationProvider } from './context/MessageNotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScrollToTop } from './components/common/ScrollToTop';
import '@fontsource-variable/inter';
import '@fontsource-variable/noto-sans-khmer';
import './i18n';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <AlertProvider>
            <MessageNotificationProvider>
              <App />
            </MessageNotificationProvider>
          </AlertProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
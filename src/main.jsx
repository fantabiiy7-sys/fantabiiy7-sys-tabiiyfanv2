import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { I18nProvider } from './context/I18nContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <AuthProvider>
              <SettingsProvider>
                <App />
              </SettingsProvider>
            </AuthProvider>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

// Muvaffaqiyatli yuklangach, avtomatik qayta yuklash belgisini tozalash
try { sessionStorage.removeItem('tf-reloaded'); } catch {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PortalErrorBoundary } from './components/common/PortalErrorBoundary';

// Global error and rejection handlers to prevent crashes and clean up telemetry
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('Window error intercepted:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    if (event.preventDefault) {
      event.preventDefault();
    }
    console.warn('Unhandled promise rejection gracefully handled:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <PortalErrorBoundary>
    <App />
  </PortalErrorBoundary>
);

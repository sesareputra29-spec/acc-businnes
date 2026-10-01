import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PortalErrorBoundary } from './components/common/PortalErrorBoundary';

// Global uncaught error handler to prevent silent blank screens on mobile
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global window error caught:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Global unhandled rejection caught:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <PortalErrorBoundary>
    <App />
  </PortalErrorBoundary>
);

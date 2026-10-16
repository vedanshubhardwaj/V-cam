// Intercept benign Emscripten/TFLite C++ informational logs routed to console.error
const originalConsoleError = console.error;
console.error = function (...args: any[]) {
  const msg = args
    .map((a) => (typeof a === 'string' ? a : (a && a.message) || ''))
    .join(' ');
  if (
    msg.includes('INFO: Created TensorFlow Lite XNNPACK delegate') ||
    msg.includes('Created TensorFlow Lite XNNPACK delegate') ||
    msg.includes('INFO: Initialized TensorFlow Lite') ||
    msg.includes('XNNPACK delegate for CPU') ||
    msg.startsWith('INFO:')
  ) {
    console.info(...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

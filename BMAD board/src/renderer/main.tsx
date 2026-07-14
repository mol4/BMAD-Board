// Polyfill Buffer for renderer process (required by gray-matter's internal YAML engine)
import { Buffer } from 'buffer';
(globalThis as any).Buffer = Buffer;

// Font imports — must be before index.css
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Providers from '@/components/Providers';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <App />
    </Providers>
  </React.StrictMode>,
);

import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/great-vibes/latin-400.css';
import '@fontsource/noto-serif-sinhala/sinhala-400.css';
import App from './App';
import './styles.css';
import './localization.css';
import './hearts.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);

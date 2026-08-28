import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import './experience.css';
import './flow.css';
import './averis.css';
import './mature.css';
import './final-polish.css';
import './ux-refresh.css';
import { initLanguage } from './i18n';
import { ProductProvider } from './product-state';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProductProvider><App /></ProductProvider>
    </BrowserRouter>
  </React.StrictMode>,
);

initLanguage();

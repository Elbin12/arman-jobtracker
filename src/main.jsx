import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Set favicon dynamically from env
const faviconLink = document.getElementById('favicon-link');
if (faviconLink) {
  faviconLink.href = import.meta.env.VITE_COMPANY_LOGO_URL || 'https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg';
}

const root = createRoot(document.getElementById("root"));
root.render(
    <App />
);

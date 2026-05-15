import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Global error handler for debugging
window.onerror = function (msg, url, line, col, error) {
  const div = document.createElement('div');
  div.style.position = 'fixed';
  div.style.top = '0';
  div.style.left = '0';
  div.style.width = '100%';
  div.style.height = '100%';
  div.style.backgroundColor = 'white';
  div.style.color = 'red';
  div.style.padding = '20px';
  div.style.zIndex = '99999';
  div.style.overflow = 'auto';
  div.innerHTML = '<h1>Runtime Error:</h1><pre>' + msg + '\n' + url + ':' + line + ':' + col + '\n' + (error ? error.stack : '') + '</pre>';
  document.body.appendChild(div);
  return false;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);

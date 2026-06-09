import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const routerBase = import.meta.env.BASE_URL || '/';

if (routerBase !== '/') {
  const normalizedBase = routerBase.endsWith('/') ? routerBase.slice(0, -1) : routerBase;
  const { pathname, search, hash } = window.location;

  if (pathname !== routerBase && !pathname.startsWith(normalizedBase + '/')) {
    const nextPath = pathname === '/' ? routerBase : `${normalizedBase}${pathname}`;
    window.history.replaceState({}, '', `${nextPath}${search}${hash}`);
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
// Vendored, same-origin styles (previously loaded from cdn.jsdelivr.net /
// fonts.googleapis.com). Bootstrap first so app CSS can override it.
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/fonts.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './index.css';
import './styles/visualization.css';
import './styles/custom-components.css';

// Lazy load the main App component
const App = React.lazy(() => import('./App'));

// Loading component for better UX
const LoadingSpinner = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
    }}
  >
    <div>Loading Wrfcoin...</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingSpinner />}>
      <App />
    </Suspense>
  </React.StrictMode>,
);

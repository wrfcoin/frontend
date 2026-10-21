import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';

/**
 * DeprecatedRedirect - wraps Navigate with telemetry for retired routes.
 *
 * Emits a custom DOM event `wrfcoin:deprecated-route` so that any analytics
 * provider (or a simple listener in devtools) can track deprecated-route hits
 * without coupling this component to a specific analytics SDK.
 *
 * @param {{ to: string }} props
 */
const DeprecatedRedirect = ({ to }) => {
  const location = useLocation();

  useEffect(() => {
    const from = location.pathname;
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DeprecatedRedirect] ${from} → ${to}`);
    }
    window.dispatchEvent(
      new CustomEvent('wrfcoin:deprecated-route', {
        detail: { from, to, timestamp: Date.now() },
      }),
    );
  }, [location.pathname, to]);

  return <Navigate to={to} replace />;
};

export default DeprecatedRedirect;

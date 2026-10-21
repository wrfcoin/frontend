import React from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

export type StoreConsistencyHealth = 'healthy' | 'degraded' | 'failed';

interface Props {
  health: StoreConsistencyHealth;
  readMode: string;
  issues: string[];
}

export function StoreConsistencyBanner({ health, readMode, issues }: Props) {
  if (health === 'healthy') return null;

  const severity = health === 'failed' ? 'error' : 'warning';
  const title = health === 'failed' ? 'Route store unavailable' : 'Route store degraded';

  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      Active read mode: <strong>{readMode}</strong>
      {issues.length > 0 && (
        <ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>
          {issues.slice(0, 3).map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

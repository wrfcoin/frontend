import React, { useState } from 'react';
import { useRoleEarnings, useRoleEarningsEnabled } from '../../hooks/useRoleEarnings';
import { EARNING_ROLES, EARNING_PERIODS, NODE_PAYMENT_NOTICE, formatRolePayment, roleDisplayName, visibleRoleAmount } from '../../utils/roleEarnings';
import { shortAddr } from '../../utils/publicAddress';
import { CONTRIBUTOR_KEY_RE } from '../../services/publicReadonlyApi';
import { isPublicTestnetPath, isFullStudioEnabled, isPublicReadonlyEnabled, isOperatorPreviewEnabled } from '../../config/contractSurfacePolicy';
import './RoleEarnings.css';

function reachable(path) {
  return isPublicTestnetPath(path, isFullStudioEnabled(import.meta.env?.VITE_ENABLE_FULL_STUDIO),
    isPublicReadonlyEnabled(import.meta.env?.VITE_PUBLIC_READONLY_PATHS), isOperatorPreviewEnabled(import.meta.env?.VITE_ENABLE_OPERATOR_PREVIEW));
}

// The richer /impact page where it is reachable, else the public opaque-key page (S6).
function profileBase() {
  if (reachable('/impact/:address')) return '/impact';
  return reachable('/contributor/:key') ? '/contributor' : null;
}

function EnabledRoleBoard() {
  const [role, setRole] = useState('producer');
  const [period, setPeriod] = useState('all');
  const { data, loading, unavailable, refetch } = useRoleEarnings(role, period, true);
  return <section aria-label="Payments by role" className="lb-role-payments">
    <h2>Payments by role</h2>
    <div className="lb-controls">
      <div className="lb-tabbar" role="tablist" aria-label="Earning role">
        {EARNING_ROLES.map(r => <button type="button" className="lb-tab" role="tab" key={r.key}
          aria-selected={role === r.key} onClick={() => setRole(r.key)}>{r.label}</button>)}
      </div>
      <div className="lb-tabbar" role="tablist" aria-label="Payment period">
        {EARNING_PERIODS.map(p => <button type="button" className="lb-tab" role="tab" key={p.key}
          aria-selected={period === p.key} onClick={() => setPeriod(p.key)}>{p.label}</button>)}
      </div>
    </div>
    {loading ? <p role="status">Loading role payments…</p> : unavailable ? <div role="alert">
      Role payments unavailable. <button type="button" onClick={() => refetch()}>Retry role payments</button>
    </div> : data?.status === 'unsupported' ? <p>{NODE_PAYMENT_NOTICE}</p> : data && <>
      <p>Confirmed canonical payments through height {data.asOf.height}; totals may change after a chain rollback.</p>
      {data.rows.length === 0 ? <p>{role === 'forecast' ? 'No forecast payments observed' : 'No payments observed for this role and period.'}</p> :
        <table className="lb-table"><thead><tr><th>Rank</th><th>Operator</th><th>WRF paid</th></tr></thead><tbody>
          {data.rows.map(row => <tr key={row.profileKey}><td>{row.rank}</td><td>
            {profileBase() && CONTRIBUTOR_KEY_RE.test(String(row.profileKey)) ? <a href={`${profileBase()}/${row.profileKey}`}>{roleDisplayName(row.displayName)}</a> :
              <span>{roleDisplayName(row.displayName)}</span>}
            <span className="lb-addr">{shortAddr(row.shortAddress)}</span>{row.isYou === true && <span className="lb-you-pill">you</span>}
          </td><td>{formatRolePayment(row.paidBaseUnits)}</td></tr>)}
        </tbody></table>}
    </>}
  </section>;
}

export default function RoleEarningsBoard() {
  return useRoleEarningsEnabled() ? <EnabledRoleBoard /> : null;
}

export function RoleEarningsSummary({ earnings, onRetry }) {
  const enabled = useRoleEarningsEnabled();
  if (!enabled) return null;
  return <section className="recap-section role-payment-summary" aria-label="Role payment totals">
    <h2>Payments by role · All time</h2>
    <p>Public role totals from confirmed canonical payments. An overall total is unavailable while some roles lack paid-event coverage.</p>
    <dl>{EARNING_ROLES.map(({ key, label }) => {
      const entry = earnings?.roles?.[key];
      const amount = key === 'node' ? null : visibleRoleAmount(earnings, entry, key);
      return <React.Fragment key={key}><dt>{label}</dt><dd>
        {key === 'node' ? NODE_PAYMENT_NOTICE : amount ?? 'Payments unavailable'}
        {amount !== null && entry.displayName && <span> · {roleDisplayName(entry.displayName)}</span>}
      </dd></React.Fragment>;
    })}</dl>
    {onRetry && <button type="button" onClick={onRetry}>Retry role totals</button>}
  </section>;
}

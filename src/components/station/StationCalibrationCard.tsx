import React from 'react';
import { Box, Chip, Link, Stack, Typography } from '@mui/material';
import { Verified as VerifiedIcon, ErrorOutline as WarnIcon, Help as NoneIcon } from '@mui/icons-material';
import {
  CALIBRATION_STATUS_DETAIL,
  CALIBRATION_STATUS_LABEL,
  REVOCATION_REASON_LABEL,
  type CalibrationStatus,
  type StationCalibrationView,
} from '../../utils/stationCalibration';
import { useIsDarkTheme } from '../../theme/ThemeProvider';

/** Accent per status; light mode uses the darker text shade so the chip passes contrast on white. */
const TONE: Record<CalibrationStatus, { dark: string; light: string }> = {
  calibrated: { dark: '#22C55E', light: '#166534' },
  expired: { dark: '#F59E0B', light: '#92400E' },
  revoked: { dark: '#EF4444', light: '#991B1B' },
  not_trusted: { dark: '#F59E0B', light: '#92400E' },
  invalid: { dark: '#EF4444', light: '#991B1B' },
  none: { dark: '#94A3B8', light: '#475569' },
};

const text = 'var(--wrf-ds-text-primary, #F8FAFC)';
const textSecondary = 'var(--wrf-ds-text-secondary, #94A3B8)';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });

const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

function StatusIcon({ status }: { status: CalibrationStatus }) {
  if (status === 'calibrated') return <VerifiedIcon fontSize="small" />;
  if (status === 'none') return <NoneIcon fontSize="small" />;
  return <WarnIcon fontSize="small" />;
}

/** The small badge next to the station name. Renders nothing until there is a status to show. */
export function CalibrationBadge({ view }: { view: StationCalibrationView | undefined }) {
  const isDark = useIsDarkTheme();
  if (!view || view.status === 'none') return null;
  const tone = TONE[view.status];
  const color = isDark ? tone.dark : tone.light;
  return (
    <Chip
      data-testid="station-calibration-badge"
      icon={<StatusIcon status={view.status} />}
      label={CALIBRATION_STATUS_LABEL[view.status]}
      size="small"
      sx={{
        bgcolor: `${tone.dark}1f`,
        color,
        fontWeight: 700,
        height: 'auto',
        maxWidth: '100%',
        '& .MuiChip-icon': { color },
        '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 },
      }}
    />
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, columnGap: 2, rowGap: 0.25, py: 0.75 }}>
      <Typography variant="body2" sx={{ color: textSecondary }}>{label}</Typography>
      <Typography variant="body2" component="div" sx={{ color: text, overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}

/**
 * Sensor calibration section of the station page (core4#388/#435, backend#931). Read-only: the status
 * the backend re-verified at read time, the certificate's details and a link to the signed JSON so
 * anyone can check the signature against the trust root's public key. `unavailable` says so plainly
 * and never implies "not calibrated".
 */
export default function StationCalibrationCard({
  view,
  unavailable,
}: {
  view: StationCalibrationView | undefined;
  unavailable: boolean;
}) {
  const isDark = useIsDarkTheme();
  const certificate = view?.certificate ?? null;
  const downloadHref = React.useMemo(() => {
    if (!view?.signedCertificate) return null;
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(view.signedCertificate, null, 2))}`;
  }, [view]);

  return (
    <section aria-label="Sensor calibration" data-testid="station-calibration">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <VerifiedIcon sx={{ color: '#38BDF8' }} />
        <Typography variant="h6" component="h2" sx={{ color: text, fontWeight: 700 }}>
          Sensor calibration
        </Typography>
      </Stack>

      {unavailable && (
        <Typography role="status" variant="body2" sx={{ color: textSecondary }}>
          Calibration status is not available right now. Nothing about this station’s calibration is confirmed; try again later.
        </Typography>
      )}

      {!unavailable && !view && (
        <Typography variant="body2" sx={{ color: textSecondary }}>Checking calibration…</Typography>
      )}

      {view && (
        <>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
            <Typography
              data-testid="station-calibration-status"
              variant="subtitle1"
              sx={{ color: isDark ? TONE[view.status].dark : TONE[view.status].light, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.75 }}
            >
              <StatusIcon status={view.status} />
              {CALIBRATION_STATUS_LABEL[view.status]}
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: textSecondary, mb: certificate ? 1.5 : 0 }}>
            {CALIBRATION_STATUS_DETAIL[view.status]}
          </Typography>

          {certificate && (
            <Box sx={{ borderTop: '1px solid var(--wrf-ds-border-soft, rgba(51, 65, 85, 0.4392))', pt: 1 }}>
              <Row label="Signed by">{certificate.issuerId}</Row>
              <Row label="Valid">
                {formatDate(certificate.issuedAt)} to {formatDate(certificate.expiresAt)}
              </Row>
              {certificate.revocation && (
                <Row label="Revoked">
                  {formatDate(certificate.revocation.revokedAt)}: {REVOCATION_REASON_LABEL[certificate.revocation.reason] ?? certificate.revocation.reason}
                </Row>
              )}
              {certificate.sensor && <Row label="Sensor">{certificate.sensor}</Row>}
              {certificate.method && <Row label="Method">{certificate.method}</Row>}
              {certificate.reference && <Row label="Reference">{certificate.reference}</Row>}
              {certificate.notes && <Row label="Notes">{certificate.notes}</Row>}
              {certificate.ownerAddress && (
                <Row label="Issued to owner">
                  <Box component="code" title={certificate.ownerAddress} sx={{ fontFamily: 'monospace' }}>{shortAddress(certificate.ownerAddress)}</Box>
                </Row>
              )}
              <Row label="Certificate id">
                <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', whiteSpace: 'normal' }}>{certificate.cid}</Box>
              </Row>
              {downloadHref && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <Link
                    href={downloadHref}
                    download={`calibration-${certificate.artifactId}.json`}
                    data-testid="station-calibration-download"
                    sx={{ color: isDark ? '#38BDF8' : '#0369A1', fontWeight: 600 }}
                  >
                    Download the signed certificate
                  </Link>
                  <Box component="span" sx={{ color: textSecondary }}>
                    {' '}to check the signature yourself against the calibrator’s public key.
                  </Box>
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </section>
  );
}

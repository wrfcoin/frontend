/**
 * Station calibration certificate status from `GET /api/calibration-certificates/station/st_<12hex>`
 * (backend server/routes/calibration-certificate-routes.ts). A trust root signs a certificate for the
 * station's public alias; the backend re-verifies it on every read. Validation is fail-closed: a body
 * this view cannot read is refused, never shown as "calibrated".
 */
export type CalibrationStatus = 'calibrated' | 'expired' | 'revoked' | 'not_trusted' | 'invalid' | 'none';

export interface CalibrationCertificateView {
  cid: string;
  artifactId: string;
  status: Exclude<CalibrationStatus, 'none'>;
  issuerId: string;
  trustRootId: string | null;
  issuedAt: string;
  expiresAt: string;
  ownerAddress: string | null;
  sensor: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  revocation: { reason: string; revokedAt: string } | null;
}

export interface StationCalibrationView {
  stationAlias: string;
  status: CalibrationStatus;
  certificate: CalibrationCertificateView | null;
  /** The full signed certificate JSON, for "download and verify yourself". */
  signedCertificate: unknown;
  trustRoots: Array<{ rootId: string; subject: string; publicKeyHex: string | null }>;
  checkedAt: string;
}

export const CALIBRATION_STATUS_LABEL: Record<CalibrationStatus, string> = {
  calibrated: 'Calibrated',
  expired: 'Calibration expired',
  revoked: 'Calibration revoked',
  not_trusted: 'Calibration not trusted',
  invalid: 'Calibration invalid',
  none: 'Not calibrated',
};

export const CALIBRATION_STATUS_DETAIL: Record<CalibrationStatus, string> = {
  calibrated: 'A trusted calibrator signed a certificate for this station’s sensor, and it is valid now.',
  expired: 'This station’s newest calibration certificate has passed its expiry date.',
  revoked: 'The calibrator withdrew this station’s newest calibration certificate.',
  not_trusted: 'This station’s certificate was signed by a key that is not a trusted calibrator on this network.',
  invalid: 'This station’s newest certificate did not pass verification.',
  none: 'No calibration certificate has been issued for this station yet.',
};

export const REVOCATION_REASON_LABEL: Record<string, string> = {
  superseded: 'replaced by a newer certificate',
  sensor_replaced: 'the sensor was replaced',
  sensor_moved: 'the sensor was moved',
  calibration_error: 'the calibration was found to be wrong',
  key_compromise: 'the signing key was compromised',
  other: 'other reason',
};

const STATUSES: CalibrationStatus[] = ['calibrated', 'expired', 'revoked', 'not_trusted', 'invalid', 'none'];
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const optText = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);

export function normalizeStationCalibration(body: unknown): StationCalibrationView {
  const bad = (): never => {
    throw new Error('Station calibration status has an unexpected shape.');
  };
  if (!isRecord(body)) return bad();
  const status = body.status as CalibrationStatus;
  if (typeof body.stationAlias !== 'string' || !STATUSES.includes(status) || !isDate(body.checkedAt)) return bad();
  if (!Array.isArray(body.trustRoots)) return bad();
  const trustRoots = body.trustRoots.map((root) => {
    if (!isRecord(root) || typeof root.rootId !== 'string' || typeof root.subject !== 'string') return bad();
    return { rootId: root.rootId, subject: root.subject, publicKeyHex: typeof root.publicKeyHex === 'string' ? root.publicKeyHex : null };
  });

  let certificate: CalibrationCertificateView | null = null;
  let signedCertificate: unknown = null;
  if (status !== 'none') {
    const c = body.certificate;
    if (!isRecord(c) || c.status !== status || typeof c.cid !== 'string' || typeof c.artifactId !== 'string') return bad();
    if (!isRecord(c.issuer) || typeof c.issuer.issuerId !== 'string' || !isDate(c.issuedAt) || !isDate(c.expiresAt)) return bad();
    const details = isRecord(c.calibration) ? c.calibration : {};
    let revocation: CalibrationCertificateView['revocation'] = null;
    if (c.revocation !== null && c.revocation !== undefined) {
      if (!isRecord(c.revocation) || typeof c.revocation.reason !== 'string' || !isDate(c.revocation.revokedAt)) return bad();
      revocation = { reason: c.revocation.reason, revokedAt: c.revocation.revokedAt };
    }
    certificate = {
      cid: c.cid,
      artifactId: c.artifactId,
      status: status as CalibrationCertificateView['status'],
      issuerId: c.issuer.issuerId,
      trustRootId: typeof c.issuer.trustRootId === 'string' ? c.issuer.trustRootId : null,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      ownerAddress: typeof c.ownerAddress === 'string' ? c.ownerAddress : null,
      sensor: optText(details.sensor),
      method: optText(details.method),
      reference: optText(details.reference),
      notes: optText(details.notes),
      revocation,
    };
    signedCertificate = c.artifact ?? null;
  } else if (body.certificate !== null) {
    return bad();
  }

  return { stationAlias: body.stationAlias, status, certificate, signedCertificate, trustRoots, checkedAt: body.checkedAt as string };
}

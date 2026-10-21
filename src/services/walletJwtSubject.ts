/** Read the wallet subject for client-side session matching; the server verifies the JWT. */
export function readJwtSubject(jwt: string): string | null {
  const parts = typeof jwt === 'string' ? jwt.split('.') : [];
  if (parts.length !== 3 || !parts[1]) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

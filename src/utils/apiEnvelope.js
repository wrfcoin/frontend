/**
 * Readers for the backend's canonical response envelope (backend#909).
 *
 * backend#909 moved list and single-resource routes onto:
 *
 *   single resource -> { success: true, data }
 *   list            -> { success: true, data: [...], pagination: {...} }
 *
 * Previously the same routes returned the payload bare — an array, or an
 * object with domain keys at the top level (`{ validators, activeCount }`).
 *
 * Frontend and backend deploy independently, so for the length of any skew
 * window a component will see one shape from one service and the other shape
 * from another. These helpers read both, which is what keeps a dashboard from
 * silently rendering zeros — the exact symptom #909 caused in OracleDashboard.
 *
 * They are intentionally shape-driven rather than version-flagged: there is no
 * build-time way to know which backend a given deployment is talking to.
 */

/**
 * Return the payload from an envelope, or the body itself if it is not one.
 *
 * Detection requires BOTH `success` and `data`. Testing `data` alone would
 * misread a legitimate pre-envelope body that happens to carry its own `data`
 * key and unwrap one level too far. An envelope is only successful when
 * `success === true`; rejecting an unsuccessful envelope prevents API errors
 * from becoming healthy-looking empty dashboard data.
 *
 * @param {unknown} body Parsed HTTP response body (i.e. axios `response.data`)
 * @returns {unknown} The inner payload, or `body` unchanged
 */
export function unwrapEnvelope(body) {
  if (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'success' in body &&
    'data' in body
  ) {
    if (body.success !== true) {
      const message =
        typeof body.error === 'string'
          ? body.error
          : body.error?.message || body.message || 'API request was unsuccessful';
      throw new Error(message);
    }
    return body.data;
  }
  return body;
}

/**
 * Coerce a payload to an array.
 *
 * Handles the three shapes these routes have used: a bare array, an envelope
 * whose `data` is the array, and a pre-envelope object holding the array under
 * a domain key (`{ validators: [...] }`).
 *
 * Never returns null/undefined — callers render lists and read `.length`, and a
 * nullish value there is a crash rather than an empty state.
 *
 * @param {unknown} payload  Already passed through {@link unwrapEnvelope}
 * @param {string}  key      Legacy domain key to fall back to
 * @returns {Array} Possibly empty, never nullish
 */
export function asArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (payload !== null && typeof payload === 'object') {
    if (Array.isArray(payload[key])) return payload[key];
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
}

/**
 * Count rows whose status reads as active.
 *
 * `activeCount` was a top-level field on the pre-envelope responses and does
 * not exist in a paginated list body, so consumers must derive it. Case is
 * normalized because the routes have emitted both `ACTIVE` and `active`.
 *
 * @param {Array} rows
 * @returns {number}
 */
export function countActive(rows) {
  if (!Array.isArray(rows)) return 0;
  return rows.filter(
    (row) => String(row?.status ?? '').toLowerCase() === 'active',
  ).length;
}

/**
 * Read pagination metadata from a list body, if present.
 *
 * @param {unknown} body Parsed HTTP response body
 * @returns {{total:number,page:number,limit:number,totalPages:number,hasNext:boolean,hasPrev:boolean}|null}
 */
export function readPagination(body) {
  if (body !== null && typeof body === 'object' && !Array.isArray(body)) {
    const { pagination } = body;
    if (pagination !== null && typeof pagination === 'object') return pagination;
  }
  return null;
}

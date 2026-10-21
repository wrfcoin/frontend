/**
 * Lossless JSON parsing for large integers (issue #236).
 *
 * Core4 balance/stake/earnings fields are Rust `u64`/`u128` base units
 * (WRF_UNITS_PER_COIN = 10^8). JavaScript's native `JSON.parse` coerces every
 * bare number to an IEEE-754 double, so any integer above `Number.MAX_SAFE_INTEGER`
 * (2^53 - 1 = 9_007_199_254_740_991 base units = 90,071,992.55 WRF) is silently
 * rounded and its low-order digits become non-deterministic.
 *
 * The raw decimal digits ARE still present in the HTTP response body text, but
 * the frontend cannot know which field a bare number belongs to after parsing.
 * Therefore unsafe bare numeric literals fail closed. Core4 must serialize
 * u64/u128 amount fields as quoted decimal strings; already-parsed unsafe
 * numbers cannot be repaired by stringifying them.
 *
 * Safe numbers remain numbers. Quoted strings remain untouched.
 */

const MAX_SAFE_INTEGER_DIGITS = String(Number.MAX_SAFE_INTEGER).length; // 16

/**
 * Returns true when a non-negative integer decimal string (no sign, no leading
 * zeros beyond a single "0") cannot be represented exactly as a JS number.
 */
function isUnsafeIntegerMagnitude(digits: string): boolean {
  if (digits.length < MAX_SAFE_INTEGER_DIGITS) return false;
  if (digits.length > MAX_SAFE_INTEGER_DIGITS) return true;
  // Same number of digits as MAX_SAFE_INTEGER: compare lexically (both 16 chars).
  return digits > String(Number.MAX_SAFE_INTEGER);
}

/**
 * Parse a JSON document while rejecting unsafe bare numeric literals. Quoted
 * decimal strings are preserved exactly and are the required amount format.
 */
export function parseJsonPreservingBigInts(text: string): unknown {
  let out = '';
  let i = 0;
  const n = text.length;
  let inString = false;

  while (i < n) {
    const ch = text[i];

    if (inString) {
      out += ch;
      if (ch === '\\') {
        // Copy the escaped character verbatim.
        if (i + 1 < n) {
          out += text[i + 1];
          i += 2;
          continue;
        }
      } else if (ch === '"') {
        inString = false;
      }
      i += 1;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      i += 1;
      continue;
    }

    // Outside a string: try to consume a JSON number literal.
    // A number value is preceded by a structural char or whitespace, never by a
    // digit/letter, so the regex anchor is the start of a numeric token.
    const isNumberStart =
      ch === '-' || (ch >= '0' && ch <= '9');

    if (isNumberStart) {
      const start = i;
      let j = i;
      if (text[j] === '-') j += 1;
      const intStart = j;
      while (j < n && text[j] >= '0' && text[j] <= '9') j += 1;
      const intEnd = j;
      const hasFraction = text[j] === '.';
      // Skip fraction
      if (hasFraction) {
        j += 1;
        while (j < n && text[j] >= '0' && text[j] <= '9') j += 1;
      }
      // Skip exponent
      if (text[j] === 'e' || text[j] === 'E') {
        j += 1;
        if (text[j] === '+' || text[j] === '-') j += 1;
        while (j < n && text[j] >= '0' && text[j] <= '9') j += 1;
      }

      const literal = text.slice(start, j);
      const intDigits = text.slice(intStart, intEnd);

      if (isUnsafeIntegerMagnitude(intDigits)) {
        throw new Error(
          'Unsafe bare numeric JSON value; amount producers must serialize u64/u128 values as decimal strings',
        );
      }
      out += literal;
      i = j;
      continue;
    }

    out += ch;
    i += 1;
  }

  return JSON.parse(out);
}

export default parseJsonPreservingBigInts;

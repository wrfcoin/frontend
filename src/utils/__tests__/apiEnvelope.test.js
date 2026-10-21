/**
 * Envelope-reader tests (backend#909).
 *
 * The defect these guard: backend#909 wrapped the oracle routes in
 * `{ success, data }`, while OracleDashboard kept reading the pre-envelope
 * shape. Every field resolved to `undefined`, fell through `|| 0`, and the
 * dashboard rendered zeros — no error, no empty state, just wrong numbers.
 *
 * So each reader is asserted against BOTH shapes. The old-shape cases are not
 * legacy trivia: frontend and backend deploy separately, so during any skew
 * window a browser really does receive them.
 */

import {
  unwrapEnvelope,
  asArray,
  countActive,
  readPagination,
} from '../apiEnvelope';

describe('unwrapEnvelope', () => {
  it('returns the payload of a single-resource envelope', () => {
    expect(unwrapEnvelope({ success: true, data: { id: 'r1' } })).toEqual({
      id: 'r1',
    });
  });

  it('returns the payload of a list envelope', () => {
    expect(
      unwrapEnvelope({ success: true, data: [1, 2], pagination: { total: 2 } }),
    ).toEqual([1, 2]);
  });

  it('rejects an unsuccessful envelope instead of unwrapping empty data', () => {
    expect(() =>
      unwrapEnvelope({ success: false, data: [], error: 'backend unavailable' }),
    ).toThrow('backend unavailable');
  });

  it('requires the success flag to be the boolean true', () => {
    expect(() => unwrapEnvelope({ success: 'true', data: [] })).toThrow(
      'API request was unsuccessful',
    );
  });

  it('passes a pre-envelope object through unchanged', () => {
    const legacy = { validators: [{ id: 'v1' }], activeCount: 1 };
    expect(unwrapEnvelope(legacy)).toBe(legacy);
  });

  it('passes a bare array through unchanged', () => {
    const legacy = [{ id: 's1' }];
    expect(unwrapEnvelope(legacy)).toBe(legacy);
  });

  it('does not unwrap an object that merely has a data key', () => {
    // Requires BOTH success and data. Unwrapping on `data` alone would strip a
    // legitimate pre-envelope body one level too far.
    const legacy = { data: { nested: true } };
    expect(unwrapEnvelope(legacy)).toBe(legacy);
  });

  it('tolerates null and undefined', () => {
    expect(unwrapEnvelope(null)).toBeNull();
    expect(unwrapEnvelope(undefined)).toBeUndefined();
  });
});

describe('asArray', () => {
  it('reads an envelope list', () => {
    expect(asArray([{ id: 'v1' }], 'validators')).toEqual([{ id: 'v1' }]);
  });

  it('reads the legacy domain key', () => {
    expect(asArray({ validators: [{ id: 'v1' }] }, 'validators')).toEqual([
      { id: 'v1' },
    ]);
  });

  it('never returns a nullish value', () => {
    // Callers read `.length` and map over the result; nullish is a crash.
    for (const input of [null, undefined, {}, 42, 'nope']) {
      expect(asArray(input, 'validators')).toEqual([]);
    }
  });
});

describe('countActive', () => {
  it('counts rows whose status is active, case-insensitively', () => {
    // The routes have emitted both ACTIVE and active.
    expect(
      countActive([
        { status: 'ACTIVE' },
        { status: 'active' },
        { status: 'INACTIVE' },
      ]),
    ).toBe(2);
  });

  it('returns 0 for missing status or non-array input', () => {
    expect(countActive([{}, { status: null }])).toBe(0);
    expect(countActive(null)).toBe(0);
  });
});

describe('readPagination', () => {
  it('reads metadata from a list envelope', () => {
    expect(
      readPagination({ success: true, data: [], pagination: { total: 7 } }),
    ).toEqual({ total: 7 });
  });

  it('returns null when there is none', () => {
    expect(readPagination([1, 2])).toBeNull();
    expect(readPagination({ success: true, data: {} })).toBeNull();
  });
});

describe('the OracleDashboard regression itself (#909)', () => {
  // Reproduces the exact reads the dashboard performs, against both backends.
  const NEW_VALIDATORS = {
    success: true,
    data: { validators: [{ id: 'v1', status: 'ACTIVE' }], activeCount: 1 },
  };
  const OLD_VALIDATORS = {
    validators: [{ id: 'v1', status: 'ACTIVE' }],
    activeCount: 1,
  };
  // Paginated list bodies carry no activeCount at all — it must be derived.
  const NEW_BRIDGES = {
    success: true,
    data: [{ id: 1, status: 'ACTIVE' }, { id: 2, status: 'INACTIVE' }],
    pagination: { total: 2, page: 1, limit: 50 },
  };
  const OLD_BRIDGES = {
    bridges: [{ id: 1, status: 'ACTIVE' }, { id: 2, status: 'INACTIVE' }],
    activeCount: 1,
  };

  it.each([
    ['new envelope', NEW_VALIDATORS],
    ['pre-envelope', OLD_VALIDATORS],
  ])('reads validators and activeCount from the %s shape', (_label, body) => {
    const payload = unwrapEnvelope(body);
    const validators = asArray(payload, 'validators');
    const activeValidators = payload?.activeCount ?? countActive(validators);

    expect(validators).toHaveLength(1);
    expect(activeValidators).toBe(1);
  });

  it.each([
    ['new envelope', NEW_BRIDGES],
    ['pre-envelope', OLD_BRIDGES],
  ])('reads bridges and derives activeCount from the %s shape', (_label, body) => {
    const payload = unwrapEnvelope(body);
    const bridges = asArray(payload, 'bridges');
    const activeBridges = payload?.activeCount ?? countActive(bridges);

    expect(bridges).toHaveLength(2);
    expect(activeBridges).toBe(1);
  });

  it('would have caught the zeros: naive reads collapse on the new shape', () => {
    // This is what the component did before the fix.
    expect(NEW_VALIDATORS.activeCount).toBeUndefined();
    expect(NEW_VALIDATORS.validators).toBeUndefined();
    expect(NEW_BRIDGES.bridges).toBeUndefined();
    // `|| 0` then turned each undefined into a rendered zero.
    expect(NEW_VALIDATORS.activeCount || 0).toBe(0);
  });
});

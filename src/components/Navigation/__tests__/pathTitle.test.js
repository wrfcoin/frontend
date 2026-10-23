import { pathTitle } from '../pathTitle';

describe('taskbar title for paths without a menu entry', () => {
  it('capitalises word segments as before', () => {
    expect(pathTitle('/faucet/bond-grants')).toBe('Faucet > Bond-grants');
    expect(pathTitle('/governance/public')).toBe('Governance > Public');
  });
  it('keeps opaque ids verbatim instead of uppercasing their first letter', () => {
    expect(pathTitle('/forecasters/c_0123456789abcdef01234567')).toBe('Forecasters > c_0123456789abcdef01234567');
    expect(pathTitle('/contributor/c_89abcdef0123456789abcdef')).toBe('Contributor > c_89abcdef0123456789abcdef');
    expect(pathTitle('/weather/station/st-0')).toBe('Weather > Station > st-0');
    expect(pathTitle('/governance/public/WIP-12')).toBe('Governance > Public > WIP-12');
  });
  it('tolerates a trailing slash and an empty path', () => {
    expect(pathTitle('/forecasters/')).toBe('Forecasters');
    expect(pathTitle('')).toBe('');
  });
});

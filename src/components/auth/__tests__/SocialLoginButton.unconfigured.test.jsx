/**
 * @jest-environment jsdom
 *
 * frontend#437: with no VITE_GOOGLE_CLIENT_ID the Google button renders nothing
 * and never loads Google's script (it used to render a broken button and still
 * call the third party).
 */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

await jest.unstable_mockModule('../../../hooks/useSocialAuth', () => ({
  useSocialAuth: () => ({ loading: false, loginWithGoogle: jest.fn(), loginWithApple: jest.fn() }),
  default: () => ({ loading: false, loginWithGoogle: jest.fn(), loginWithApple: jest.fn() }),
}));

const { SocialLoginButton } = await import('../SocialLoginButton.jsx');
const previousEnv = globalThis.__VITE_ENV__;

// The client id is read at render time, so each case sets the build env first.
async function load(env) {
  globalThis.__VITE_ENV__ = env;
  return SocialLoginButton;
}

afterEach(() => {
  cleanup();
  document.getElementById('google-gsi-script')?.remove();
  globalThis.__VITE_ENV__ = previousEnv;
});

describe('SocialLoginButton without provider configuration', () => {
  it.each([{}, { VITE_GOOGLE_CLIENT_ID: '' }, { VITE_GOOGLE_CLIENT_ID: '   ' }])(
    'google with %p: renders nothing and loads no script',
    async env => {
      const SocialLoginButton = await load(env);
      const { container } = render(<SocialLoginButton provider="google" />);
      expect(container.innerHTML).toBe('');
      expect(document.getElementById('google-gsi-script')).toBeNull();
    },
  );

  it('google with a client id: the button container and the script are present', async () => {
    const SocialLoginButton = await load({ VITE_GOOGLE_CLIENT_ID: 'fake-client-id.apps.example' });
    const { container } = render(<SocialLoginButton provider="google" />);
    expect(container.innerHTML).not.toBe('');
    expect(document.getElementById('google-gsi-script')).not.toBeNull();
  });

  it('apple without a client id renders nothing (unchanged)', async () => {
    const SocialLoginButton = await load({});
    const { container } = render(<SocialLoginButton provider="apple" />);
    expect(container.innerHTML).toBe('');
  });
});

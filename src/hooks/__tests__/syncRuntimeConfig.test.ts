/** @jest-environment jsdom */
import { describe, expect, it, beforeEach } from '@jest/globals';
import { resolveSyncApiBaseUrl } from '../syncRuntimeConfig';

describe('resolveSyncApiBaseUrl', () => {
  beforeEach(() => {
    localStorage.clear();
    delete (globalThis as any).__WRF_RUNTIME_CONFIG__;
    delete process.env.VITE_API_URL;
    delete process.env.VITE_API_BASE_URL;
    delete process.env.WRF_API_URL;
  });

  it('ignores browser-controlled localStorage API base overrides', () => {
    localStorage.setItem('wrf.apiBaseUrl', 'https://api.example.com/api/');

    expect(resolveSyncApiBaseUrl()).toBe(window.location.origin);
  });

  it('falls back to runtime config value and normalizes trailing slashes', () => {
    (globalThis as any).__WRF_RUNTIME_CONFIG__ = {
      apiBaseUrl: 'https://runtime.example.com///',
    };

    expect(resolveSyncApiBaseUrl()).toBe('https://runtime.example.com');
  });

  it('falls back to process env when runtime overrides are absent', () => {
    process.env.VITE_API_URL = 'https://env.example.com/api';

    expect(resolveSyncApiBaseUrl()).toBe('https://env.example.com');
  });
});

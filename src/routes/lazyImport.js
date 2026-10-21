import { lazy as reactLazy } from 'react';
import { retryDynamicImport } from '../utils/retryDynamicImport.js';

/** Lazy-load with retry, shared across all route modules. */
const lazy = importer =>
  reactLazy(() =>
    retryDynamicImport(importer, {
      retries: 2,
      retryDelayMs: 250,
    }),
  );

export default lazy;

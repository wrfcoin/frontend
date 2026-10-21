/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  workerIdleMemoryLimit: '512MB',
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/backups/',
    '/__tests__/playwright/',
    '\\.mjs$',
    '/\\.claude/worktrees/',
    '/\\.claude/',
    '/worktrees/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/worktrees',
    '<rootDir>/.claude',
    '<rootDir>/worktrees',
  ],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        // import.meta.env → (globalThis.__VITE_ENV__ ?? {}); see the file.
        astTransformers: { before: ['<rootDir>/jest/viteImportMetaEnvTransformer.cjs'] },
        tsconfig: {
          allowJs: true,
          jsx: 'react-jsx',
          isolatedModules: true,
        },
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/src/__mocks__/fileMock.cjs',
    '^ws$': '<rootDir>/src/__mocks__/ws.cjs',
    // Individual icon paths (e.g. @mui/icons-material/CheckCircle) — default import
    // gets module.exports which must be a function, not an exports object.
    '^@mui/icons-material/(.+)$': '<rootDir>/src/__mocks__/muiIconDefault.cjs',
    // Barrel import (@mui/icons-material) — named exports via exports.X = MockIcon form.
    '^@mui/icons-material$': '<rootDir>/src/__mocks__/muiMock.cjs',
    // Stub @mui/material/styles to eliminate the 230-file emotion+MUI-system chain.
    // Tests that need ThemeProvider only need it to render children; createTheme() shape
    // is provided so component code accessing theme.palette.* does not crash.
    '^@mui/material/styles$': '<rootDir>/src/__mocks__/muiStylesMock.cjs',
  },
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  injectGlobals: true,
};

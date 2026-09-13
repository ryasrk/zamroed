import { createVitestConfig } from '@repo/testing/vitest-config';

export default createVitestConfig({
  dir: import.meta.dirname,
  environment: 'jsdom',
  // Only client components and pure app logic are unit-tested here; server
  // components and route handlers are covered by the production build plus the
  // end-to-end HTTP checks.
  include: ['app/**/*.ts', 'app/**/*.tsx'],
  exclude: [
    'app/**/*.test.{ts,tsx}',
    'app/**/*.spec.{ts,tsx}',
    'app/**/*.d.ts',
    'app/layout.tsx',
    'app/**/page.tsx',
    'app/**/not-found.tsx',
    'app/opengraph-image.tsx',
    'app/icon.tsx',
  ],
});

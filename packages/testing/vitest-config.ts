import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Shared Vitest configuration factory.
 *
 * Coverage thresholds are enforced here so every workspace package is held to
 * the same 90% floor; a package that regresses fails its own `pnpm test`.
 */
export function createVitestConfig(options: {
  /** Directory of the package calling this factory, usually import.meta.dirname. */
  dir: string;
  /** Test environment. Use 'jsdom' for components, 'node' for pure logic. */
  environment?: 'jsdom' | 'node';
  /** Extra setup files beyond the shared jsdom setup. */
  setupFiles?: string[];
  /** Coverage include globs, relative to the package. */
  include?: string[];
  /** Coverage exclude globs, relative to the package. */
  exclude?: string[];
}) {
  const {
    dir,
    environment = 'jsdom',
    setupFiles = [],
    include = ['src/**/*.{ts,tsx}'],
    exclude = [
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.d.ts',
      'src/**/index.{ts,tsx}',
      'src/types.ts',
    ],
  } = options;

  const setup =
    environment === 'jsdom'
      ? [path.join(here, 'setup.ts'), ...setupFiles]
      : [...setupFiles];

  return defineConfig({
    plugins: [react(), tsconfigPaths({ root: dir })],
    test: {
      environment,
      globals: true,
      setupFiles: setup,
      // Test-discovery glob, distinct from the `include` factory option above
      // (which only scopes coverage). Packages keep tests under `src/` and the
      // Next.js apps keep them under `app/`, so both trees are discovered.
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'app/**/*.{test,spec}.{ts,tsx}'],
      css: false,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary'],
        reportsDirectory: path.join(dir, 'coverage'),
        include,
        exclude,
        thresholds: {
          lines: 90,
          functions: 90,
          statements: 90,
          branches: 85,
        },
      },
    },
  });
}

export default createVitestConfig;

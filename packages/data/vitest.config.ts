import { createVitestConfig } from '@repo/testing/vitest-config';

export default createVitestConfig({
  dir: import.meta.dirname,
  environment: 'node',
  include: ['src/**/*.ts'],
});

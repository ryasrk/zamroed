import type { Config } from 'tailwindcss';
import sharedPreset from '@repo/config/tailwind-preset';

export default {
  presets: [sharedPreset],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './packages/*/src/**/*.{ts,tsx}',
    '../../packages/*/src/**/*.{ts,tsx}',
  ],
} satisfies Config;

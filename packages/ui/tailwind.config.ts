import type { Config } from 'tailwindcss';
import sharedPreset from '@repo/config/tailwind-preset';

export default {
  presets: [sharedPreset],
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config;

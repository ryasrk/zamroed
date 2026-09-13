/**
 * Shared Tailwind preset for Jagatirta (River Watch) & ZAMROED Bergerak.
 * Colors are CSS-variable driven so ONE component library serves both brands.
 * The active brand palette is selected by a theme class on <html>.
 */
import type { Config } from 'tailwindcss';

export const sharedPreset = {
  content: [],
  theme: {
    extend: {
      colors: {
        // Brand-agnostic aliases — rebound per theme in globals.css.
        // Declared as RGB channels so opacity modifiers work (e.g. bg-brand-soft/40).
        brand: {
          deep: 'rgb(var(--brand-deep-rgb) / <alpha-value>)',
          primary: 'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft-rgb) / <alpha-value>)',
        },
        // Jagatirta: river palette (always available for map/status UI)
        river: {
          navy: '#091E3A',
          surface: '#0E3558',
          teal: '#028090',
          cyan: '#00BFB2',
        },
        // Jagatirta: water quality semantics
        status: {
          good: '#10B981',
          warning: '#F59E0B',
          critical: '#EF4444',
        },
        // ZAMROED: movement palette
        zamroed: {
          deep: '#064E3B',
          primary: '#047857',
          light: '#A7F3D0',
        },
        gold: {
          ochre: '#D97706',
          muted: '#B45309',
        },
        // Shared editorial neutrals
        canvas: 'rgb(var(--canvas-warm-rgb) / <alpha-value>)',
        surface: {
          pure: 'rgb(var(--surface-pure-rgb) / <alpha-value>)',
          DEFAULT: 'rgb(var(--surface-pure-rgb) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--text-ink-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
        },
        editorial: 'rgb(var(--border-editorial-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        editorial: '740px',
      },
      transitionTimingFunction: {
        crisp: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Omit<Config, 'content'>;

export default sharedPreset;

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
      /**
       * Skala tipografi modular berbasis rasio emas (φ ≈ 1.618).
       *
       * Langkah utuh φ terlalu melompat untuk antarmuka padat, jadi skalanya
       * memakai φ^(n/3) ≈ 1.174 per langkah: cukup rapat untuk hierarki halus,
       * tetapi tetap satu keluarga rasio sehingga proporsi antar ukuran terasa
       * harmonis. Setiap langkah fluid lewat clamp() — tidak ada patahan dari
       * 360px hingga 2560px, dan tidak perlu override per breakpoint.
       *
       * Basis 16px pada mobile, 17px pada layar lebar.
       */
      /**
       * Skala tipografi modular berbasis rasio emas (φ ≈ 1.618).
       *
       * Langkah utuh φ terlalu melompat untuk antarmuka padat, jadi rasionya
       * φ^(1/3) ≈ 1.174 per langkah: cukup rapat untuk hierarki halus, tetapi
       * tetap satu keluarga rasio sehingga proporsi antar ukuran terasa
       * harmonis.
       *
       * Skala bawaan Tailwind sengaja DITIMPA, bukan ditambah. Menambah nama
       * baru di samping `text-sm`/`text-base` hanya akan memperbanyak ukuran
       * yang beredar; menimpanya membuat seluruh kelas yang sudah dipakai di
       * kedua situs otomatis mengikuti satu skala.
       *
       * Setiap langkah fluid lewat clamp() dari 360px ke 1440px, jadi tidak
       * perlu override per breakpoint dan tidak ada patahan ukuran.
       */
      fontSize: {
        xs: ['clamp(0.7256rem, 0.7104rem + 0.067vw, 0.7709rem)', { lineHeight: '1.45', letterSpacing: '0.01em' }] as [string, { lineHeight: string; letterSpacing: string }],
        sm: ['clamp(0.8518rem, 0.8341rem + 0.079vw, 0.905rem)', { lineHeight: '1.5', letterSpacing: '0.005em' }] as [string, { lineHeight: string; letterSpacing: string }],
        base: ['clamp(1rem, 0.9792rem + 0.093vw, 1.0625rem)', { lineHeight: '1.65', letterSpacing: '0' }] as [string, { lineHeight: string; letterSpacing: string }],
        lg: ['clamp(1.174rem, 1.1495rem + 0.109vw, 1.2474rem)', { lineHeight: '1.55', letterSpacing: '0' }] as [string, { lineHeight: string; letterSpacing: string }],
        xl: ['clamp(1.3782rem, 1.3495rem + 0.128vw, 1.4644rem)', { lineHeight: '1.4', letterSpacing: '-0.005em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '2xl': ['clamp(1.5rem, 1.3823rem + 0.523vw, 1.7192rem)', { lineHeight: '1.3', letterSpacing: '-0.01em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '3xl': ['clamp(1.7608rem, 1.6225rem + 0.615vw, 2.0183rem)', { lineHeight: '1.25', letterSpacing: '-0.015em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '4xl': ['clamp(2.0671rem, 1.9048rem + 0.721vw, 2.3694rem)', { lineHeight: '1.18', letterSpacing: '-0.02em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '5xl': ['clamp(2.4266rem, 2.2361rem + 0.847vw, 2.7817rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '6xl': ['clamp(2.8487rem, 2.6251rem + 0.994vw, 3.2656rem)', { lineHeight: '1.06', letterSpacing: '-0.028em' }] as [string, { lineHeight: string; letterSpacing: string }],
        '7xl': ['clamp(3.3441rem, 3.0817rem + 1.166vw, 3.8338rem)', { lineHeight: '1.03', letterSpacing: '-0.03em' }] as [string, { lineHeight: string; letterSpacing: string }],
      },
      maxWidth: {
        /**
         * Panjang baris diukur dalam `ch`, bukan piksel: ukurannya ikut
         * menyesuaikan ukuran font sehingga jumlah karakter per baris tetap di
         * rentang nyaman walau skala tipografi berubah.
         */
        editorial: '65ch',
        narrow: '52ch',
      },
      spacing: {
        /**
         * Ritme vertikal section dalam tiga tingkat kepadatan. Nilainya fluid
         * agar jarak pada layar kecil tidak boros, dan ketiganya dipakai lewat
         * prop `density` pada <Section> supaya pilihan kepadatan selalu
         * disengaja, bukan kebetulan.
         */
        'section-compact': 'clamp(2.25rem, 1.75rem + 2.2vw, 3.25rem)',
        'section-normal': 'clamp(3rem, 2.35rem + 2.9vw, 4.5rem)',
        'section-loose': 'clamp(4rem, 3.1rem + 4vw, 6rem)',

        /**
         * Jarak antar kartu dalam satu kisi. Sebelumnya tiap halaman memilih
         * sendiri dari sepuluh nilai berbeda (4, 5, 6, 7, 8, 10, 12, 14, 16,
         * 24) sehingga kisi di seluruh situs terasa tidak satu sistem. Tiga
         * tingkat ini mengikuti pola yang sama dengan ritme section, jadi jarak
         * mendatar dan tegak akhirnya terbaca sebagai satu keluarga ukuran.
         */
        'grid-tight': 'clamp(0.875rem, 0.8rem + 0.4vw, 1.25rem)',
        'grid-normal': 'clamp(1.25rem, 1.05rem + 0.9vw, 1.75rem)',
        'grid-loose': 'clamp(1.75rem, 1.4rem + 1.5vw, 2.5rem)',
      },
      borderRadius: {
        /**
         * Tiga tingkat radius saja: kontrol kecil, permukaan kartu, dan pil.
         * Membatasi pilihan menjaga bahasa bentuk tetap satu keluarga.
         */
        control: '0.5rem',
        surface: '1rem',
      },
      transitionTimingFunction: {
        /** Keluar cepat lalu melambat — terasa responsif tanpa terlihat malas. */
        crisp: 'cubic-bezier(0.16, 1, 0.3, 1)',
        /** Simetris; untuk perubahan yang bolak-balik seperti hover. */
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        /** Umpan balik instan: warna, opacity pada kontrol kecil. */
        fast: '160ms',
        /** Default antarmuka: hover kartu, perubahan state. */
        base: '240ms',
        /** Perpindahan yang memerlukan kontinuitas spasial. */
        slow: '420ms',
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
        /** Kilau lembut untuk skeleton; jauh lebih tenang dari pulse bawaan. */
        shimmer: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        shimmer: 'shimmer 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
} satisfies Omit<Config, 'content'>;

export default sharedPreset;

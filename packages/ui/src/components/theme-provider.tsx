'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

/**
 * Nama tema yang didukung. Setiap tema memetakan satu kelas pada
 * `<html>` yang me-rebind token `--brand-*` di `globals.css`:
 * - `theme-jagatirta` → biru tua / teal / cyan (konservasi sungai)
 * - `theme-zamroed`   → emerald / gold (gerakan sosial)
 */
export type ThemeName = 'jagatirta' | 'zamroed';

/** Daftar tema yang valid — dipakai untuk validasi runtime & iterasi UI. */
export const THEMES: readonly ThemeName[] = ['jagatirta', 'zamroed'] as const;

/** Kelas `<html>` per tema. */
const THEME_CLASSNAMES: Record<ThemeName, string> = {
  jagatirta: 'theme-jagatirta',
  zamroed: 'theme-zamroed',
};

/** Warna bilah browser (`<meta name="theme-color">`) per tema. */
const THEME_COLORS: Record<ThemeName, string> = {
  jagatirta: '#0b3550',
  zamroed: '#064e3b',
};

/** Kunci `localStorage` untuk mengingat pilihan tema antar sesi. */
const STORAGE_KEY = 'jagatirta-zamroed:theme';

/** Label Bahasa Indonesia untuk setiap tema (dipakai tombol ganti tema). */
export const THEME_LABELS: Record<ThemeName, string> = {
  jagatirta: 'Jagatirta',
  zamroed: 'ZAMROED Bergerak',
};

/** Deskripsi singkat Bahasa Indonesia per tema. */
export const THEME_DESCRIPTIONS: Record<ThemeName, string> = {
  jagatirta: 'Tema biru sungai untuk Jagatirta — konservasi daerah aliran sungai.',
  zamroed: 'Tema hijau emas untuk ZAMROED Bergerak — gerakan sosial warga.',
};

export type ThemeSource = 'prop' | 'storage' | 'system';

export interface ThemeContextValue {
  /** Tema yang sedang aktif. Selalu salah satu dari `THEMES`. */
  theme: ThemeName;
  /** Ganti tema. Menyimpan pilihan ke `localStorage` bila tersedia. */
  applyTheme: (next: ThemeName) => void;
  /** `true` bila tema belum dapat dibaca dari sisi klien (SSR / hidrasi). */
  mounted: boolean;
}

export interface ThemeProviderProps {
  /** Tema awal saat belum ada pilihan tersimpan. Default: 'jagatirta'. */
  defaultTheme?: ThemeName;
  /** Bila `true` (default), pilihan tema disimpan di `localStorage`. */
  persist?: boolean;
  /** Kelas tambahan untuk `<html>`, mis. `bg-canvas text-ink`. */
  className?: string;
  children?: ReactNode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
ThemeContext.displayName = 'ThemeContext';

/** Cek apakah nilai apa pun adalah `ThemeName` yang sah. */
export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEMES as readonly string[]).includes(value);
}

/** Normalisasi input tak terpercaya (query string, localStorage, API) ke tema sah. */
function normalizeTheme(value: unknown, fallback: ThemeName): ThemeName {
  return isThemeName(value) ? value : fallback;
}

/** Baca tema tersimpan; aman untuk SSR (tidak menyentuh `window` saat server). */
function readStoredTheme(): ThemeName | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeName(raw) ? raw : null;
  } catch {
    // Mode privat / storage diblokir — bukan kesalahan fatal.
    return null;
  }
}

function writeStoredTheme(theme: ThemeName): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Abaikan: preferensi tetap berlaku untuk sesi berjalan.
  }
}

/**
 * Tema awal sebelum JS hidrasi: `null` di server sehingga render server dan
 * render klien pertama identik (menghindari hydration mismatch).
 */
function subscribe(): () => void {
  return () => {};
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * ThemeProvider — sumber tunggal tema untuk Jagatirta & ZAMROED Bergerak.
 *
 * Menerapkan `applyTheme` pada `document.documentElement.classList` lewat
 * `useEffect`, sehingga seluruh token `brand.*` (dan komponen bersama lain)
 * otomatis berganti palet tanpa satu pun warna di-hardcode.
 */
export function ThemeProvider({
  defaultTheme = 'jagatirta',
  persist = true,
  className,
  children,
}: ThemeProviderProps) {
  const safeDefault = normalizeTheme(defaultTheme, 'jagatirta');

  // `useSyncExternalStore` dipakai agar `mounted` konsisten antara server
  // (false) dan klien (true) tanpa memicu peringatan hidrasi.
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [theme, setTheme] = useState<ThemeName>(safeDefault);

  // Setelah mount, ambil preferensi tersimpan bila ada.
  useEffect(() => {
    if (!persist) return;
    const stored = readStoredTheme();
    if (stored && stored !== theme) setTheme(stored);
    // Sengaja hanya berjalan saat mount / saat `persist` berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist]);

  // Sinkronkan `<html>`: kelas tema, atribut data, dan warna bilah browser.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const active = THEME_CLASSNAMES[theme];
    const inactive = THEMES.map((name) => THEME_CLASSNAMES[name]).filter((cls) => cls !== active);

    root.classList.remove(...inactive);
    root.classList.add(active);
    root.setAttribute('data-theme', theme);
    root.style.setProperty('color-scheme', 'light');

    if (className) {
      root.classList.add(...className.split(/\s+/).filter(Boolean));
    }

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLORS[theme]);
  }, [theme, className]);

  const applyTheme = useCallback(
    (next: ThemeName) => {
      const safe = normalizeTheme(next, 'jagatirta');
      setTheme((current) => (current === safe ? current : safe));
      if (persist) writeStoredTheme(safe);
    },
    [persist],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, applyTheme, mounted }),
    [theme, applyTheme, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme() — akses tema aktif dan pengubahnya.
 *
 * @throws Error bila dipanggil di luar `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error(
      'useTheme() harus dipakai di dalam <ThemeProvider>. ' +
        'Bungkus komponen Anda, misalnya: <ThemeProvider defaultTheme="jagatirta">…</ThemeProvider>.',
    );
  }
  return context;
}

export interface ThemeSwitcherProps {
  /** Kelas tambahan untuk kontainer tombol. */
  className?: string;
  /** Label grup tombol untuk pembaca layar. */
  label?: string;
}

/**
 * ThemeSwitcher — kontrol opsional (48px) untuk berpindah tema langsung dari UI.
 * Dipakai oleh kedua situs; seluruh warna mengikuti token `brand.*` yang aktif.
 */
export function ThemeSwitcher({
  className,
  label = 'Pilih tema tampilan situs',
}: ThemeSwitcherProps) {
  const { theme, applyTheme, mounted } = useTheme();

  const handleSelect = useCallback(
    (next: ThemeName) => {
      applyTheme(next);
    },
    [applyTheme],
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex min-h-12 items-center gap-1 rounded-xl border border-brand-soft bg-surface p-1',
        className,
      )}
    >
      {THEMES.map((name) => {
        const active = mounted && theme === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => handleSelect(name)}
            aria-pressed={active}
            title={THEME_DESCRIPTIONS[name]}
            className={cn(
              'min-h-12 touch-manipulation select-none rounded-lg px-4 text-sm font-semibold leading-none',
              'transition-colors duration-200 ease-crisp',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
              active
                ? 'bg-brand-primary text-white'
                : 'bg-transparent text-ink-secondary hover:bg-brand-soft hover:text-ink',
            )}
          >
            {THEME_LABELS[name]}
          </button>
        );
      })}
    </div>
  );
}

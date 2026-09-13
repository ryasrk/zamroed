import { describe, expect, it, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { installUserEventCompat } from './test-utils';
import {
  THEME_DESCRIPTIONS,
  THEME_LABELS,
  THEMES,
  ThemeProvider,
  ThemeSwitcher,
  isThemeName,
  useTheme,
} from '../theme-provider';

// user-event cannot attach its clipboard stub until the non-configurable
// navigator.clipboard from the shared jsdom setup is replaced.
beforeAll(() => {
  installUserEventCompat();
});

function makeUser() {
  return userEvent.setup();
}


const STORAGE_KEY = 'jagatirta-zamroed:theme';

/** Consumer that exposes the context value plus buttons to drive it. */
function ThemeProbe() {
  const { theme, applyTheme, mounted } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="mounted">{mounted ? 'yes' : 'no'}</span>
      <button type="button" onClick={() => applyTheme('zamroed')}>
        pakai-zamroed
      </button>
      <button type="button" onClick={() => applyTheme('jagatirta')}>
        pakai-jagatirta
      </button>
    </div>
  );
}

function readThemeColorMeta(): string | null {
  return document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content ?? null;
}

describe('theme-provider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((node) => node.remove());
  });

  afterEach(() => {
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.head.querySelectorAll('meta[name="theme-color"]').forEach((node) => node.remove());
  });

  describe('isThemeName', () => {
    it.each([...THEMES])('accepts the documented theme %s', (name) => {
      expect(isThemeName(name)).toBe(true);
    });

    const invalidValues: Array<[unknown, string]> = [
      ['hijau', 'unknown string'],
      ['', 'empty string'],
      ['JAGATIRTA', 'wrong casing'],
      [null, 'null'],
      [undefined, 'undefined'],
      [0, 'number'],
      [{ theme: 'jagatirta' }, 'object'],
    ];

    it.each(invalidValues)('rejects %s (%s)', (value) => {
      expect(isThemeName(value)).toBe(false);
    });
  });

  describe('ThemeProvider defaults', () => {
    it('applies jagatirta to <html> by default and marks mounted after hydration', () => {
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
      expect(screen.getByTestId('mounted')).toHaveTextContent('yes');

      const root = document.documentElement;
      expect(root).toHaveClass('theme-jagatirta');
      expect(root).not.toHaveClass('theme-zamroed');
      expect(root).toHaveAttribute('data-theme', 'jagatirta');
      expect(root.style.getPropertyValue('color-scheme')).toBe('light');
      expect(readThemeColorMeta()).toBe('#0b3550');
    });

    it('honours defaultTheme="zamroed" and synchronises theme-color', () => {
      render(
        <ThemeProvider defaultTheme="zamroed">
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      const root = document.documentElement;
      expect(root).toHaveClass('theme-zamroed');
      expect(root).not.toHaveClass('theme-jagatirta');
      expect(root).toHaveAttribute('data-theme', 'zamroed');
      expect(readThemeColorMeta()).toBe('#064e3b');
    });

    it('normalises an invalid defaultTheme back to jagatirta', () => {
      render(
        <ThemeProvider defaultTheme={'hijau' as unknown as 'jagatirta'}>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
      expect(document.documentElement).toHaveAttribute('data-theme', 'jagatirta');
    });

    it('applies extra className tokens to <html> and ignores blank ones', () => {
      render(
        <ThemeProvider className="bg-canvas   text-ink">
          <ThemeProbe />
        </ThemeProvider>,
      );

      const root = document.documentElement;
      expect(root).toHaveClass('bg-canvas');
      expect(root).toHaveClass('text-ink');
      expect(root.className).not.toMatch(/\s{2,}/);
    });

    it('reuses an existing theme-color meta tag instead of appending a duplicate', () => {
      const existing = document.createElement('meta');
      existing.setAttribute('name', 'theme-color');
      existing.setAttribute('content', 'stale');
      document.head.appendChild(existing);

      render(
        <ThemeProvider defaultTheme="zamroed">
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
      expect(existing.getAttribute('content')).toBe('#064e3b');
    });
  });

  describe('applyTheme', () => {
    it('switches theme, updates <html> and persists to localStorage', async () => {
      const user = makeUser();
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

      await user.click(screen.getByRole('button', { name: 'pakai-zamroed' }));

      expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      expect(document.documentElement).toHaveClass('theme-zamroed');
      expect(document.documentElement).not.toHaveClass('theme-jagatirta');
      expect(document.documentElement).toHaveAttribute('data-theme', 'zamroed');
      expect(readThemeColorMeta()).toBe('#064e3b');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('zamroed');
    });

    it('is a no-op state-wise when re-applying the theme already active', async () => {
      const user = makeUser();
      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'pakai-jagatirta' }));

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
      // The write still happens because applyTheme persists eagerly.
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('jagatirta');
    });

    it('does not touch localStorage when persist={false}', async () => {
      const user = makeUser();
      render(
        <ThemeProvider persist={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'pakai-zamroed' }));

      expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ignores a stored preference when persist={false}', () => {
      window.localStorage.setItem(STORAGE_KEY, 'zamroed');

      render(
        <ThemeProvider persist={false}>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
    });

    it.each(['zamroed', 'jagatirta'] as const)(
      'restores the stored "%s" preference on mount',
      (stored) => {
        window.localStorage.setItem(STORAGE_KEY, stored);

        render(
          <ThemeProvider defaultTheme={stored === 'zamroed' ? 'jagatirta' : 'zamroed'}>
            <ThemeProbe />
          </ThemeProvider>,
        );

        expect(screen.getByTestId('theme')).toHaveTextContent(stored);
        expect(document.documentElement).toHaveAttribute('data-theme', stored);
      },
    );

    it('ignores a malformed stored value and keeps the default', () => {
      window.localStorage.setItem(STORAGE_KEY, 'hijau');

      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
    });
  });

  describe('storage failure handling', () => {
    it('falls back gracefully when reading localStorage throws', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage blocked');
      });

      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      expect(screen.getByTestId('theme')).toHaveTextContent('jagatirta');
      expect(document.documentElement).toHaveAttribute('data-theme', 'jagatirta');
      getItem.mockRestore();
    });

    it('still applies the theme in-session when writing localStorage throws', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });
      const user = makeUser();

      render(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'pakai-zamroed' }));

      expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      expect(document.documentElement).toHaveClass('theme-zamroed');
      setItem.mockRestore();
    });
  });

  describe('useTheme', () => {
    it('throws a descriptive error outside a ThemeProvider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<ThemeProbe />)).toThrow(/useTheme\(\) harus dipakai di dalam/);

      consoleError.mockRestore();
    });

    it('returns the same applyTheme identity across re-renders', () => {
      const seen: Array<(next: 'jagatirta' | 'zamroed') => void> = [];

      function IdentityProbe() {
        const { applyTheme } = useTheme();
        seen.push(applyTheme);
        return <span data-testid="theme">{useTheme().theme}</span>;
      }

      const { rerender } = render(
        <ThemeProvider>
          <IdentityProbe />
        </ThemeProvider>,
      );
      rerender(
        <ThemeProvider>
          <IdentityProbe />
        </ThemeProvider>,
      );

      expect(seen.length).toBeGreaterThan(1);
      expect(new Set(seen).size).toBe(1);
    });
  });

  describe('ThemeSwitcher', () => {
    it('renders one pressed-state button per documented theme with accessible descriptions', () => {
      render(
        <ThemeProvider defaultTheme="zamroed">
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      const group = screen.getByRole('group', { name: 'Pilih tema tampilan situs' });
      expect(group).toBeInTheDocument();

      THEMES.forEach((name) => {
        const button = screen.getByRole('button', { name: THEME_LABELS[name] });
        expect(button).toHaveAttribute('title', THEME_DESCRIPTIONS[name]);
      });

      expect(screen.getByRole('button', { name: 'ZAMROED Bergerak' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Jagatirta' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('accepts a custom group label and extra className', () => {
      render(
        <ThemeProvider>
          <ThemeSwitcher label="Ganti warna situs" className="mt-4" />
        </ThemeProvider>,
      );

      expect(screen.getByRole('group', { name: 'Ganti warna situs' })).toHaveClass('mt-4');
    });

    it('switches theme when the inactive button is pressed', async () => {
      const user = makeUser();
      render(
        <ThemeProvider>
          <ThemeProbe />
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'ZAMROED Bergerak' }));

      expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      expect(screen.getByRole('button', { name: 'ZAMROED Bergerak' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Jagatirta' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('zamroed');
    });

    it('can be driven by keyboard activation', async () => {
      const user = makeUser();
      render(
        <ThemeProvider>
          <ThemeProbe />
          <ThemeSwitcher />
        </ThemeProvider>,
      );

      const target = screen.getByRole('button', { name: 'ZAMROED Bergerak' });
      await act(async () => {
        target.focus();
      });
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('theme')).toHaveTextContent('zamroed');
      });
    });
  });
});

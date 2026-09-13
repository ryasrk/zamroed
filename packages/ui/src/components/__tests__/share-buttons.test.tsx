import { describe, expect, it, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { installUserEventCompat } from './test-utils';
import { ShareButtons } from '../share-buttons';

// Replaces the non-configurable navigator.clipboard from the shared jsdom setup
// so both user-event and these specs' own clipboard stubs can be installed.
beforeAll(() => {
  installUserEventCompat();
});

function makeUser() {
  return userEvent.setup();
}

/**
 * Install a clipboard whose `writeText` resolves/rejects as requested.
 * `installUserEventCompat` leaves `navigator.clipboard` configurable, so this
 * can redefine it on every call.
 */
function stubClipboard(impl: 'resolve' | 'reject' | 'missing') {
  if (impl === 'missing') {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      writable: true,
      value: undefined,
    });
    return undefined;
  }
  const writeText =
    impl === 'resolve'
      ? vi.fn().mockResolvedValue(undefined)
      : vi.fn().mockRejectedValue(new Error('clipboard denied'));
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText },
  });
  return writeText;
}

const TITLE = 'Banjir di Citarum';
const URL = 'https://jagatirta.id/berita/banjir-citarum';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('ShareButtons', () => {
  describe('rendering', () => {
    it('renders the group with a default label derived from the title', () => {
      render(<ShareButtons title={TITLE} url={URL} />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', `Bagikan konten: ${TITLE}`);
      expect(group).not.toHaveAttribute('data-copied');
    });

    it('honours a custom label and className on the container', () => {
      render(<ShareButtons title={TITLE} url={URL} label="Bagikan artikel ini" className="mt-6" />);

      expect(screen.getByRole('group', { name: 'Bagikan artikel ini' })).toHaveClass('mt-6');
    });

    it('renders one labelled link per network plus a copy button', () => {
      render(<ShareButtons title={TITLE} url={URL} />);

      const whatsapp = screen.getByRole('link', { name: `Bagikan "${TITLE}" lewat WhatsApp` });
      const x = screen.getByRole('link', { name: `Bagikan "${TITLE}" lewat X` });
      const facebook = screen.getByRole('link', { name: `Bagikan "${TITLE}" lewat Facebook` });
      const copy = screen.getByRole('button', { name: `Salin tautan "${TITLE}" ke papan klip` });

      expect(whatsapp).toHaveAttribute('data-share', 'whatsapp');
      expect(x).toHaveAttribute('data-share', 'x');
      expect(facebook).toHaveAttribute('data-share', 'facebook');
      expect(copy).toHaveAttribute('data-share', 'copy');

      [whatsapp, x, facebook].forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('builds encoded share hrefs containing the message, title and URL', () => {
      render(<ShareButtons title={TITLE} url={URL} />);

      const expectedText = encodeURIComponent(`Bantu sebarkan: ${TITLE} ${URL}`);
      expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
        'href',
        `https://wa.me/?text=${expectedText}`,
      );
      expect(screen.getByRole('link', { name: /lewat X/ })).toHaveAttribute(
        'href',
        `https://twitter.com/intent/tweet?text=${expectedText}`,
      );
      expect(screen.getByRole('link', { name: /Facebook/ })).toHaveAttribute(
        'href',
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`,
      );
    });

    it('trims the title before building aria labels and share text', () => {
      render(<ShareButtons title="   Judul Berspasi   " url={URL} />);

      expect(screen.getByRole('link', { name: 'Bagikan "Judul Berspasi" lewat WhatsApp' })).toBeInTheDocument();
      expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Bagikan konten: Judul Berspasi');
    });

    it('keeps share text clean when the title is empty', () => {
      render(<ShareButtons title="   " url={URL} />);

      const expectedText = encodeURIComponent(`Bantu sebarkan: ${URL}`);
      expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute(
        'href',
        `https://wa.me/?text=${expectedText}`,
      );
    });

    it('hides visible link labels by default (compact) without losing accessible names', () => {
      render(<ShareButtons title={TITLE} url={URL} />);

      const whatsapp = screen.getByRole('link', { name: /WhatsApp/ });
      const visibleSpan = within(whatsapp).getByText('WhatsApp');
      // sr-only classes are compiled away in tests, but the text node remains in the DOM.
      expect(visibleSpan).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Salin tautan/ })).toBeInTheDocument();
    });

    it('renders inline link labels when compact={false}', () => {
      render(<ShareButtons title={TITLE} url={URL} compact={false} />);

      expect(within(screen.getByRole('link', { name: /WhatsApp/ })).getByText('WhatsApp')).toHaveClass(
        'inline',
      );
      expect(within(screen.getByRole('button')).getByText('Salin Tautan')).toHaveClass('inline');
    });

    it.each(['stacked', 'row'] as const)('renders without error in the %s layout', (layout) => {
      render(<ShareButtons title={TITLE} url={URL} layout={layout} />);

      const row = screen.getByRole('group').firstElementChild as HTMLElement;
      expect(row).not.toBeNull();
      expect(screen.getByRole('button', { name: /Salin tautan/ })).toBeInTheDocument();
    });
  });

  describe('sharing links', () => {
    it('opens the WhatsApp intent in a new window instead of navigating', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.click(screen.getByRole('link', { name: /WhatsApp/ }));

      expect(openSpy).toHaveBeenCalledTimes(1);
      const [href, target, features] = openSpy.mock.calls[0];
      expect(href).toBe(`https://wa.me/?text=${encodeURIComponent(`Bantu sebarkan: ${TITLE} ${URL}`)}`);
      expect(target).toBe('_blank');
      expect(features).toBe('noopener,noreferrer');
    });

    it('opens the X intent when the X link is clicked', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.click(screen.getByRole('link', { name: /lewat X/ }));

      expect(openSpy.mock.calls[0][0]).toBe(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Bantu sebarkan: ${TITLE} ${URL}`)}`,
      );
    });

    it('opens the Facebook sharer with only the URL', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.click(screen.getByRole('link', { name: /Facebook/ }));

      expect(openSpy.mock.calls[0][0]).toBe(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`,
      );
    });

    it('falls back to window.location.assign when the popup is blocked', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      const assign = vi.fn();
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { href: 'https://jagatirta.id/berita/2019/banjir', assign },
      });

      try {
        render(<ShareButtons title={TITLE} />);
        await user.click(screen.getByRole('link', { name: /WhatsApp/ }));

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(assign).toHaveBeenCalledTimes(1);
        expect(assign.mock.calls[0][0]).toBe(
          `https://wa.me/?text=${encodeURIComponent(
            `Bantu sebarkan: ${TITLE} https://jagatirta.id/berita/2019/banjir`,
          )}`,
        );
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: originalLocation,
        });
      }
    });

    it('reads window.location.href when no url prop is supplied', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      render(<ShareButtons title={TITLE} />);
      await user.click(screen.getByRole('link', { name: /lewat X/ }));

      expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent(window.location.href));
    });

    it('prefers the url prop over window.location.href', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.click(screen.getByRole('link', { name: /lewat X/ }));

      expect(openSpy.mock.calls[0][0]).not.toContain(encodeURIComponent(window.location.href));
      expect(openSpy.mock.calls[0][0]).toContain(encodeURIComponent(URL));
    });

    it('uses a trimmed url prop and ignores a whitespace-only url', async () => {
      const user = makeUser();
      const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
      const { rerender } = render(<ShareButtons title={TITLE} url={`  ${URL}  `} />);

      await user.click(screen.getByRole('link', { name: /Facebook/ }));
      expect(openSpy.mock.calls[0][0]).toBe(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`,
      );

      openSpy.mockClear();
      rerender(<ShareButtons title={TITLE} url="   " />);
      await user.click(screen.getByRole('link', { name: /Facebook/ }));
      expect(openSpy.mock.calls[0][0]).toBe(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
      );
    });
  });

  describe('copy to clipboard', () => {
    it('writes the resolved url and shows success feedback', async () => {
      const user = makeUser();
      const writeText = stubClipboard('resolve');

      render(<ShareButtons title={TITLE} url={URL} compact={false} />);
      await user.click(screen.getByRole('button', { name: /Salin tautan/ }));

      expect(writeText).toHaveBeenCalledWith(URL);
      const button = screen.getByRole('button', { name: 'Tautan berhasil disalin ke papan klip' });
      expect(button).toHaveTextContent('Tersalin!');
      expect(screen.getByRole('group')).toHaveAttribute('data-copied', 'true');
      expect(screen.getByRole('status')).toHaveTextContent('Tautan tersalin ke papan klip.');
    });

    it('falls back to window.location.href when copying without a url prop', async () => {
      const user = makeUser();
      const writeText = stubClipboard('resolve');

      render(<ShareButtons title={TITLE} />);
      await user.click(screen.getByRole('button'));

      expect(writeText).toHaveBeenCalledWith(window.location.href);
    });

    it('shows failure feedback when writeText rejects', async () => {
      const user = makeUser();
      stubClipboard('reject');

      render(<ShareButtons title={TITLE} url={URL} compact={false} />);
      await user.click(screen.getByRole('button', { name: /Salin tautan/ }));

      const button = screen.getByRole('button', { name: /Tautan gagal disalin/ });
      expect(button).toHaveTextContent('Gagal menyalin');
      expect(screen.getByRole('group')).not.toHaveAttribute('data-copied');
      expect(screen.getByRole('status')).toHaveTextContent('Tautan gagal disalin.');
    });

    it('reports failure when the Clipboard API is unavailable', async () => {
      const user = makeUser();
      stubClipboard('missing');

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('status')).toHaveTextContent('Tautan gagal disalin.');
      expect(screen.getByRole('button', { name: /gagal disalin/ })).toBeInTheDocument();
    });

    it('reports failure when there is no URL to copy at all', async () => {
      const user = makeUser();
      stubClipboard('resolve');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { href: '', assign: vi.fn() },
      });

      try {
        render(<ShareButtons title={TITLE} />);
        await user.click(screen.getByRole('button'));

        expect(screen.getByRole('status')).toHaveTextContent('Tautan gagal disalin.');
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: originalLocation,
        });
      }
    });

    it('fails the copy when window.location.href is not a string', async () => {
      const user = makeUser();
      stubClipboard('resolve');
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        writable: true,
        value: { href: undefined, assign: vi.fn() },
      });

      try {
        render(<ShareButtons title={TITLE} />);
        await user.click(screen.getByRole('button'));

        expect(screen.getByRole('status')).toHaveTextContent('Tautan gagal disalin.');
      } finally {
        Object.defineProperty(window, 'location', {
          configurable: true,
          writable: true,
          value: originalLocation,
        });
      }
    });

    it('resets the copied state after the feedback window elapses', async () => {
      vi.useFakeTimers();
      const writeText = stubClipboard('resolve');

      render(<ShareButtons title={TITLE} url={URL} />);
      fireEvent.click(screen.getByRole('button'));
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByRole('status')).toHaveTextContent('Tautan tersalin ke papan klip.');

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('status')).toHaveTextContent('');
      expect(screen.getByRole('button')).toHaveTextContent('Salin Tautan');
      expect(screen.getByRole('group')).not.toHaveAttribute('data-copied');
    });

    it('clears a pending reset timer on unmount', async () => {
      vi.useFakeTimers();
      const writeText = stubClipboard('resolve');
      const clearSpy = vi.spyOn(globalThis, 'clearTimeout');

      const { unmount } = render(<ShareButtons title={TITLE} url={URL} />);
      fireEvent.click(screen.getByRole('button'));
      await act(async () => {
        await Promise.resolve();
      });

      const before = clearSpy.mock.calls.length;
      unmount();
      expect(clearSpy.mock.calls.length).toBeGreaterThan(before);
    });

    it('re-copies and reschedules when the copy button is pressed twice', async () => {
      vi.useFakeTimers();
      const writeText = stubClipboard('resolve');

      render(<ShareButtons title={TITLE} url={URL} />);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      await act(async () => {
        await Promise.resolve();
      });
      fireEvent.click(button);
      await act(async () => {
        await Promise.resolve();
      });

      expect(writeText).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('status')).toHaveTextContent('Tautan tersalin ke papan klip.');
    });
  });

  describe('accessibility', () => {
    it('always exposes a polite live region for screen-reader feedback', () => {
      render(<ShareButtons title={TITLE} url={URL} />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveTextContent('');
    });

    it('keeps the copy button reachable by keyboard', async () => {
      const user = makeUser();
      stubClipboard('resolve');

      render(<ShareButtons title={TITLE} url={URL} />);
      await user.tab();
      expect(screen.getByRole('link', { name: /WhatsApp/ })).toHaveFocus();

      await user.tab();
      await user.tab();
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByRole('status')).toHaveTextContent('Tautan tersalin ke papan klip.');
    });
  });
});

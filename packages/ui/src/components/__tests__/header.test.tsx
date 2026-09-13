import { describe, expect, it, beforeEach, afterEach, beforeAll, vi } from 'vitest';
import { render, screen, within, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { installUserEventCompat } from './test-utils';

// Vitest 2.x types the mock function, not its return value.
const usePathname = vi.fn<() => string | null>(() => '/');
vi.mock('next/navigation', () => ({ usePathname: () => usePathname() }));
// next/link renders a plain anchor under jsdom but would attempt a real
// navigation on click; drop the default so drawer-close behaviour is observable.
vi.mock('next/link', async () => {
  const React = await import('react');
  const Real = (await vi.importActual<Record<string, unknown>>('next/link')).default as
    | React.ComponentType<Record<string, unknown>>
    | undefined;
  return {
    default: React.forwardRef(function MockLink(props: Record<string, unknown>, ref: unknown) {
      const { onClick, ...rest } = props;
      return React.createElement(Real as never, {
        ...rest,
        ref,
        onClick: (event: { preventDefault: () => void }) => {
          event.preventDefault();
          (onClick as ((e: unknown) => void) | undefined)?.(event);
        },
      });
    }),
  };
});

import { Header, type NavItem } from '../header';

const NAV: NavItem[] = [
  { label: 'Program', href: '/program' },
  { label: 'Data Sungai', href: '/data' },
  { label: 'Tentang', href: '/tentang' },
];

// Replaces the non-configurable navigator.clipboard from the shared jsdom setup
// so user-event can install and restore its own clipboard stub.
beforeAll(() => {
  installUserEventCompat();
});

function makeUser() {
  return userEvent.setup();
}


function getDrawer(toggle: HTMLElement): HTMLElement {
  const id = toggle.getAttribute('aria-controls');
  const drawer = id ? document.getElementById(id) : null;
  if (!drawer) throw new Error('drawer element not found');
  return drawer;
}

beforeEach(() => {
  usePathname.mockReturnValue('/');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
});

afterEach(() => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
});

describe('Header', () => {
  describe('default render', () => {
    it('renders the banner, brand, desktop nav and links', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Jagatirta/ })).toHaveAttribute('href', '/');
      expect(screen.getByRole('navigation', { name: 'Navigasi utama' })).toBeInTheDocument();

      NAV.forEach((item) => {
        expect(screen.getAllByRole('link', { name: item.label })[0]).toHaveAttribute(
          'href',
          item.href,
        );
      });
    });

    it('renders the brand initial and marks it decorative when no logo is given', () => {
      render(<Header brandName="jagatirta" navItems={NAV} />);

      const mark = screen.getByRole('banner').querySelector('span[aria-hidden="true"]');
      expect(mark).toHaveTextContent('J');
      expect(screen.queryByRole('banner')?.querySelector('img')).toBeNull();
    });

    it('falls back to "Tanpa Nama" for a whitespace-only brand and a middot initial', () => {
      render(<Header brandName="   " navItems={NAV} />);

      expect(screen.getByText('Tanpa Nama')).toBeInTheDocument();
      const mark = screen.getByRole('banner').querySelector('span[aria-hidden="true"]');
      expect(mark).toHaveTextContent('·');
    });

    it('renders the logo image when logoSrc is provided', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} logoSrc="/logo.svg" />);

      const img = screen.getByRole('banner').querySelector('img');
      expect(img).not.toBeNull();
      expect(img).toHaveAttribute('src', '/logo.svg');
      expect(img).toHaveAttribute('alt', '');
    });

    it('falls back to the brand initial when the logo fails to load', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} logoSrc="/broken.png" />);

      const img = screen.getByRole('banner').querySelector('img')!;
      fireEvent.error(img);

      expect(screen.getByRole('banner').querySelector('img')).toBeNull();
      const mark = screen.getByRole('banner').querySelector('span[aria-hidden="true"]');
      expect(mark).toHaveTextContent('J');
    });

    it('accepts a className passthrough on the header element', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} className="border-t" />);
      expect(screen.getByRole('banner')).toHaveClass('border-t');
    });
  });

  describe('CTA', () => {
    it('renders the CTA only when both label and href are supplied', () => {
      const { rerender } = render(<Header brandName="Jagatirta" navItems={NAV} ctaLabel="Donasi" />);
      expect(screen.queryByRole('link', { name: 'Donasi' })).not.toBeInTheDocument();

      rerender(<Header brandName="Jagatirta" navItems={NAV} ctaHref="/donasi" />);
      expect(screen.queryByRole('link', { name: 'Donasi' })).not.toBeInTheDocument();

      rerender(<Header brandName="Jagatirta" navItems={NAV} ctaLabel="Donasi" ctaHref="/donasi" />);
      expect(screen.getAllByRole('link', { name: 'Donasi' }).map((l) => l.getAttribute('href'))).toEqual(
        ['/donasi'],
      );
    });

    it('renders a CTA-only header (no nav items) with just the hamburger', () => {
      render(<Header brandName="Jagatirta" navItems={[]} ctaLabel="Donasi" ctaHref="/donasi" />);

      expect(screen.queryByRole('navigation', { name: 'Navigasi utama' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toBeInTheDocument();
      expect(screen.getByText('Belum ada menu navigasi.')).toBeInTheDocument();
    });
  });

  describe('empty navItems', () => {
    it('omits desktop nav and the hamburger when there is nothing to show', () => {
      render(<Header brandName="Jagatirta" navItems={[]} />);

      expect(screen.queryByRole('navigation', { name: 'Navigasi utama' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      // The drawer element still exists (hidden) so the empty notice is present.
      expect(screen.getByText('Belum ada menu navigasi.')).toBeInTheDocument();
    });
  });

  describe('active link detection', () => {
    it('marks an exact-match link with aria-current="page"', () => {
      usePathname.mockReturnValue('/data');
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getAllByRole('link', { name: 'Data Sungai' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getAllByRole('link', { name: 'Program' })[0]).not.toHaveAttribute('aria-current');
    });

    it('treats nested routes and query/hash as inside the matching branch', () => {
      usePathname.mockReturnValue('/data/sungai/2024?tab=nilai#bagian');
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getAllByRole('link', { name: 'Data Sungai' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('does not treat a text prefix as an active branch', () => {
      usePathname.mockReturnValue('/databackup');
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getAllByRole('link', { name: 'Data Sungai' })[0]).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('matches the root link only on the exact root path', () => {
      usePathname.mockReturnValue('/');
      const items: NavItem[] = [{ label: 'Beranda', href: '/' }, ...NAV];
      render(<Header brandName="Jagatirta" navItems={items} />);

      expect(screen.getAllByRole('link', { name: 'Beranda' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );

      usePathname.mockReturnValue('/program');
      const { unmount } = render(<Header brandName="Jagatirta" navItems={items} />);
      expect(screen.getAllByRole('link', { name: 'Beranda' })[1]).not.toHaveAttribute('aria-current');
      unmount();
    });

    it('normalises trailing slashes and query strings on the target href', () => {
      usePathname.mockReturnValue('/tentang');
      render(
        <Header
          brandName="Jagatirta"
          navItems={[{ label: 'Tentang', href: '/tentang/?ref=nav' }]}
        />,
      );

      expect(screen.getAllByRole('link', { name: 'Tentang' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('survives a non-string pathname from usePathname', () => {
      usePathname.mockReturnValue(null);
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getAllByRole('link', { name: 'Program' })[0]).not.toHaveAttribute('aria-current');
    });

    it('normalises a pathname that is only a query or hash to the root', () => {
      usePathname.mockReturnValue('?utm_source=nav');
      render(<Header brandName="Jagatirta" navItems={[{ label: 'Beranda', href: '/' }, ...NAV]} />);

      // '?utm_source=nav' normalises to '/', which matches the root link.
      expect(screen.getAllByRole('link', { name: 'Beranda' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('normalises a numeric pathname to the root and matches only root links', () => {
      // usePathname's type says string, but the runtime guard must cope with any value.
      usePathname.mockReturnValue(42 as unknown as string);
      render(<Header brandName="Jagatirta" navItems={[{ label: 'Beranda', href: '/' }, ...NAV]} />);

      expect(screen.getAllByRole('link', { name: 'Beranda' })[0]).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(screen.getAllByRole('link', { name: 'Program' })[0]).not.toHaveAttribute(
        'aria-current',
      );
    });

    it('shows the "Aktif" marker inside the drawer for the active route', () => {
      usePathname.mockReturnValue('/program');
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const drawer = getDrawer(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      expect(within(drawer).getByText('Aktif')).toBeInTheDocument();
      // Numbering prefix: 01, 02, 03.
      expect(within(drawer).getByText('01')).toBeInTheDocument();
      expect(within(drawer).getByText('03')).toBeInTheDocument();
    });
  });

  describe('mobile drawer', () => {
    it('starts closed with a labelled toggle and a hidden drawer', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(getDrawer(toggle)).toHaveAttribute('hidden');
    });

    it('opens the drawer, flips the toggle label and locks body scroll', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      await user.click(toggle);

      const opened = screen.getByRole('button', { name: 'Tutup menu navigasi' });
      expect(opened).toHaveAttribute('aria-expanded', 'true');
      expect(getDrawer(opened)).not.toHaveAttribute('hidden');
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('adds scrollbar compensation padding when a scrollbar is present', async () => {
      const user = makeUser();
      Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 900 });
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 915 });

      render(<Header brandName="Jagatirta" navItems={NAV} />);
      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));

      expect(document.body.style.paddingRight).toBe('15px');
    });

    it('closes and restores scroll when the drawer footer button is pressed', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      await user.click(screen.getByRole('button', { name: 'Tutup menu' }));

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(document.body.style.overflow).toBe('');
    });

    it('closes when a nav link inside the drawer is activated', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const toggle = await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      void toggle;
      const drawer = getDrawer(screen.getByRole('button', { name: 'Tutup menu navigasi' }));
      await user.click(within(drawer).getByRole('link', { name: /Program/ }));

      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('closes when the drawer CTA is activated', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} ctaLabel="Donasi" ctaHref="/donasi" />);

      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      const drawer = getDrawer(screen.getByRole('button', { name: 'Tutup menu navigasi' }));
      await user.click(within(drawer).getByRole('link', { name: 'Donasi' }));

      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('closes on Escape and returns focus to the toggle', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      await user.click(toggle);
      expect(toggle).toHaveFocus();

      await user.keyboard('{Escape}');

      const closed = screen.getByRole('button', { name: 'Buka menu navigasi' });
      expect(closed).toHaveAttribute('aria-expanded', 'false');
      expect(document.body.style.overflow).toBe('');
      expect(closed).toHaveFocus();
    });

    it('ignores non-Escape keys while open', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      await user.keyboard('a');

      expect(screen.getByRole('button', { name: 'Tutup menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('does not listen for Escape while the drawer is closed', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('closes the drawer when the route changes', () => {
      const { rerender } = render(<Header brandName="Jagatirta" navItems={NAV} />);
      fireEvent.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      expect(screen.getByRole('button', { name: 'Tutup menu navigasi' })).toBeInTheDocument();

      usePathname.mockReturnValue('/tentang');
      rerender(<Header brandName="Jagatirta" navItems={NAV} />);

      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });

    it('toggles the drawer closed when the hamburger is pressed twice', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      await user.click(screen.getByRole('button', { name: 'Tutup menu navigasi' }));

      expect(screen.getByRole('button', { name: 'Buka menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
    });
  });

  describe('scroll state', () => {
    it('sets data-scrolled once the page passes the threshold', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);
      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled');

      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 100 });
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true');
    });

    it('clears data-scrolled when returning to the top', () => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 100 });
      render(<Header brandName="Jagatirta" navItems={NAV} />);
      expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true');

      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 });
      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled');
    });

    it('stays unscrolled exactly at the threshold boundary', () => {
      Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 24 });
      render(<Header brandName="Jagatirta" navItems={NAV} />);
      expect(screen.getByRole('banner')).not.toHaveAttribute('data-scrolled');
    });

    it('removes its scroll listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<Header brandName="Jagatirta" navItems={NAV} />);

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      removeSpy.mockRestore();
    });
  });

  describe('accessibility contract', () => {
    it('links the hamburger to the drawer via aria-controls and the drawer to its label', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      const drawer = getDrawer(toggle);
      const labelledBy = drawer.querySelector('nav')?.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(drawer.querySelector(`#${CSS.escape(labelledBy as string)}`)).toHaveTextContent(
        'Navigasi utama',
      );
    });

    it('provides an escape hatch button at the bottom of the drawer', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      await user.click(screen.getByRole('button', { name: 'Buka menu navigasi' }));
      const drawer = getDrawer(screen.getByRole('button', { name: 'Tutup menu navigasi' }));
      expect(within(drawer).getByRole('button', { name: 'Tutup menu' })).toBeInTheDocument();
    });

    it('marks animated indicator spans as decorative', () => {
      render(<Header brandName="Jagatirta" navItems={NAV} />);
      const banner = screen.getByRole('banner');
      const hidden = banner.querySelectorAll('[aria-hidden="true"]');
      expect(hidden.length).toBeGreaterThan(0);
    });

    it('can be driven by keyboard through toggle, drawer links and close', async () => {
      const user = makeUser();
      render(<Header brandName="Jagatirta" navItems={NAV} />);

      await user.tab();
      expect(screen.getByRole('link', { name: /Jagatirta/ })).toHaveFocus();

      const toggle = screen.getByRole('button', { name: 'Buka menu navigasi' });
      toggle.focus();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: 'Tutup menu navigasi' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });
  });
});

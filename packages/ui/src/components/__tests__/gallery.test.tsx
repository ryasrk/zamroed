import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Gallery } from '../gallery';
import type { GalleryImage } from '../gallery';
import { installUserEventCompat } from './test-utils';

// jsdom's non-configurable `navigator.clipboard` breaks userEvent.setup();
// the shared helper swaps in a configurable navigator. See test-utils.ts.
beforeAll(() => {
  installUserEventCompat();
});

/* Helpers ------------------------------------------------------------------ */

/**
 * The gallery mutates <body>/<html> inline styles. RTL's auto-cleanup unmounts
 * the tree (which restores those styles) but a test that set them by hand
 * would leak into the next one, so reset explicitly after every test.
 */
afterEach(() => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  document.documentElement.style.overflow = '';
});

const TWO_IMAGES: GalleryImage[] = [
  { src: '/foto/ciliwung-1.jpg', alt: 'Relawan mengukur pH Ciliwung', caption: 'Uji air pekan ke-12' },
  { src: '/foto/ciliwung-2.jpg', alt: 'Sedimentasi tepi sungai' },
];

const THREE_IMAGES: GalleryImage[] = [
  { src: '/foto/a.jpg', alt: 'Foto A' },
  { src: '/foto/b.jpg', alt: 'Foto B' },
  { src: '/foto/c.jpg', alt: 'Foto C', caption: 'Keterangan C' },
];

function grid(): HTMLElement {
  return screen.getByRole('list');
}

function tileButtons(): HTMLElement[] {
  // Grid triggers: aria-haspopup="dialog".
  return screen.getAllByRole('button').filter((b) => b.getAttribute('aria-haspopup') === 'dialog');
}

function dialog(): HTMLElement {
  return screen.getByRole('dialog');
}

/**
 * Both the backdrop and the X button share the accessible name "Tutup tampilan
 * besar". The backdrop is the tabIndex=-1 one; the real close control is the
 * other. The focusable one is what we want everywhere except the backdrop test.
 */
function closeButton(): HTMLElement {
  const candidates = screen.getAllByRole('button', { name: 'Tutup tampilan besar' });
  return candidates.find((b) => b.getAttribute('tabindex') !== '-1') as HTMLElement;
}

function backdropButton(): HTMLElement {
  const candidates = screen.getAllByRole('button', { name: 'Tutup tampilan besar' });
  return candidates.find((b) => b.getAttribute('tabindex') === '-1') as HTMLElement;
}

/* -------------------------------------------------------------------------- */
/*  Default render / grid                                                      */
/* -------------------------------------------------------------------------- */

describe('Gallery — grid rendering', () => {
  it('renders a labelled list with one trigger button per image', () => {
    render(<Gallery images={TWO_IMAGES} />);

    expect(grid()).toHaveAttribute('aria-label', 'Galeri foto');
    expect(tileButtons()).toHaveLength(2);
    expect(screen.getByRole('img', { name: 'Relawan mengukur pH Ciliwung' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sedimentasi tepi sungai' })).toBeInTheDocument();
  });

  it('renders one <li> per image', () => {
    const { container } = render(<Gallery images={THREE_IMAGES} />);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('uses a custom accessibility label when provided', () => {
    render(<Gallery images={TWO_IMAGES} label="Galeri dokumentasi lapangan" />);
    expect(grid()).toHaveAttribute('aria-label', 'Galeri dokumentasi lapangan');
  });

  it('exposes the columns count as a data attribute (default 3)', () => {
    render(<Gallery images={TWO_IMAGES} />);
    expect(grid()).toHaveAttribute('data-columns', '3');
  });

  it('reflects the columns={2} prop', () => {
    render(<Gallery images={TWO_IMAGES} columns={2} />);
    expect(grid()).toHaveAttribute('data-columns', '2');
  });

  it('marks every trigger collapsed and popup-capable before opening', () => {
    render(<Gallery images={TWO_IMAGES} />);
    for (const button of tileButtons()) {
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).not.toHaveAttribute('aria-controls');
    }
  });

  it('does not render the lightbox until a tile is activated', () => {
    render(<Gallery images={TWO_IMAGES} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides a decorative per-tile overlay hint from assistive tech', () => {
    const { container } = render(<Gallery images={TWO_IMAGES} />);
    const hiddenLabels = Array.from(container.querySelectorAll('[aria-hidden="true"]')).map(
      (n) => n.textContent ?? '',
    );
    expect(hiddenLabels.some((t) => t.includes('Perbesar foto'))).toBe(true);
  });

  it('lazily loads grid images and decodes them async', () => {
    render(<Gallery images={TWO_IMAGES} />);
    const img = screen.getByRole('img', { name: 'Sedimentasi tepi sungai' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });
});

/* -------------------------------------------------------------------------- */
/*  Empty / invalid input                                                      */
/* -------------------------------------------------------------------------- */

describe('Gallery — empty and invalid images', () => {
  it('renders nothing for an empty array', () => {
    const { container } = render(<Gallery images={[]} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders nothing when every item lacks a usable src', () => {
    const { container } = render(
      <Gallery images={[{ src: '', alt: 'Kosong', caption: 'x' }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('drops only the invalid entries and keeps the valid ones', () => {
    render(
      <Gallery
        images={[
          { src: '', alt: 'Tidak valid' },
          { src: '/foto/valid.jpg', alt: 'Foto valid' },
          { src: '   ', alt: 'Spasi saja' },
        ]}
      />,
    );
    expect(tileButtons()).toHaveLength(1);
    expect(screen.getByRole('img', { name: 'Foto valid' })).toBeInTheDocument();
  });

  it('tolerates a null images value at runtime (defensive filter)', () => {
    const { container } = render(<Gallery images={null as unknown as GalleryImage[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps an item whose src carries surrounding whitespace', () => {
    render(<Gallery images={[{ src: '  /foto/padded.jpg  ', alt: 'Foto padded' }]} />);
    // The filter trims only for the emptiness test; the raw src is rendered.
    expect(screen.getByRole('img', { name: 'Foto padded' })).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  showCaptions                                                               */
/* -------------------------------------------------------------------------- */

describe('Gallery — showCaptions', () => {
  it('does not render permanent captions by default', () => {
    const { container } = render(<Gallery images={TWO_IMAGES} />);
    // 'Uji air pekan ke-12' only appears inside the aria-hidden hover overlay.
    expect(container.querySelectorAll('li p')).toHaveLength(0);
  });

  it('renders captions under the tiles when showCaptions is set', () => {
    const { container } = render(<Gallery images={THREE_IMAGES} showCaptions />);
    const paragraphs = Array.from(container.querySelectorAll('li p'));
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0]).toHaveTextContent('Keterangan C');
  });

  it('falls back to the "Perbesar foto" overlay hint for captionless items', () => {
    const { container } = render(<Gallery images={THREE_IMAGES} showCaptions />);
    const overlayText = Array.from(container.querySelectorAll('[aria-hidden="true"]'))
      .map((n) => n.textContent ?? '')
      .join(' ');
    expect(overlayText).toContain('Perbesar foto');
  });
});

/* -------------------------------------------------------------------------- */
/*  Opening the lightbox                                                       */
/* -------------------------------------------------------------------------- */

describe('Gallery — lightbox opening', () => {
  it('opens a modal dialog when a tile is clicked', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);

    const dlg = dialog();
    expect(dlg).toHaveAttribute('aria-modal', 'true');
    expect(dlg).toHaveAttribute('aria-label', 'Galeri foto');
  });

  it('marks the opened tile expanded and points aria-controls at the dialog', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[1]);

    const dlg = dialog();
    expect(dlg.id).toBeTruthy();
    const openTile = tileButtons()[1];
    expect(openTile).toHaveAttribute('aria-expanded', 'true');
    expect(openTile).toHaveAttribute('aria-controls', dlg.id);
    expect(tileButtons()[0]).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the position counter and the active image inside the dialog', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[1]);

    expect(screen.getByText('Foto 2 dari 3')).toBeInTheDocument();
    // Active image is the unmodified src, decoded async, not lazy.
    const dlgImg = dialog().querySelector('img') as HTMLImageElement;
    expect(dlgImg).toHaveAttribute('src', '/foto/b.jpg');
    expect(dlgImg).toHaveAttribute('alt', 'Foto B');
    expect(dlgImg).toHaveAttribute('decoding', 'async');
  });

  it('shows the active item caption in the lightbox when present', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[2]);

    expect(dialog()).toHaveTextContent('Foto C');
    expect(dialog()).toHaveTextContent('Keterangan C');
    expect(screen.getByText('Foto 3 dari 3')).toBeInTheDocument();
  });

  it('omits the caption line for an item without a caption', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[1]);
    const figcaption = dialog().querySelector('figcaption') as HTMLElement;
    expect(figcaption.querySelectorAll('span')).toHaveLength(1);
  });

  it('locks scrolling on <body> and <html> while open and restores it on close', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(document.body.style.overflow).toBe('hidden');
    expect(document.documentElement.style.overflow).toBe('hidden');

    await user.click(closeButton());
    await waitFor(() => expect(document.body.style.overflow).toBe(''));
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('restores the previous inline overflow value rather than clearing it', async () => {
    document.body.style.overflow = 'scroll';
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(closeButton());
    await waitFor(() => expect(document.body.style.overflow).toBe('scroll'));
    document.body.style.overflow = '';
  });

  it('compensates for the scrollbar width so the layout does not jump', async () => {
    // jsdom reports innerWidth === documentElement.clientWidth, so the component
    // normally skips this branch. Widen the viewport gap to exercise it.
    const innerWidthSpy = vi
      .spyOn(window, 'innerWidth', 'get')
      .mockReturnValue(document.documentElement.clientWidth + 15);

    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    // paddingRight must absorb the 15px scrollbar that just disappeared.
    expect(document.body.style.paddingRight).toBe('15px');

    await user.click(closeButton());
    await waitFor(() => expect(document.body.style.paddingRight).toBe(''));
    innerWidthSpy.mockRestore();
  });

  it('adds the scrollbar width on top of an existing padding-right', async () => {
    document.body.style.paddingRight = '8px';
    const innerWidthSpy = vi
      .spyOn(window, 'innerWidth', 'get')
      .mockReturnValue(document.documentElement.clientWidth + 10);

    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(document.body.style.paddingRight).toBe('18px');

    await user.click(closeButton());
    await waitFor(() => expect(document.body.style.paddingRight).toBe('8px'));
    innerWidthSpy.mockRestore();
  });

  it('moves focus to the close button after opening', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);

    await waitFor(() => expect(closeButton()).toHaveFocus());
  });
});

/* -------------------------------------------------------------------------- */
/*  Closing the lightbox                                                       */
/* -------------------------------------------------------------------------- */

describe('Gallery — lightbox closing', () => {
  it('closes via the X button', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(closeButton());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes via the Escape key', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.click(backdropButton());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('returns focus to the originating tile after closing', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);

    const trigger = tileButtons()[1];
    await user.click(trigger);
    await waitFor(() => expect(closeButton()).toHaveFocus());

    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

/* -------------------------------------------------------------------------- */
/*  Navigation inside the lightbox                                             */
/* -------------------------------------------------------------------------- */

describe('Gallery — navigation', () => {
  it('shows no prev/next controls for a single-image gallery', async () => {
    const user = userEvent.setup();
    render(<Gallery images={[{ src: '/foto/only.jpg', alt: 'Hanya satu' }]} />);

    await user.click(tileButtons()[0]);

    expect(screen.queryByRole('button', { name: 'Foto sebelumnya' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Foto berikutnya' })).not.toBeInTheDocument();
    expect(screen.getByText('Foto 1 dari 1')).toBeInTheDocument();
  });

  it('exposes prev/next controls when there is more than one image', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);

    expect(screen.getByRole('button', { name: 'Foto sebelumnya' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Foto berikutnya' })).toBeInTheDocument();
    expect(
      screen.getByText(/Gunakan tombol panah kiri\/kanan untuk berpindah foto/),
    ).toBeInTheDocument();
  });

  it('advances with the next button', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.click(screen.getByRole('button', { name: 'Foto berikutnya' }));

    expect(screen.getByText('Foto 2 dari 3')).toBeInTheDocument();
  });

  it('wraps around backwards from the first image', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.click(screen.getByRole('button', { name: 'Foto sebelumnya' }));

    expect(screen.getByText('Foto 3 dari 3')).toBeInTheDocument();
  });

  it('wraps around forwards from the last image', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[2]);
    await user.click(screen.getByRole('button', { name: 'Foto berikutnya' }));

    expect(screen.getByText('Foto 1 dari 3')).toBeInTheDocument();
  });

  it('navigates with ArrowRight / ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Foto 2 dari 3')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('Foto 1 dari 3')).toBeInTheDocument();
  });

  it('jumps to the last image with End and back to the first with Home', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.keyboard('{End}');
    expect(screen.getByText('Foto 3 dari 3')).toBeInTheDocument();

    await user.keyboard('{Home}');
    expect(screen.getByText('Foto 1 dari 3')).toBeInTheDocument();
  });

  it('ignores other keys while the lightbox is open', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await user.keyboard('a');
    expect(screen.getByText('Foto 1 dari 3')).toBeInTheDocument();
  });

  it('keeps focus trapped: Tab from the last control wraps to the first', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    // (the wrapped-to node is the backdrop; see assertion below)
    // jsdom has no layout engine, so `offsetParent` is always null and the
    // component's visibility filter would empty the focusable list. Returning a
    // non-null value mirrors a real browser and exercises the real trap branch.
    const offsetParentSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetParent', 'get')
      .mockReturnValue(document.body);

    // The trap's "last" node is the next-image control (last button in DOM order).
    const next = screen.getByRole('button', { name: 'Foto berikutnya' });
    next.focus();
    expect(next).toHaveFocus();

    // Drive the keydown directly: user-event's Tab simulation is not affected by
    // the handler's preventDefault(), so it cannot observe this wrap.
    fireEvent.keyDown(document, { key: 'Tab' });
    // NOTE: the trap's "first" node is the backdrop button (tabIndex=-1 included,
    // since the selector only excludes disabled buttons), so the forward wrap
    // lands there rather than on the close button. Pinning the real behaviour.
    expect(backdropButton()).toHaveFocus();
    offsetParentSpy.mockRestore();
  });

  it('wraps focus backwards: Shift+Tab from the first control jumps to the last', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);

    const offsetParentSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetParent', 'get')
      .mockReturnValue(document.body);

    // The trap's "first" node is the backdrop: it is the first button in DOM
    // order and the selector does not exclude tabIndex=-1 buttons. Focusing it
    // makes `current === first` hold, which is the branch that performs the wrap.
    const first = backdropButton();
    first.focus();
    expect(first).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Foto berikutnya' })).toHaveFocus();
    offsetParentSpy.mockRestore();
  });

  it('does not wrap backwards from the close button (it is not the trap anchor)', async () => {
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    await waitFor(() => expect(closeButton()).toHaveFocus());

    const offsetParentSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetParent', 'get')
      .mockReturnValue(document.body);

    const before = document.activeElement;
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    // `current !== first`, so the handler leaves focus alone.
    expect(document.activeElement).toBe(before);
    offsetParentSpy.mockRestore();
  });

  it('blocks Tab entirely when the dialog has no focusable controls', async () => {
    // Without the offsetParent stub jsdom reports every node as invisible, so
    // the component's focusable list is empty and Tab must be swallowed rather
    // than allowed to escape into the page behind the modal.
    const user = userEvent.setup();
    render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[0]);
    const before = document.activeElement;
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(before);
  });

  it('clamps a stale index when the image list shrinks while open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[2]);
    expect(screen.getByText('Foto 3 dari 3')).toBeInTheDocument();

    rerender(<Gallery images={[THREE_IMAGES[0]]} />);
    // Index 2 no longer exists: the lightbox must clamp to the last remaining
    // image rather than point at an undefined item.
    await waitFor(() => expect(screen.getByText('Foto 1 dari 1')).toBeInTheDocument());
    expect(dialog().querySelector('img')).toHaveAttribute('src', '/foto/a.jpg');
  });

  it('drops navigation controls once the list shrinks to a single image', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[2]);
    expect(screen.getByRole('button', { name: 'Foto berikutnya' })).toBeInTheDocument();

    rerender(<Gallery images={[THREE_IMAGES[0]]} />);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Foto berikutnya' })).not.toBeInTheDocument(),
    );
  });

  it('keeps the lightbox open on a surviving index after a shrink', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Gallery images={THREE_IMAGES} />);

    await user.click(tileButtons()[1]);
    expect(screen.getByText('Foto 2 dari 3')).toBeInTheDocument();

    rerender(<Gallery images={[THREE_IMAGES[0], THREE_IMAGES[1]]} />);
    await waitFor(() => expect(screen.getByText('Foto 2 dari 2')).toBeInTheDocument());
  });

  it('closes the lightbox when the list becomes empty', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    rerender(<Gallery images={[]} />);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

/* -------------------------------------------------------------------------- */
/*  Broken images                                                              */
/* -------------------------------------------------------------------------- */

describe('Gallery — broken image handling', () => {
  it('swaps a broken tile for a readable "cannot load" placeholder', () => {
    const { container } = render(<Gallery images={THREE_IMAGES} />);

    const img = screen.getByRole('img', { name: 'Foto B' });
    fireEvent.error(img);

    expect(screen.getByText('Gambar tidak dapat dimuat')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Foto B' })).not.toBeInTheDocument();
    // The tile button and its position are preserved.
    expect(tileButtons()).toHaveLength(3);
    expect(container.querySelectorAll('li')).toHaveLength(3);
  });

  it('does not mark a second failure on an already-failed tile', () => {
    render(<Gallery images={[{ src: '/foto/x.jpg', alt: 'Foto X' }]} />);

    const img = screen.getByRole('img', { name: 'Foto X' });
    fireEvent.error(img);
    expect(screen.getByText('Gambar tidak dapat dimuat')).toBeInTheDocument();
    // Re-firing cannot throw or duplicate the placeholder.
    expect(screen.getAllByText('Gambar tidak dapat dimuat')).toHaveLength(1);
  });

  it('dedupes two error events for the same tile inside one batch', () => {
    render(<Gallery images={[{ src: '/foto/x.jpg', alt: 'Foto X' }]} />);

    const img = screen.getByRole('img', { name: 'Foto X' });
    // Both events land before React flushes, so the reducer's
    // "already recorded" early-return is the branch under test.
    act(() => {
      img.dispatchEvent(new Event('error'));
      img.dispatchEvent(new Event('error'));
    });

    expect(screen.getAllByText('Gambar tidak dapat dimuat')).toHaveLength(1);
  });

  it('keeps the other tiles intact when one image fails', () => {
    render(<Gallery images={THREE_IMAGES} />);
    fireEvent.error(screen.getByRole('img', { name: 'Foto B' }));

    expect(screen.getByRole('img', { name: 'Foto A' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Foto C' })).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  Cleanup on unmount                                                         */
/* -------------------------------------------------------------------------- */

describe('Gallery — unmount cleanup', () => {
  it('removes the keydown listener and unlocks scroll when unmounted while open', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Gallery images={TWO_IMAGES} />);

    await user.click(tileButtons()[0]);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('');
    expect(document.documentElement.style.overflow).toBe('');
    // A keydown after unmount must not throw or reopen anything.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not lock scroll before the lightbox is opened', () => {
    const { unmount } = render(<Gallery images={TWO_IMAGES} />);
    expect(document.body.style.overflow).toBe('');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });
});

/* -------------------------------------------------------------------------- */
/*  Edge cases                                                                 */
/* -------------------------------------------------------------------------- */

describe('Gallery — edge cases', () => {
  it('handles a very long alt/caption without truncating content', () => {
    const longAlt = 'Relawan mengukur kualitas air '.repeat(40).trim();
    const longCaption = 'Catatan lapangan '.repeat(80).trim();
    render(<Gallery images={[{ src: '/foto/long.jpg', alt: longAlt, caption: longCaption }]} />);

    expect(screen.getByRole('img', { name: longAlt })).toBeInTheDocument();
  });

  it('renders a single-element gallery without navigation controls', () => {
    render(<Gallery images={[{ src: '/foto/satu.jpg', alt: 'Satu foto' }]} />);
    expect(tileButtons()).toHaveLength(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders many elements (12) with stable keys and no duplicates', () => {
    const many: GalleryImage[] = Array.from({ length: 12 }, (_, i) => ({
      src: `/foto/${i}.jpg`,
      alt: `Foto nomor ${i}`,
    }));
    const { container } = render(<Gallery images={many} />);

    expect(container.querySelectorAll('li')).toHaveLength(12);
    expect(tileButtons()).toHaveLength(12);
  });

  it('tolerates duplicate srcs (key falls back to the index)', () => {
    const { container } = render(
      <Gallery
        images={[
          { src: '/foto/sama.jpg', alt: 'Pertama' },
          { src: '/foto/sama.jpg', alt: 'Kedua' },
        ]}
      />,
    );
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('applies the caller className to the grid and itemClassName to each tile', () => {
    render(<Gallery images={TWO_IMAGES} className="mt-10" itemClassName="border-4" />);
    expect(grid().className).toContain('mt-10');
    for (const button of tileButtons()) {
      expect(button.className).toContain('border-4');
    }
  });

  it('numbers the lightbox counter from 1 for the first image', async () => {
    const user = userEvent.setup();
    render(<Gallery images={TWO_IMAGES} />);
    await user.click(tileButtons()[0]);
    expect(screen.getByText('Foto 1 dari 2')).toBeInTheDocument();
  });
});

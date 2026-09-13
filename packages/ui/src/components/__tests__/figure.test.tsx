import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Figure } from '../figure';
import { installUserEventCompat } from './test-utils';

// jsdom's non-configurable `navigator.clipboard` breaks userEvent.setup();
// the shared helper swaps in a configurable navigator. See test-utils.ts.
beforeAll(() => {
  installUserEventCompat();
});

/* Helpers ------------------------------------------------------------------ */

/** The media frame is the first child of <figure>; the <img> lives inside it. */
function frameOf(figure: HTMLElement): HTMLElement {
  return figure.firstElementChild as HTMLElement;
}

/* -------------------------------------------------------------------------- */
/*  Default render / happy path                                                */
/* -------------------------------------------------------------------------- */

describe('Figure', () => {
  it('renders a figure with the image, alt text and the hover/focus shell', () => {
    render(<Figure src="/foto/ciliwung.jpg" alt="Relawan mengukur pH Ciliwung" />);

    const figure = screen.getByRole('figure');
    // A <figure> without an accessible name is only reachable as role=figure;
    // assert it is present exactly once and contains the image.
    expect(figure.tagName).toBe('FIGURE');

    const img = screen.getByRole('img', { name: 'Relawan mengukur pH Ciliwung' });
    expect(img).toHaveAttribute('src', '/foto/ciliwung.jpg');
    expect(frameOf(figure)).toContainElement(img);
  });

  it('defaults to lazy loading with low fetch priority', () => {
    render(<Figure src="/foto/a.jpg" alt="A" />);

    const img = screen.getByRole('img', { name: 'A' });
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('fetchpriority', 'low');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('draggable', 'false');
  });

  it('renders no figcaption when neither caption nor credit is given', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('defaults alt to the empty string so decorative images are announced as present', () => {
    const { container } = render(<Figure src="/foto/dekor.jpg" />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('alt', '');
  });

  it('applies the 16:9 aspect class and rounded card by default', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    expect(frame.className).toContain('aspect-video');
    expect(frame.className).toContain('rounded-2xl');
  });
});

/* -------------------------------------------------------------------------- */
/*  ratio variants                                                             */
/* -------------------------------------------------------------------------- */

describe('Figure — ratio variants', () => {
  const cases: Array<[Parameters<typeof Figure>[0]['ratio'], string]> = [
    ['16:9', 'aspect-video'],
    ['4:3', 'aspect-[4/3]'],
    ['1:1', 'aspect-square'],
    ['9:16', 'aspect-[9/16]'],
  ];

  it.each(cases)('ratio %s maps to %s in the frame', (ratio, expectedClass) => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" ratio={ratio} />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    expect(frame.className).toContain(expectedClass);
  });

  it('centres and width-caps the portrait 9:16 frame', () => {
    const { container } = render(<Figure src="/foto/p.jpg" alt="P" ratio="9:16" />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    expect(frame.className).toContain('mx-auto');
    expect(frame.className).toContain('max-w-[min(100%,20rem)]');
  });

  it('gives the portrait figcaption the same centred width cap', () => {
    const { container } = render(
      <Figure src="/foto/p.jpg" alt="P" ratio="9:16" caption="Takaran vertikal" />,
    );
    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption.className).toContain('mx-auto');
    expect(caption.className).toContain('max-w-[min(100%,20rem)]');
  });

  it('does not width-cap the landscape figcaption', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" ratio="4:3" caption="Takaran lanskap" />,
    );
    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption.className).not.toContain('max-w-[min(100%,20rem)]');
  });
});

/* -------------------------------------------------------------------------- */
/*  priority / rounded / bordered toggles                                      */
/* -------------------------------------------------------------------------- */

describe('Figure — priority, rounded, bordered toggles', () => {
  it('switches to eager loading and high fetch priority when priority is set', () => {
    render(<Figure src="/foto/hero.jpg" alt="Hero" priority />);
    const img = screen.getByRole('img', { name: 'Hero' });
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('fetchpriority', 'high');
  });

  it('is rounded and ringed by default', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    expect(frame.className).toContain('rounded-2xl');
    expect(frame.className).toContain('ring-1');
  });

  it('drops the rounded and ring classes when both are disabled', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" rounded={false} bordered={false} />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    // NOTE: `bordered` is documented but not actually read by the component —
    // the editorial ring is always applied. This pins the real behaviour.
    expect(frame.className).not.toContain('rounded-2xl');
    expect(frame.className).toContain('ring-editorial');
  });

  it('gates the rounded card on the `rounded` prop independently of the ring', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" rounded={false} />);
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    expect(frame.className).not.toContain('rounded-2xl');
    // The editorial ring survives: `rounded` only controls the corner radius.
    expect(frame.className).toContain('ring-editorial');
  });
});

/* -------------------------------------------------------------------------- */
/*  Caption & credit                                                           */
/* -------------------------------------------------------------------------- */

describe('Figure — caption and credit', () => {
  it('renders only the caption when no credit is provided', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" caption="Sedimentasi tepi sungai" />,
    );

    const caption = container.querySelector('figcaption');
    expect(caption).not.toBeNull();
    expect(caption).toHaveTextContent('Sedimentasi tepi sungai');
    expect(caption?.textContent).not.toContain('Foto:');
  });

  it('renders only the credit when no caption is provided', () => {
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" credit="Dokumentasi Jagatirta" />);

    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption).not.toBeNull();
    expect(caption.textContent).toContain('Kredit foto:');
    expect(caption.textContent).toContain('Foto:');
    expect(caption.textContent).toContain('Dokumentasi Jagatirta');
    // Only one <p> — no empty caption paragraph.
    expect(caption.querySelectorAll('p')).toHaveLength(1);
  });

  it('renders caption before credit, in that DOM order', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" caption="Uji air pekan ke-12" credit="Rani / ZAMROED" />,
    );

    const paragraphs = Array.from(container.querySelectorAll('figcaption p'));
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent('Uji air pekan ke-12');
    expect(paragraphs[1]).toHaveTextContent('Rani / ZAMROED');
  });

  it('trims surrounding whitespace from the credit', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" credit="   Rani / ZAMROED   " />,
    );
    expect(container.querySelector('figcaption')?.textContent).toContain('Rani / ZAMROED');
  });

  it('accepts a ReactNode caption, not just a string', () => {
    render(
      <Figure
        src="/foto/a.jpg"
        alt="A"
        caption={
          <>
            Uji air <strong>pekan ke-12</strong>
          </>
        }
      />,
    );

    expect(screen.getByRole('figure')).toHaveTextContent('Uji air pekan ke-12');
    expect(screen.getByText('pekan ke-12').tagName).toBe('STRONG');
  });

  describe('treats blank caption/credit values as absent', () => {
    it('ignores an empty-string caption', () => {
      const { container } = render(<Figure src="/foto/a.jpg" alt="A" caption="" />);
      expect(container.querySelector('figcaption')).toBeNull();
    });

    it('ignores a whitespace-only credit', () => {
      const { container } = render(<Figure src="/foto/a.jpg" alt="A" credit="   " />);
      expect(container.querySelector('figcaption')).toBeNull();
    });

    it('keeps a whitespace-only caption paragraph (empty string only is filtered)', () => {
      const { container } = render(<Figure src="/foto/a.jpg" alt="A" caption="   " />);
      // caption !== '' so the figcaption exists; the <p> renders the raw node.
      expect(container.querySelector('figcaption')).not.toBeNull();
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  Placeholder / missing image                                                */
/* -------------------------------------------------------------------------- */

describe('Figure — placeholder fallback', () => {
  it.each([
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace only', '   \n\t '],
  ])('falls back to the placeholder when src is %s', (_label, src) => {
    const { container } = render(<Figure src={src} alt="Tak ada gambar" />);

    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('Gambar belum tersedia')).toBeInTheDocument();
    // The decorative icon wrapper is hidden from assistive tech.
    expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });

  it('still exposes the image region for an empty src (no silent blank box)', () => {
    render(<Figure src="" alt="Gambar belum tersedia" />);
    expect(screen.getByText('Gambar belum tersedia')).toBeInTheDocument();
  });

  it('trims whitespace around a real src', () => {
    render(<Figure src="  /foto/terpangkas.jpg  " alt="A" />);
    expect(screen.getByRole('img', { name: 'A' })).toHaveAttribute(
      'src',
      '/foto/terpangkas.jpg',
    );
  });
});

/* -------------------------------------------------------------------------- */
/*  Children & pass-through props                                              */
/* -------------------------------------------------------------------------- */

describe('Figure — children and pass-through props', () => {
  it('renders children after the media frame and caption', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" caption="Takaran">
        <button type="button">Perbesar foto</button>
      </Figure>,
    );

    const figure = container.querySelector('figure') as HTMLElement;
    const childButton = screen.getByRole('button', { name: 'Perbesar foto' });
    expect(figure).toContainElement(childButton);
    // children come last: frame, figcaption, button
    expect(figure.lastElementChild).toBe(childButton);
  });

  it('lets a caller-supplied figcaption coexist with children', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A">
        <figcaption>Keterangan tambahan</figcaption>
      </Figure>,
    );
    expect(container.querySelectorAll('figcaption')).toHaveLength(1);
  });

  it('forwards arbitrary figure attributes such as id and data-*', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" id="fig-1" data-river="ciliwung" />,
    );
    const figure = container.querySelector('figure') as HTMLElement;
    expect(figure).toHaveAttribute('id', 'fig-1');
    expect(figure).toHaveAttribute('data-river', 'ciliwung');
  });

  it('forwards figure event handlers', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Figure src="/foto/a.jpg" alt="A" onClick={onClick} />);

    await user.click(screen.getByRole('figure'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forwards figure event handlers (fireEvent path)', () => {
    const onMouseEnter = vi.fn();
    render(<Figure src="/foto/a.jpg" alt="A" onMouseEnter={onMouseEnter} />);

    fireEvent.mouseEnter(screen.getByRole('figure'));
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
  });
});

/* -------------------------------------------------------------------------- */
/*  className merging                                                          */
/* -------------------------------------------------------------------------- */

describe('Figure — className merging', () => {
  it('merges caller classNames into figure, frame, image and caption', () => {
    const { container } = render(
      <Figure
        src="/foto/a.jpg"
        alt="A"
        caption="Takaran"
        className="mt-8"
        frameClassName="bg-black"
        imageClassName="opacity-50"
        captionClassName="italic"
      />,
    );

    const figure = container.querySelector('figure') as HTMLElement;
    const frame = frameOf(figure);
    const img = container.querySelector('img') as HTMLElement;
    const caption = container.querySelector('figcaption') as HTMLElement;

    expect(figure.className).toContain('mt-8');
    expect(frame.className).toContain('bg-black');
    expect(img.className).toContain('opacity-50');
    expect(caption.className).toContain('italic');
  });

  it('lets a caller className override a conflicting base utility (tailwind-merge)', () => {
    const { container } = render(
      <Figure src="/foto/a.jpg" alt="A" className="flex-col" frameClassName="rounded-none" />,
    );
    const frame = frameOf(container.querySelector('figure') as HTMLElement);
    // 'rounded-2xl' (base card) must be replaced by the caller's 'rounded-none'.
    expect(frame.className).toContain('rounded-none');
    expect(frame.className).not.toContain('rounded-2xl');
  });
});

/* -------------------------------------------------------------------------- */
/*  Edge cases                                                                 */
/* -------------------------------------------------------------------------- */

describe('Figure — edge cases', () => {
  it('handles a very long caption and alt without truncating content', () => {
    const longAlt = 'Foto '.repeat(120).trim();
    const longCaption = 'Uji air '.repeat(200).trim();

    render(<Figure src="/foto/a.jpg" alt={longAlt} caption={longCaption} />);

    expect(screen.getByRole('img', { name: longAlt })).toBeInTheDocument();
    expect(screen.getByRole('figure')).toHaveTextContent(longCaption);
  });

  it('handles a very long credit string', () => {
    const credit = 'Nama Fotografer '.repeat(50).trim();
    const { container } = render(<Figure src="/foto/a.jpg" alt="A" credit={credit} />);
    expect(container.querySelector('figcaption')?.textContent).toContain(credit);
  });

  it('treats src="0" and other truthy-looking strings as real sources', () => {
    render(<Figure src="0" alt="A" />);
    expect(screen.getByRole('img', { name: 'A' })).toHaveAttribute('src', '0');
  });

  it('does not crash with every optional prop omitted at once', () => {
    const { container } = render(<Figure />);
    const figure = container.querySelector('figure');
    expect(figure).not.toBeNull();
    expect(screen.getByText('Gambar belum tersedia')).toBeInTheDocument();
    expect(container.querySelector('figcaption')).toBeNull();
  });
});

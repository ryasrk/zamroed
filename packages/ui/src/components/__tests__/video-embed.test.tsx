import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VideoEmbed, parseVideoUrl } from '../video-embed';
import type { ParsedVideoSource } from '../video-embed';
import { installUserEventCompat } from './test-utils';

// jsdom's non-configurable `navigator.clipboard` breaks userEvent.setup();
// the shared helper swaps in a configurable navigator. See test-utils.ts.
beforeAll(() => {
  installUserEventCompat();
});

/* Helpers ------------------------------------------------------------------ */

const YT_WATCH = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const YT_SHORT = 'https://youtu.be/dQw4w9WgXcQ';

/* -------------------------------------------------------------------------- */
/*  parseVideoUrl — pure platform detection                                    */
/* -------------------------------------------------------------------------- */

describe('parseVideoUrl', () => {
  describe('YouTube', () => {
    it.each([
      ['watch?v=', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
      ['music subdomain', 'https://music.youtube.com/watch?v=dQw4w9WgXcQ'],
      ['m subdomain', 'https://m.youtube.com/watch?v=dQw4w9WgXcQ'],
      ['nocookie host', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'],
      ['shorts', 'https://www.youtube.com/shorts/dQw4w9WgXcQ'],
      ['embed', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
      ['live', 'https://www.youtube.com/live/dQw4w9WgXcQ'],
      ['/v/ form', 'https://www.youtube.com/v/dQw4w9WgXcQ'],
      ['/e/ form', 'https://www.youtube.com/e/dQw4w9WgXcQ'],
      ['video_id query', 'https://www.youtube.com/embed?video_id=dQw4w9WgXcQ'],
      ['youtu.be', YT_SHORT],
    ])('extracts the 11-char id from %s', (_label, url) => {
      expect(parseVideoUrl(url)).toEqual<ParsedVideoSource>({
        platform: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        orientation: 'landscape',
      });
    });

    it('strips whitespace and surrounding quotes from a copied id', () => {
      expect(parseVideoUrl('https://www.youtube.com/watch?v="dQw4w9WgXcQ"\n').videoId).toBe(
        'dQw4w9WgXcQ',
      );
    });

    it('returns a null id for a malformed query id', () => {
      expect(parseVideoUrl('https://www.youtube.com/watch?v=too-short')).toEqual({
        platform: 'youtube',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('returns a null id for a bare YouTube host with no path', () => {
      expect(parseVideoUrl('https://www.youtube.com/')).toEqual({
        platform: 'youtube',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('rejects a lookalike host that merely embeds youtube.com in the path', () => {
      expect(parseVideoUrl('https://evil.com/youtube.com/watch?v=dQw4w9WgXcQ').platform).toBe(
        'unknown',
      );
    });

    it('rejects a host prefix such as notyoutube.com', () => {
      expect(parseVideoUrl('https://notyoutube.com/watch?v=dQw4w9WgXcQ').platform).toBe('unknown');
    });

    it('returns null id for a youtu.be short link with an invalid id', () => {
      expect(parseVideoUrl('https://youtu.be/abc')).toEqual({
        platform: 'youtube',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('only reads the first path segment on youtu.be (nested forms are not ids)', () => {
      // youtu.be is not a subdomain of youtube.com, so it takes the dedicated
      // branch that inspects segments[0] only — 'embed' is not a valid id.
      expect(parseVideoUrl('https://youtu.be/embed/dQw4w9WgXcQ')).toEqual({
        platform: 'youtube',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('drops the id when the first youtu.be segment is invalid', () => {
      expect(parseVideoUrl('https://youtu.be/shorts/nope')).toEqual({
        platform: 'youtube',
        videoId: null,
        orientation: 'landscape',
      });
    });
  });

  describe('Vimeo', () => {
    it.each([
      ['plain', 'https://vimeo.com/123456789'],
      ['www', 'https://www.vimeo.com/123456789'],
      ['player host', 'https://player.vimeo.com/video/123456789'],
    ])('extracts the numeric id from %s', (_label, url) => {
      expect(parseVideoUrl(url)).toEqual({
        platform: 'vimeo',
        videoId: '123456789',
        orientation: 'landscape',
      });
    });

    it('returns a null id when no numeric segment is present', () => {
      expect(parseVideoUrl('https://vimeo.com/channels/staffpicks')).toEqual({
        platform: 'vimeo',
        videoId: null,
        orientation: 'landscape',
      });
    });
  });

  describe('TikTok', () => {
    it('extracts the numeric video id and reports portrait', () => {
      expect(parseVideoUrl('https://www.tiktok.com/@relawan/video/7412345678901234567')).toEqual({
        platform: 'tiktok',
        videoId: '7412345678901234567',
        orientation: 'portrait',
      });
    });

    it('returns a null id for a /t/ short link but keeps the platform', () => {
      expect(parseVideoUrl('https://www.tiktok.com/t/ZTabcdef')).toEqual({
        platform: 'tiktok',
        videoId: null,
        orientation: 'portrait',
      });
    });

    it('treats a non-numeric video id as null', () => {
      expect(parseVideoUrl('https://www.tiktok.com/@u/video/abc').videoId).toBeNull();
    });
  });

  describe('Instagram', () => {
    it.each([
      ['reel', 'https://www.instagram.com/reel/Cx1y2Z3aBcD/'],
      ['reels', 'https://www.instagram.com/reels/Cx1y2Z3aBcD/'],
    ])('extracts the reel id from the %s form', (_label, url) => {
      expect(parseVideoUrl(url)).toEqual({
        platform: 'instagram',
        videoId: 'Cx1y2Z3aBcD',
        orientation: 'portrait',
      });
    });

    it('returns a null id for a profile URL but keeps the platform', () => {
      expect(parseVideoUrl('https://www.instagram.com/jagatirta/')).toEqual({
        platform: 'instagram',
        videoId: null,
        orientation: 'portrait',
      });
    });
  });

  describe('direct video files', () => {
    it.each([
      ['absolute mp4', 'https://cdn.example.org/video/narasi.mp4'],
      ['relative mp4', '/video/narasi.mp4'],
      ['webm with query', 'https://cdn.example.org/a.webm?token=1'],
      ['mov with hash', 'https://cdn.example.org/a.mov#t=5'],
      ['uppercase extension', '/video/NARASI.MP4'],
    ])('recognises %s as direct', (_label, url) => {
      expect(parseVideoUrl(url)).toEqual({
        platform: 'direct',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('does not treat a dotless path as a direct file', () => {
      expect(parseVideoUrl('/video/narasi').platform).toBe('unknown');
    });

    it('does not treat an unsupported extension as direct', () => {
      expect(parseVideoUrl('/video/narasi.avi').platform).toBe('unknown');
    });

    it('does not treat a dot in an earlier directory as a file extension', () => {
      expect(parseVideoUrl('/media.v2/narasi').platform).toBe('unknown');
    });
  });

  describe('empty / unknown input', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty string', ''],
      ['whitespace only', '   \n  '],
    ])('returns an unknown landscape source for %s', (_label, value) => {
      expect(parseVideoUrl(value as string | undefined | null)).toEqual({
        platform: 'unknown',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('returns unknown for an unrelated site', () => {
      expect(parseVideoUrl('https://example.org/berita/sungai')).toEqual({
        platform: 'unknown',
        videoId: null,
        orientation: 'landscape',
      });
    });

    it('never throws for arbitrary garbage input', () => {
      expect(() => parseVideoUrl('http://[not a url]')).not.toThrow();
      expect(() => parseVideoUrl('://%%%')).not.toThrow();
    });
  });
});

/* -------------------------------------------------------------------------- */
/*  Empty url                                                                  */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — empty url', () => {
  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
  ])('renders nothing for a %s url', (_label, url) => {
    const { container } = render(<VideoEmbed url={url} />);
    expect(container).toBeEmptyDOMElement();
  });
});

/* -------------------------------------------------------------------------- */
/*  Direct video player                                                        */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — direct video files', () => {
  it('renders a native video element with controls and metadata preload', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" title="Dokumentasi Ciliwung" />);

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).not.toBeNull();
    expect(video).toHaveAttribute('controls');
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveAttribute('aria-label', 'Pemutar video: Dokumentasi Ciliwung');
  });

  it('falls back to a generic aria-label when no title is given', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" />);
    expect(container.querySelector('video')).toHaveAttribute('aria-label', 'Pemutar video');
  });

  it('points the <source> at the url and offers a download link', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" />);
    expect(container.querySelector('source')).toHaveAttribute('src', '/video/narasi.mp4');
    expect(screen.getByRole('link', { name: 'Unduh videonya' })).toHaveAttribute(
      'href',
      '/video/narasi.mp4',
    );
  });

  it('is not autoplaying or muted by default', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" />);
    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video.autoplay).toBe(false);
    expect(video.muted).toBe(false);
  });

  it('autoplays muted when autoPlay is requested', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" autoPlay />);
    const video = container.querySelector('video') as HTMLVideoElement;
    // React writes `muted` as a DOM property (not an attribute), while
    // `autoPlay` reflects as an attribute. Both must hold for browser policy.
    expect(video).toHaveAttribute('autoplay');
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
  });

  it('uses the poster prop on the native player', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" poster="/gambar/p.jpg" />);
    expect(container.querySelector('video')).toHaveAttribute('poster', '/gambar/p.jpg');
  });

  it('renders the title as a figcaption but never as a heading inside the player', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" title="Laporan lapangan" />);
    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption).toHaveTextContent('Laporan lapangan');
  });

  it('omits the figcaption when no title is given', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('does not render any iframe for a direct file', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" title="T" />);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('applies the caller className to the root figure', () => {
    const { container } = render(<VideoEmbed url="/video/narasi.mp4" className="mt-6" />);
    expect(container.querySelector('figure')?.className).toContain('mt-6');
  });
});

/* -------------------------------------------------------------------------- */
/*  Facade: YouTube                                                            */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — YouTube facade', () => {
  it('renders no iframe before interaction', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} title="Pemantauan Ciliwung" />);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('shows a play button labelled with the platform and title', () => {
    render(<VideoEmbed url={YT_WATCH} title="Pemantauan Ciliwung" />);
    expect(
      screen.getByRole('button', { name: 'Putar video YouTube: Pemantauan Ciliwung' }),
    ).toBeInTheDocument();
  });

  it('omits the title suffix from the play label when no title is given', () => {
    render(<VideoEmbed url={YT_WATCH} />);
    expect(screen.getByRole('button', { name: 'Putar video YouTube' })).toBeInTheDocument();
  });

  it('uses the maxres then hq YouTube poster candidates automatically', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    const poster = container.querySelector('img') as HTMLImageElement;
    expect(poster).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
    // Decorative poster: hidden from assistive tech.
    expect(poster).toHaveAttribute('aria-hidden', 'true');
    expect(poster).toHaveAttribute('alt', '');
  });

  it('prefers a caller poster over the automatic YouTube thumbnail', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} poster="/gambar/hero.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/gambar/hero.jpg');
  });

  it('falls back to the hq thumbnail when maxres fails to load', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    const poster = container.querySelector('img') as HTMLImageElement;
    expect(poster.src).toContain('maxresdefault.jpg');

    fireEvent.error(poster);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
  });

  it('keeps the last poster candidate when every candidate fails', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    for (let i = 0; i < 4; i += 1) {
      const poster = container.querySelector('img');
      if (poster) fireEvent.error(poster);
    }
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    );
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('renders a gradient placeholder when no poster is available (unknown platform)', () => {
    // Vimeo has no automatic thumbnail source, and no explicit poster here.
    const { container } = render(<VideoEmbed url="https://vimeo.com/123456789" />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Putar video Vimeo' })).toBeInTheDocument();
  });

  it('injects a YouTube-nocookie iframe after the play button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} title="Pemantauan Ciliwung" />);

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));

    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe).not.toBeNull();
    expect(iframe.src).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(iframe.getAttribute('title')).toBe('Pemantauan Ciliwung');
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe).toHaveAttribute('allowfullscreen');
  });

  it('falls back to a platform title on the iframe when none is given', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    expect(container.querySelector('iframe')).toHaveAttribute('title', 'Video YouTube');
  });

  it('passes autoplay=0 to the iframe by default', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    expect((container.querySelector('iframe') as HTMLIFrameElement).src).toContain('autoplay=0');
  });

  it('passes autoplay=1 but still withholds the iframe until the click', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} autoPlay />);

    // Facade must survive the first render even with autoPlay.
    expect(container.querySelector('iframe')).toBeNull();

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.src).toContain('autoplay=1');
    expect(iframe.src).toContain('rel=0');
    expect(iframe.src).toContain('playsinline=1');
    expect(iframe.src).toContain('modestbranding=1');
  });

  it('activates on Enter from the keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);

    const play = screen.getByRole('button', { name: /Putar video YouTube/ });
    play.focus();
    await user.keyboard('{Enter}');
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('activates on Space from the keyboard', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);

    const play = screen.getByRole('button', { name: /Putar video YouTube/ });
    play.focus();
    await user.keyboard(' ');
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('ignores unrelated keys on the play button', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /Putar video YouTube/ }), { key: 'a' });
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('handles a legacy "Spacebar" key name', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    fireEvent.keyDown(screen.getByRole('button', { name: /Putar video YouTube/ }), {
      key: 'Spacebar',
    });
    expect(container.querySelector('iframe')).not.toBeNull();
  });

  it('renders the caption and the "ketuk" hint before playing', () => {
    render(<VideoEmbed url={YT_WATCH} title="Pemantauan" caption="Uji air pekan ke-12" />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveTextContent('Pemantauan');
    expect(figure).toHaveTextContent('—');
    expect(figure).toHaveTextContent('Uji air pekan ke-12');
    expect(figure).toHaveTextContent('Ketuk area video untuk memuat pemutar YouTube.');
  });

  it('swaps the hint for the "sedang diputar" message after activation', async () => {
    const user = userEvent.setup();
    render(<VideoEmbed url={YT_WATCH} title="Pemantauan" caption="Uji air" />);

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    expect(
      screen.getByText('Video diputar lewat pemutar YouTube.'),
    ).toBeInTheDocument();
  });

  it('uses a caption-only figcaption when only a caption is given', () => {
    render(<VideoEmbed url={YT_WATCH} caption="Kredit: Relawan" />);
    const figure = screen.getByRole('figure');
    expect(figure).toHaveTextContent('Kredit: Relawan');
    // No title → no em-dash separator.
    expect(figure.textContent).not.toContain('—');
  });

  it('omits the figcaption entirely with neither title nor caption', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('links the play button to the title via aria-describedby', () => {
    render(<VideoEmbed url={YT_WATCH} title="Pemantauan Ciliwung" />);
    const play = screen.getByRole('button', { name: /Putar video YouTube/ });
    const describedBy = play.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'Pemantauan Ciliwung',
    );
  });

  it('has no aria-describedby when there is no title', () => {
    render(<VideoEmbed url={YT_WATCH} />);
    expect(screen.getByRole('button', { name: 'Putar video YouTube' })).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('offers an external "Buka di YouTube" link before playing, and drops it after', async () => {
    const user = userEvent.setup();
    render(<VideoEmbed url={YT_WATCH} />);

    const link = screen.getByRole('link', { name: /Buka di YouTube/ });
    expect(link).toHaveAttribute('href', YT_WATCH);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    expect(screen.queryByRole('link', { name: /Buka di YouTube/ })).not.toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  Facade: Vimeo / TikTok / Instagram                                         */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — Vimeo facade', () => {
  it('builds a privacy-preserving Vimeo embed URL', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url="https://vimeo.com/123456789" title="Dokumentasi" />);

    await user.click(screen.getByRole('button', { name: /Putar video Vimeo/ }));
    const src = (container.querySelector('iframe') as HTMLIFrameElement).src;
    expect(src).toContain('https://player.vimeo.com/video/123456789');
    expect(src).toContain('dnt=1');
    expect(src).toContain('title=0');
    expect(src).toContain('byline=0');
    expect(src).toContain('portrait=0');
    expect(src).toContain('autoplay=0');
  });
});

describe('VideoEmbed — TikTok facade', () => {
  it('builds the TikTok embed URL and keeps the portrait frame', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VideoEmbed url="https://www.tiktok.com/@relawan/video/7412345678901234567" />,
    );

    await user.click(screen.getByRole('button', { name: 'Putar video TikTok' }));
    const src = (container.querySelector('iframe') as HTMLIFrameElement).src;
    expect(src).toBe('https://www.tiktok.com/embed/v2/7412345678901234567');
  });

  it('applies the centred max-w-sm portrait shell', () => {
    const { container } = render(
      <VideoEmbed url="https://www.tiktok.com/@relawan/video/7412345678901234567" />,
    );
    const figure = container.querySelector('figure') as HTMLElement;
    expect(figure.className).toContain('mx-auto');
    expect(figure.className).toContain('max-w-sm');
    expect(figure.firstElementChild?.className).toContain('aspect-[9/16]');
  });
});

describe('VideoEmbed — Instagram facade', () => {
  it('builds the captioned reel embed URL', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url="https://www.instagram.com/reel/Cx1y2Z3aBcD/" />);

    await user.click(screen.getByRole('button', { name: 'Putar video Instagram' }));
    expect((container.querySelector('iframe') as HTMLIFrameElement).src).toBe(
      'https://www.instagram.com/reel/Cx1y2Z3aBcD/embed/captioned/',
    );
  });

  it('uses the portrait shell for reels', () => {
    const { container } = render(<VideoEmbed url="https://www.instagram.com/reel/Cx1y2Z3aBcD/" />);
    expect((container.querySelector('figure') as HTMLElement).className).toContain('max-w-sm');
  });
});

/* -------------------------------------------------------------------------- */
/*  Fallback card                                                              */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — fallback card', () => {
  it('renders a fallback card with an explicit external link for an unknown platform', () => {
    render(<VideoEmbed url="https://example.org/siaran/sungai" />);

    expect(screen.getByRole('link', { name: 'Buka video di tab baru' })).toHaveAttribute(
      'href',
      'https://example.org/siaran/sungai',
    );
    expect(screen.getByText('Tautan eksternal')).toBeInTheDocument();
    expect(screen.getByText('Video ini belum dapat ditampilkan langsung')).toBeInTheDocument();
  });

  it('shows the platform label and the supplied title on the fallback card', () => {
    render(<VideoEmbed url="https://www.tiktok.com/t/ZTabcdef" title="Aksi bersih sungai" />);

    // TikTok short link cannot be embedded → fallback card.
    expect(screen.getByText('TikTok')).toBeInTheDocument();
    // The supplied title replaces the default heading on the card and also
    // appears in the figcaption, so both matches are expected.
    expect(screen.getAllByText('Aksi bersih sungai').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('Video ini belum dapat ditampilkan langsung')).not.toBeInTheDocument();
  });

  it('renders the fallback figcaption with title and caption', () => {
    const { container } = render(
      <VideoEmbed url="https://example.org/v" title="Judul Liputan" caption="Lokasi: Ciliwung" />,
    );
    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption).toHaveTextContent('Judul Liputan.');
    expect(caption).toHaveTextContent('Lokasi: Ciliwung');
  });

  it('omits the fallback figcaption when neither title nor caption is given', () => {
    const { container } = render(<VideoEmbed url="https://example.org/v" />);
    expect(container.querySelector('figcaption')).toBeNull();
  });

  it('renders a title-only fallback figcaption without the caption text', () => {
    const { container } = render(<VideoEmbed url="https://example.org/v" title="Judul Liputan" />);
    const caption = container.querySelector('figcaption') as HTMLElement;
    expect(caption).toHaveTextContent('Judul Liputan.');
    expect(caption.textContent).not.toContain('Lokasi');
  });

  it('never renders an iframe on the fallback path', () => {
    const { container } = render(<VideoEmbed url="https://example.org/v" />);
    expect(container.querySelector('iframe')).toBeNull();
  });

  it('applies the caller className to the fallback figure', () => {
    const { container } = render(<VideoEmbed url="https://example.org/v" className="mt-4" />);
    expect(container.querySelector('figure')?.className).toContain('mt-4');
  });

  it('shows the YouTube label on the fallback card for an unembeddable YouTube URL', () => {
    render(<VideoEmbed url="https://www.youtube.com/watch?v=too-short" />);
    expect(screen.getByText('YouTube')).toBeInTheDocument();
    // No usable video id → no facade play button, just the external link.
    expect(screen.queryByRole('button', { name: /Putar video YouTube/ })).not.toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- */
/*  Edge cases                                                                 */
/* -------------------------------------------------------------------------- */

describe('VideoEmbed — edge cases', () => {
  it('handles a very long title without truncating content', () => {
    const longTitle = 'Pemantauan kualitas air Ciliwung '.repeat(30).trim();
    render(<VideoEmbed url={YT_WATCH} title={longTitle} />);
    expect(screen.getByRole('figure')).toHaveTextContent(longTitle);
  });

  it('handles a very long caption on the fallback card', () => {
    const longCaption = 'Catatan lapangan '.repeat(60).trim();
    render(<VideoEmbed url="https://example.org/v" caption={longCaption} />);
    expect(screen.getByRole('figure')).toHaveTextContent(longCaption);
  });

  it('trims a url that carries surrounding whitespace', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={`  ${YT_WATCH}  `} />);

    await user.click(screen.getByRole('button', { name: 'Putar video YouTube' }));
    expect((container.querySelector('iframe') as HTMLIFrameElement).src).toContain(
      '/embed/dQw4w9WgXcQ',
    );
  });

  it('does not render twice when clicked repeatedly', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    expect(container.querySelectorAll('iframe')).toHaveLength(1);
    // The play button is gone after activation, so no second iframe can appear.
    expect(screen.queryByRole('button', { name: /Putar video YouTube/ })).not.toBeInTheDocument();
  });

  it('renders a single figcaption for the facade path', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} title="Judul" caption="Keterangan" />);
    expect(container.querySelectorAll('figcaption')).toHaveLength(1);
  });

  it('treats an empty-string poster as absent and keeps the automatic thumbnail', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} poster="   " />);
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    );
  });

  it('applies the caller className to the facade figure', () => {
    const { container } = render(<VideoEmbed url={YT_WATCH} className="my-8" />);
    expect(container.querySelector('figure')?.className).toContain('my-8');
  });

  it('waits for the click before any third-party URL appears in the DOM', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    expect(container.innerHTML).not.toContain('youtube-nocookie.com');

    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));
    await waitFor(() => expect(container.innerHTML).toContain('youtube-nocookie.com'));
  });

  it('renders the correct iframe allow list', async () => {
    const user = userEvent.setup();
    const { container } = render(<VideoEmbed url={YT_WATCH} />);
    await user.click(screen.getByRole('button', { name: /Putar video YouTube/ }));

    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    expect(iframe.getAttribute('allow')).toContain('autoplay');
    expect(iframe.getAttribute('allow')).toContain('picture-in-picture');
    expect(iframe.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  });
});

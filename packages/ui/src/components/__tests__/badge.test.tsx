import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge, RiverStatusBadge, type BadgeTone } from '../badge';

const TONES: BadgeTone[] = ['neutral', 'primary', 'success', 'warning', 'danger'];

describe('Badge', () => {
  it('renders children as a span with the default neutral look', () => {
    render(<Badge>Pemantauan</Badge>);

    const badge = screen.getByText('Pemantauan');
    expect(badge).toBeInTheDocument();
    expect(badge.tagName).toBe('SPAN');
    expect(badge.closest('span')).toBe(badge);
  });

  it('renders every documented tone without losing the text', () => {
    for (const tone of TONES) {
      const { unmount } = render(<Badge tone={tone}>{`nada-${tone}`}</Badge>);

      const badge = screen.getByText(`nada-${tone}`);
      expect(badge).toBeInTheDocument();
      // Tone is applied through class tokens only; assert the structure, not CSS.
      expect(badge.closest('span[class]')).not.toBeNull();

      unmount();
    }
  });

  it('renders a decorative dot that is hidden from assistive tech', () => {
    const { container } = render(<Badge dot>Sehat</Badge>);

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(1);

    // The dot wrapper holds the two painted circles.
    const painted = dots[0].querySelectorAll('span');
    expect(painted).toHaveLength(1);

    // No pulse ring when pulse is not requested.
    expect(painted[0].className).not.toContain('animate-pulse-ring');
  });

  it('adds an animated pulse ring layer when pulse and dot are both set', () => {
    const { container } = render(
      <Badge dot pulse>
        Kritis
      </Badge>,
    );

    const dotWrapper = container.querySelector('[aria-hidden="true"]')!;
    const layers = dotWrapper.querySelectorAll('span');
    expect(layers).toHaveLength(2);
    expect(layers[0].className).toContain('animate-pulse-ring');
  });

  it('renders an icon inside an aria-hidden wrapper alongside the label', () => {
    render(
      <Badge icon={<svg data-testid="ikon" />} dot>
        Dengan Ikon
      </Badge>,
    );

    const iconWrapper = screen.getByTestId('ikon').parentElement!;
    expect(iconWrapper).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Dengan Ikon')).toBeInTheDocument();
  });

  it('renders as a focusable anchor when href is provided', () => {
    render(<Badge href="/sungai/ciliwung">Ciliwung</Badge>);

    const link = screen.getByRole('link', { name: 'Ciliwung' });
    expect(link).toHaveAttribute('href', '/sungai/ciliwung');
    expect(link.tagName).toBe('A');
  });

  it('keeps anchor-only attributes away from the span rendering path', () => {
    render(
      <Badge data-testid="badge" title="Meta badge">
        Span Badge
      </Badge>,
    );

    expect(screen.getByTestId('badge')).toHaveAttribute('title', 'Meta badge');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('forwards extra props and merges a custom className', () => {
    render(
      <Badge className="kelas-tambahan" data-testid="badge" id="badge-1">
        Kustom
      </Badge>,
    );

    const badge = screen.getByTestId('badge');
    expect(badge).toHaveAttribute('id', 'badge-1');
    expect(badge.className).toContain('kelas-tambahan');
  });

  it('renders an empty badge without crashing when there are no children', () => {
    const { container } = render(<Badge />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  it('keeps very long labels in a single truncating span', () => {
    const long = 'Sungai '.repeat(80).trim();
    render(<Badge>{long}</Badge>);

    const label = screen.getByText(long);
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('SPAN');
  });
});

describe('RiverStatusBadge', () => {
  it.each([
    ['good', 'Sehat'],
    ['warning', 'Waspada'],
    ['critical', 'Kritis'],
  ] as const)('maps status %s to the label "%s"', (status, label) => {
    render(<RiverStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('pulses automatically for the critical status', () => {
    const { container } = render(<RiverStatusBadge status="critical" />);

    const dotWrapper = container.querySelector('[aria-hidden="true"]')!;
    const layers = dotWrapper.querySelectorAll('span');
    expect(layers).toHaveLength(2);
    expect(layers[0].className).toContain('animate-pulse-ring');
  });

  it('does not pulse for good status by default', () => {
    const { container } = render(<RiverStatusBadge status="good" />);

    const dotWrapper = container.querySelector('[aria-hidden="true"]')!;
    expect(dotWrapper.querySelectorAll('span')).toHaveLength(1);
  });

  it('honours an explicit pulse override on a non-critical status', () => {
    const { container } = render(<RiverStatusBadge status="warning" pulse />);

    const dotWrapper = container.querySelector('[aria-hidden="true"]')!;
    expect(dotWrapper.querySelectorAll('span')).toHaveLength(2);
  });

  it('does not pulse when critical status opts out with pulse={false}', () => {
    const { container } = render(<RiverStatusBadge status="critical" pulse={false} />);

    const dotWrapper = container.querySelector('[aria-hidden="true"]')!;
    expect(dotWrapper.querySelectorAll('span')).toHaveLength(1);
  });

  it('uses the custom label when supplied', () => {
    render(<RiverStatusBadge status="good" label="IKA 78 — Sehat" />);

    expect(screen.getByText('IKA 78 — Sehat')).toBeInTheDocument();
    expect(screen.queryByText('Sehat')).not.toBeInTheDocument();
  });

  it('forwards a custom className onto the rendered badge', () => {
    const { container } = render(
      <RiverStatusBadge status="warning" label="Waspada" className="kelas-status" />,
    );

    const shell = container.querySelector('span[class]')!;
    expect(shell.className).toContain('kelas-status');
    expect(shell).toHaveTextContent('Waspada');
  });
});

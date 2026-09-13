import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

/**
 * Shared jsdom setup for every component test in the monorepo.
 * Keeps jsdom honest about the browser APIs our components touch.
 */

afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia; components respect prefers-reduced-motion.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// IntersectionObserver drives StatCounter, LiveIndicator and the history timeline.
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
      this
    );
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// ResizeObserver is used by auto-resizing textareas.
class MockResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Leaflet and copy-to-clipboard paths need these to exist.
if (!window.scrollTo) {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: vi.fn() });
}

// userEvent installs its own clipboard stub and needs to be able to redefine
// this property, so it must be configurable.
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
}

if (!window.requestAnimationFrame) {
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    value: (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 0),
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    value: (id: number) => clearTimeout(id),
  });
}

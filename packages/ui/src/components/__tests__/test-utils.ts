/**
 * Shared test helper for the workspace jsdom environment.
 *
 * jsdom @25 declares `navigator.clipboard` as a non-configurable own property of
 * the navigator instance, while `@testing-library/user-event` 14.6 tries to
 * redefine it inside `userEvent.setup()` (and to delete it during cleanup).
 * Both operations throw `TypeError: Cannot redefine property: clipboard`,
 * which makes every interaction-based test fail before it reaches a component.
 *
 * Replacing the whole navigator with a configurable shallow copy — which is
 * what the shared setup file becomes once these two offenders are neutralised —
 * lets user-event install and restore its clipboard stub normally.
 *
 * Call `installUserEventCompat()` from a file-level `beforeAll` in any test file
 * that drives interactions with user-event.
 */
import { vi } from 'vitest';

const CLIPBOARD_STUB = {
  writeText: () => Promise.resolve(),
  readText: () => Promise.resolve(''),
  write: () => Promise.resolve(),
  read: () => Promise.resolve([]),
};

export function installUserEventCompat(): void {
  const original = navigator as Navigator & Record<string, unknown>;
  const clone = Object.create(Object.getPrototypeOf(original)) as Navigator & Record<string, unknown>;

  // Carry every enumerable data property over; leave the accessor-based ones on
  // the shared prototype so `userAgent`, `language`, etc. keep working.
  for (const key of Object.getOwnPropertyNames(original)) {
    if (key === 'clipboard') continue;
    const descriptor = Object.getOwnPropertyDescriptor(original, key);
    if (descriptor && 'value' in descriptor && descriptor.configurable) {
      Object.defineProperty(clone, key, { ...descriptor, configurable: true });
    }
  }

  Object.defineProperty(clone, 'clipboard', {
    configurable: true,
    writable: true,
    value: { ...CLIPBOARD_STUB },
  });

  vi.stubGlobal('navigator', clone);
}

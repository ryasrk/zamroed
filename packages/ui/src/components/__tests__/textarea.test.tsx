import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Textarea } from '../textarea';

/**
 * The shared jsdom setup defines `navigator.clipboard` as a non-configurable own
 * property, so `userEvent.setup()` throws in `attachClipboardStubToView`. The
 * direct per-call API skips that clipboard attach and works here.
 */
const user = userEvent;

/** Gives the textarea a non-zero `scrollHeight`, which jsdom always reports as 0. */
function setScrollHeight(el: HTMLElement, value: number) {
  Object.defineProperty(el, 'scrollHeight', { value, configurable: true, writable: true });
}

function textareaOf(label: string | RegExp): HTMLTextAreaElement {
  return screen.getByLabelText(label) as HTMLTextAreaElement;
}

function describedElement(field: HTMLElement): HTMLElement {
  const id = field.getAttribute('aria-describedby');
  expect(id, 'field harus punya aria-describedby').toBeTruthy();
  const node = document.getElementById(id!);
  expect(node, `elemen #${id} harus ada`).not.toBeNull();
  return node as HTMLElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Textarea — render dasar', () => {
  it('renders the minimal happy path with an explicit label pairing', () => {
    render(<Textarea label="Catatan lapangan" />);

    const field = textareaOf('Catatan lapangan');
    const label = screen.getByText('Catatan lapangan').closest('label')!;

    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('rows', '4');
    expect(field).not.toBeRequired();
    expect(field).not.toBeDisabled();
    expect(field).not.toHaveAttribute('readonly');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(label).toHaveAttribute('for', field.id);
    // Scaling/y-scroll behaviour comes from the class contract, not from props.
    expect(field.className).toContain('resize-y');
    expect(field).not.toHaveAttribute('data-autoresize');
    expect(field).not.toHaveAttribute('data-at-max');
  });

  it('honours caller id, name, rows, placeholder and autocomplete', () => {
    render(
      <Textarea
        label="Catatan"
        id="catatan-1"
        name="catatan"
        rows={7}
        placeholder="Tulis di sini"
        autoComplete="off"
      />,
    );

    const field = textareaOf('Catatan');
    expect(field).toHaveAttribute('id', 'catatan-1');
    expect(field).toHaveAttribute('name', 'catatan');
    expect(field).toHaveAttribute('rows', '7');
    expect(field).toHaveAttribute('placeholder', 'Tulis di sini');
    expect(field).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByText('Catatan').closest('label')).toHaveAttribute('for', 'catatan-1');
  });

  it('initialises the character count from defaultValue', () => {
    render(<Textarea label="Catatan" defaultValue="Banjir" showCounter />);

    expect(textareaOf('Catatan')).toHaveValue('Banjir');
    expect(screen.getByText('6 karakter')).toBeInTheDocument();
    expect(screen.getByText('Terisi 6 karakter.')).toBeInTheDocument();
  });

  it('passes className to the wrapper and textareaClassName to the control', () => {
    const { container } = render(
      <Textarea label="Catatan" className="kolom-catatan" textareaClassName="area-catatan" />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const field = textareaOf('Catatan');

    expect(wrapper.className).toContain('kolom-catatan');
    expect(field.className).toContain('area-catatan');
    expect(field).not.toHaveClass('kolom-catatan');
  });

  it('forwards a ref to the underlying textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea label="Catatan" ref={ref} />);

    expect(ref.current).toBe(textareaOf('Catatan'));
  });

  it('keeps a hidden label available to assistive tech', () => {
    const { container } = render(<Textarea label="Catatan rahasia" hideLabel />);

    expect(container.querySelector('label')!.className).toContain('sr-only');
    expect(screen.getByLabelText('Catatan rahasia')).toBeInTheDocument();
  });

  it('marks required fields in both the DOM and the accessible name', () => {
    const { container } = render(<Textarea label="Catatan" required />);

    const field = textareaOf(/^Catatan/);
    expect(field).toBeRequired();
    expect(field).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('(wajib diisi)')).toBeInTheDocument();

    const asterisk = Array.from(container.querySelectorAll('label span')).find(
      (node) => node.textContent === '*',
    );
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('reflects readOnly both natively and via aria-readonly', () => {
    render(<Textarea label="Catatan" readOnly />);

    const field = textareaOf('Catatan');
    expect(field).toHaveAttribute('readonly');
    expect(field).toHaveAttribute('aria-readonly', 'true');
  });

  it('blocks input while disabled', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Catatan" disabled onChange={onChange} showClearButton defaultValue="Isi" />);

    const field = textareaOf('Catatan');
    expect(field).toBeDisabled();

    await user.type(field, 'x');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Hapus' })).toBeDisabled();
  });
});

describe('Textarea — pesan error dan petunjuk', () => {
  it('shows a hint and links it through aria-describedby', () => {
    render(<Textarea label="Catatan" hint="Sertakan waktu dan lokasi." />);

    const field = textareaOf('Catatan');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(describedElement(field)).toHaveTextContent('Sertakan waktu dan lokasi.');
  });

  it('ignores whitespace-only hints', () => {
    render(<Textarea label="Catatan" hint="  " />);

    expect(textareaOf('Catatan')).not.toHaveAttribute('aria-describedby');
  });

  it('switches to the error state with aria-invalid and an error icon', () => {
    render(<Textarea label="Catatan" error="Wajib diisi" />);

    const field = textareaOf('Catatan');
    const message = describedElement(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(message).toHaveTextContent('Wajib diisi');
    expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(field.className).toContain('border-status-critical');
  });

  it('lets a real error replace the hint while keeping one described element', () => {
    const { rerender } = render(<Textarea label="Catatan" hint="Tulis singkat." />);

    const describedId = textareaOf('Catatan').getAttribute('aria-describedby');
    rerender(<Textarea label="Catatan" hint="Tulis singkat." error="Terlalu pendek" />);

    const field = textareaOf('Catatan');
    expect(screen.queryByText('Tulis singkat.')).not.toBeInTheDocument();
    expect(field).toHaveAttribute('aria-describedby', describedId);
    expect(describedElement(field)).toHaveTextContent('Terlalu pendek');
  });

  it('falls back to the hint when the error is only whitespace', () => {
    render(<Textarea label="Catatan" error="   " hint="Boleh kosong." />);

    const field = textareaOf('Catatan');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(describedElement(field)).toHaveTextContent('Boleh kosong.');
  });

  it('handles a very long error message without losing the association', () => {
    const longError = `Catatan terlalu panjang. ${'Ulangi bagian ini. '.repeat(40)}`.trim();
    render(<Textarea label="Catatan" error={longError} />);

    expect(describedElement(textareaOf('Catatan'))).toHaveTextContent(longError);
  });
});

describe('Textarea — penghitung karakter', () => {
  it('counts without a limit and localises the number in Indonesian', () => {
    render(<Textarea label="Catatan" defaultValue="Sungai Citarum" showCounter />);

    expect(screen.getByText('14 karakter')).toBeInTheDocument();
    expect(screen.getByText('Terisi 14 karakter.')).toBeInTheDocument();
    expect(screen.getByText('Tanpa batas karakter.')).toBeInTheDocument();
  });

  it('formats thousands with an Indonesian separator', () => {
    const long = 'a'.repeat(1234);
    render(<Textarea label="Catatan" defaultValue={long} showCounter />);

    expect(screen.getByText('1.234 karakter')).toBeInTheDocument();
  });

  it('shows remaining quota, a heavy border and the "limit reached" copy', () => {
    render(<Textarea label="Catatan" defaultValue="12345" maxLength={10} showCounter />);

    const field = textareaOf('Catatan');
    expect(field).toHaveAttribute('maxlength', '10');
    expect(screen.getByText('5 / 10 karakter · sisa 5')).toBeInTheDocument();
    expect(screen.getByText('Teks panjang tetap terbaca utuh.')).toBeInTheDocument();

    // The counter carries the quota to screen readers, never a negative number.
    const counter = screen.getByText('Terisi 5 dari 10 karakter, sisa 5.');
    expect(counter).toBeInTheDocument();
    expect(screen.getByText('5 / 10 karakter · sisa 5')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reaches the limit state exactly at maxLength', () => {
    render(<Textarea label="Catatan" defaultValue="1234567890" maxLength={10} showCounter />);

    expect(screen.getByText('10 / 10 karakter · sisa 0')).toBeInTheDocument();
    expect(
      screen.getByText('Batas karakter tercapai — perpendek pesan untuk menambah lagi.'),
    ).toBeInTheDocument();
    // `maxlength` still caps the DOM node itself.
    expect(textareaOf('Catatan')).toHaveAttribute('maxlength', '10');
  });

  it('truncates a fractional maxLength and never shows a negative remainder', () => {
    render(<Textarea label="Catatan" defaultValue="abc" maxLength={3.9} showCounter />);

    expect(textareaOf('Catatan')).toHaveAttribute('maxlength', '3');
    expect(screen.getByText('3 / 3 karakter · sisa 0')).toBeInTheDocument();
  });

  it('treats defective maxLength values (0, negative, NaN, Infinity) as no limit', () => {
    const defective = [0, -5, Number.NaN, Number.POSITIVE_INFINITY];
    const { container } = render(<Textarea label="Catatan" defaultValue="abc" showCounter />);

    for (const maxLength of defective) {
      const { unmount } = render(
        <Textarea label="Catatan-x" defaultValue="abc" maxLength={maxLength} showCounter />,
      );

      const field = textareaOf('Catatan-x');
      expect(field).not.toHaveAttribute('maxlength');
      expect(field.className).not.toContain('border-status-critical');
      unmount();
    }

    // No limit means plain counting, not "0 / NaN".
    expect(container.textContent).toContain('Tanpa batas karakter.');
    expect(container.textContent).not.toContain('NaN');
  });

  it('warns once the remaining quota drops into the last 10%', async () => {
    render(<Textarea label="Catatan" showCounter maxLength={100} />);

    const field = textareaOf('Catatan');
    await user.type(field, 'a'.repeat(91));

    // 91/100 leaves 9 characters — below the 10% threshold: warning, not critical.
    const counter = screen.getByText('91 / 100 karakter · sisa 9').closest('[data-counter]')!;
    expect(counter.className).toContain('text-status-warning');
    expect(counter).not.toHaveClass('text-status-critical');
    expect(screen.getByText('Teks panjang tetap terbaca utuh.')).toBeInTheDocument();
  });

  it('goes critical when the field already carries an error', () => {
    render(<Textarea label="Catatan" defaultValue="abc" showCounter error="Wajib diisi" />);

    expect(screen.getByText('3 karakter').closest('[data-counter]')!.className).toContain(
      'text-status-critical',
    );
  });

  it('updates the live count while typing and normalises CRLF', async () => {
    render(<Textarea label="Catatan" showCounter showClearButton />);

    const field = textareaOf('Catatan');
    await user.type(field, 'Halo');

    expect(screen.getByText('4 karakter')).toBeInTheDocument();
    // The clear button appears only once there is real content.
    expect(screen.getByRole('button', { name: 'Hapus' })).toBeInTheDocument();

    // React writes the CRLF value straight to the node, so the count includes
    // both control characters — the counter tracks the node it measures.
    render(<Textarea label="Catatan kedua" defaultValue="a\r\nb" showCounter />);
    expect(textareaOf('Catatan kedua').value).toHaveLength(6);
    expect(screen.getByText('6 karakter')).toBeInTheDocument();
  });
});

describe('Textarea — tombol hapus', () => {
  it('stays hidden until there is non-whitespace content', () => {
    render(<Textarea label="Catatan" showClearButton defaultValue="   " />);
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
  });

  it('clears the field, reports through onChange and returns focus', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Catatan" showClearButton defaultValue="Laporan" onChange={onChange} />);

    const field = textareaOf('Catatan');
    const clear = screen.getByRole('button', { name: 'Hapus' });

    await user.click(clear);

    expect(field).toHaveValue('');
    expect(field).toHaveFocus();
    // Clearing is a DOM-only reset by design: no change event is synthesised.
    expect(onChange).not.toHaveBeenCalled();
    // The action disappears together with the content it clears.
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument();
  });

  it('does nothing when readOnly', async () => {
    render(<Textarea label="Catatan" showClearButton readOnly defaultValue="Laporan" />);

    const field = textareaOf('Catatan');
    await user.click(screen.getByRole('button', { name: 'Hapus' }));

    expect(field).toHaveValue('Laporan');
  });

  it('resets the DOM node even for a controlled value, then lets React restore it', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Catatan" showClearButton value="Tetap" onChange={onChange} />);

    const field = textareaOf('Catatan');
    expect(field).toHaveValue('Tetap');

    await user.click(screen.getByRole('button', { name: 'Hapus' }));
    expect(onChange).not.toHaveBeenCalled();

    // Nothing in the render updated, so the controlled prop must win again.
    await user.type(field, ' ');
    expect(field).toHaveValue('Tetap');
  });
});

describe('Textarea — event handlers', () => {
  it('forwards onChange, onInput and onScroll to the caller', async () => {
    const onChange = vi.fn();
    const onInput = vi.fn();
    const onScroll = vi.fn();

    render(<Textarea label="Catatan" onChange={onChange} onInput={onInput} onScroll={onScroll} />);
    const field = textareaOf('Catatan');

    await user.type(field, 'Hujan deras');

    expect(onChange).toHaveBeenCalledTimes('Hujan deras'.length);
    expect(onInput).toHaveBeenCalledTimes('Hujan deras'.length);
    expect(field).toHaveValue('Hujan deras');

    // jsdom never fires scroll on its own; dispatch it explicitly.
    field.dispatchEvent(new Event('scroll', { bubbles: false }));
    expect(onScroll).toHaveBeenCalledTimes(1);
  });

  it('submits the form on Ctrl+Enter but not on a plain Enter', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit} aria-label="form-laporan">
        <Textarea label="Catatan" name="catatan" />
        <button type="submit">Kirim</button>
      </form>,
    );

    const field = textareaOf('Catatan');
    field.focus();
    const submit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit');

    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(submit).not.toHaveBeenCalled();

    // A multi-line value must never be swallowed by the shortcut, so the
    // browser's own newline insertion stays available.
    field.value = 'baris\nbaris';
    const multilineKeydown = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    field.dispatchEvent(multilineKeydown);
    expect(multilineKeydown.defaultPrevented).toBe(false);

    // A later click on the real submit button reaches the form handler and
    // confirms the shortcut never swallowed the textarea's own Enter behaviour.
    submit.mockClear();
    await user.click(screen.getByRole('button', { name: 'Kirim' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('leaves Enter alone for multi-line text, meta, alt and shift combinations', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onKeyDown = vi.fn();

    render(
      <form onSubmit={onSubmit} aria-label="form-laporan-2">
        <Textarea label="Catatan" defaultValue={'baris satu\nbaris dua'} onKeyDown={onKeyDown} />
      </form>,
    );

    const field = textareaOf('Catatan');
    field.focus();
    const submit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit');
    submit.mockClear();

    await user.keyboard('{Enter}');
    expect(onKeyDown).toHaveBeenLastCalledWith(
      expect.objectContaining({ key: 'Enter', shiftKey: false, ctrlKey: false }),
    );
    expect(submit).not.toHaveBeenCalled();

    // One line only, but every modifier combination is left to the browser.
    field.value = 'satu baris';
    submit.mockClear();
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    await user.keyboard('{Alt>}{Enter}{/Alt}');

    expect(submit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
    const enterEvents = onKeyDown.mock.calls.filter(([event]) => event.key === 'Enter');
    expect(enterEvents).toHaveLength(4);
    expect(enterEvents[1][0].shiftKey).toBe(true);
    expect(enterEvents[2][0].metaKey).toBe(true);
    expect(enterEvents[3][0].altKey).toBe(true);
  });

  it('does not swallow Enter when the field is outside a form', async () => {
    const onKeyDown = vi.fn();
    render(<Textarea label="Catatan" onKeyDown={onKeyDown} />);

    const field = textareaOf('Catatan');
    field.focus();
    await user.keyboard('{Enter}');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('respects a caller that already called preventDefault', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onKeyDown = vi.fn((event: React.KeyboardEvent<HTMLTextAreaElement>) =>
      event.preventDefault(),
    );

    render(
      <form onSubmit={onSubmit} aria-label="form-laporan-3">
        <Textarea label="Catatan" onKeyDown={onKeyDown} />
      </form>,
    );

    const field = textareaOf('Catatan');
    field.focus();
    const submit = vi.spyOn(HTMLFormElement.prototype, 'requestSubmit');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(onKeyDown).toHaveBeenCalledWith(
      expect.objectContaining({ key: 'Enter', ctrlKey: true }),
    );
    // The internal Enter shortcut bails out once the event is already handled.
    expect(submit).not.toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('Textarea — autoResize', () => {
  it('exposes its resize contract through data attributes', () => {
    render(<Textarea label="Catatan" autoResize maxHeight={200} />);

    const field = textareaOf('Catatan');
    expect(field).toHaveAttribute('data-autoresize', 'true');
    expect(field).toHaveAttribute('data-at-max', 'false');
    expect(field.className).toContain('resize-none');
    expect(field.style.getPropertyValue('--textarea-max-h')).toBe('200px');
  });

  it('locks the measured height when the content fits', async () => {
    render(<Textarea label="Catatan" autoResize maxHeight={200} />);

    const field = textareaOf('Catatan');
    setScrollHeight(field, 70);

    await user.type(field, 'Laporan singkat');

    // 70 rounds up to the 24px line grid (+2 tolerance) and stays under max.
    expect(field.style.height).toBe('74px');
    expect(field).toHaveAttribute('data-at-max', 'false');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('releases the locked height and reports when maxHeight is exceeded', async () => {
    const onMaxHeightReached = vi.fn();
    render(<Textarea label="Catatan" autoResize maxHeight={100} onMaxHeightReached={onMaxHeightReached} />);

    const field = textareaOf('Catatan');
    setScrollHeight(field, 500);

    await user.type(field, 'Laporan panjang');

    expect(field).toHaveAttribute('data-at-max', 'true');
    // The locked height is released and the inline height is clamped to the cap.
    expect(field.style.height).toBe('100px');
    expect(field.style.getPropertyValue('--textarea-max-h')).toBe('100px');
    expect(onMaxHeightReached).toHaveBeenLastCalledWith(true);
    expect(onMaxHeightReached).toHaveBeenCalledTimes(1);

    // Shrinking back below the cap flips the flag once more.
    setScrollHeight(field, 40);
    await user.type(field, 'x');
    await user.clear(field);

    expect(onMaxHeightReached).toHaveBeenLastCalledWith(false);
  });

  it('never lets a caller invert minHeight and maxHeight', () => {
    render(<Textarea label="Catatan" autoResize minHeight={400} maxHeight={200} />);

    // The class contract keeps max-height in charge when they are contradictory.
    expect(textareaOf('Catatan').style.getPropertyValue('--textarea-max-h')).toBe('200px');
  });

  it('raises a below-touch-target maxHeight up to the 48px floor', () => {
    render(<Textarea label="Catatan" autoResize maxHeight={10} />);

    expect(textareaOf('Catatan').style.getPropertyValue('--textarea-max-h')).toBe('48px');
  });

  it('caps absurd maxHeight values at the safety ceiling', () => {
    render(<Textarea label="Catatan" autoResize maxHeight={99999} />);

    expect(textareaOf('Catatan').style.getPropertyValue('--textarea-max-h')).toBe('720px');
  });

  it('ignores non-finite maxHeight and minHeight values', () => {
    render(
      <Textarea label="Catatan" autoResize maxHeight={Number.POSITIVE_INFINITY} minHeight={Number.NaN} />,
    );

    expect(textareaOf('Catatan').style.getPropertyValue('--textarea-max-h')).toBe('320px');
  });

  it('skips measurement when the element reports no layout (scrollHeight 0)', () => {
    render(<Textarea label="Catatan" autoResize />);

    const field = textareaOf('Catatan');
    field.style.height = '55px';

    // jsdom reports scrollHeight 0, so the previous inline height is preserved.
    expect(field.style.height).toBe('55px');
    expect(field).toHaveAttribute('data-at-max', 'false');
  });

  it('re-measures when ResizeObserver reports a size change', async () => {
    // Holder object: TypeScript menyempitkan variabel `let` yang hanya diisi di
    // dalam konstruktor menjadi `never`, sehingga pemanggilan di bawah gagal.
    const captured: { callback?: () => void } = {};
    class CapturingResizeObserver implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        captured.callback = () => callback([], this);
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    const globalWithObserver = globalThis as unknown as { ResizeObserver: typeof ResizeObserver };
    const original = globalWithObserver.ResizeObserver;
    globalWithObserver.ResizeObserver = CapturingResizeObserver;

    try {
      const { rerender } = render(<Textarea label="Catatan" autoResize value="a" onChange={() => {}} />);
      const field = textareaOf('Catatan');

      setScrollHeight(field, 50);
      // A wider/narrower box changes the row count, so the observer must re-measure.
      rerender(<Textarea label="Catatan" autoResize value="ab" onChange={() => {}} />);
      expect(field.style.height).toBe('74px');

      setScrollHeight(field, 100);
      captured.callback?.();
      await Promise.resolve();
      expect(field.style.height).toBe('122px');
    } finally {
      globalWithObserver.ResizeObserver = original;
    }
  });

  it('does not attach a ResizeObserver when autoResize is off', () => {
    const observe = vi.fn();
    class SpyResizeObserver implements ResizeObserver {
      observe = observe;
      unobserve(): void {}
      disconnect(): void {}
    }
    const globalWithObserver = globalThis as unknown as { ResizeObserver: typeof ResizeObserver };
    const original = globalWithObserver.ResizeObserver;
    globalWithObserver.ResizeObserver = SpyResizeObserver;

    try {
      render(<Textarea label="Catatan" />);
      expect(observe).not.toHaveBeenCalled();
    } finally {
      globalWithObserver.ResizeObserver = original;
    }
  });

  it('measures again when the value changes from outside', () => {
    const { rerender } = render(<Textarea label="Catatan" autoResize value="a" onChange={() => {}} />);

    const field = textareaOf('Catatan');
    setScrollHeight(field, 30);
    rerender(<Textarea label="Catatan" autoResize value="Teks dari luar" onChange={() => {}} />);

    expect(field.style.height).toBe('50px');
  });

  it('keeps a controlled autoResize field from rewriting its own value', async () => {
    const onChange = vi.fn();
    render(<Textarea label="Catatan" autoResize value="Terkunci" onChange={onChange} />);

    const field = textareaOf('Catatan');
    setScrollHeight(field, 40);
    await user.type(field, 'Z');

    expect(field).toHaveValue('Terkunci');
    expect(onChange).toHaveBeenCalled();
    expect(field.style.height).toBe('50px');
  });
});

describe('Textarea — kombinasi akhir', () => {
  it('renders counter, clear action and error together without losing the description', () => {
    render(
      <Textarea
        label="Catatan"
        defaultValue="Isi laporan"
        showCounter
        showClearButton
        maxLength={50}
        error="Wajib diisi"
        hint="Tulis lengkap."
      />,
    );

    const field = textareaOf('Catatan');
    expect(describedElement(field)).toHaveTextContent('Wajib diisi');
    expect(screen.getByText('11 / 50 karakter · sisa 39')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hapus' })).toBeInTheDocument();
    expect(screen.getByText('Teks panjang tetap terbaca utuh.')).toBeInTheDocument();
    expect(screen.queryByText('Tulis lengkap.')).not.toBeInTheDocument();
  });
});

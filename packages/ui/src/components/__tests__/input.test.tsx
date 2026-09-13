import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Input, type InputProps } from '../input';

/**
 * The shared jsdom setup defines `navigator.clipboard` as a non-configurable own
 * property, so `userEvent.setup()` throws in `attachClipboardStubToView`. The
 * direct per-call API (`userEvent.type(...)`) skips that clipboard attach and
 * works here, so interactions go through it instead of a session object.
 */
const user = userEvent;

/** Holds the element that carries the field message. */
function describedElement(field: HTMLElement): HTMLElement {
  const id = field.getAttribute('aria-describedby');
  expect(id, 'field harus punya aria-describedby').toBeTruthy();
  const node = document.getElementById(id!);
  expect(node, `elemen #${id} harus ada`).not.toBeNull();
  return node as HTMLElement;
}

describe('Input', () => {
  it('renders the minimal happy path with an accessible label', () => {
    render(<Input label="Nama relawan" />);

    const field = screen.getByLabelText('Nama relawan');
    expect(field).toBeInTheDocument();
    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveAttribute('type', 'text');
    expect(field).not.toBeDisabled();
    expect(field).not.toBeRequired();
    // No hint and no error means nothing to describe the field with.
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('wires the label to the input with an explicit htmlFor/id pair', () => {
    render(<Input label="Email" />);

    const field = screen.getByLabelText('Email');
    const label = screen.getByText('Email').closest('label')!;

    expect(field.id).not.toBe('');
    expect(label).toHaveAttribute('for', field.id);
    // The input must NOT be nested inside the label: adornments stay tappable.
    expect(label.contains(field)).toBe(false);
  });

  it('lets a caller-provided id win over the generated one', () => {
    render(<Input label="Email" id="email-utama" />);

    const field = screen.getByLabelText('Email');
    expect(field).toHaveAttribute('id', 'email-utama');
    expect(screen.getByText('Email').closest('label')).toHaveAttribute('for', 'email-utama');
  });

  it('accepts typed text and reports every change to the caller', async () => {
    const onChange = vi.fn();
    render(<Input label="Kota" onChange={onChange} />);

    const field = screen.getByLabelText('Kota');
    await user.type(field, 'Bandung');

    expect(field).toHaveValue('Bandung');
    // One change event per keystroke, each reporting the node's current value.
    expect(onChange).toHaveBeenCalledTimes('Bandung'.length);
    expect(onChange.mock.calls.every((call) => call[0].target.value === 'Bandung')).toBe(true);
  });

  it('supports a controlled value driven only by props', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<Input label="Kota" value="Semarang" onChange={onChange} />);

    const field = screen.getByLabelText('Kota');
    expect(field).toHaveValue('Semarang');

    await user.type(field, 'X');
    // Handler fires, but without a state update the controlled value never moves.
    expect(onChange).toHaveBeenCalled();
    expect(field).toHaveValue('Semarang');

    rerender(<Input label="Kota" value="Surabaya" onChange={onChange} />);
    expect(screen.getByLabelText('Kota')).toHaveValue('Surabaya');
  });

  it('renders a hint and links it through aria-describedby', () => {
    render(<Input label="Nomor HP" hint="Diawali kode negara bila dari luar negeri." />);

    const field = screen.getByLabelText('Nomor HP');
    const message = describedElement(field);

    expect(message.tagName).toBe('P');
    expect(message).toHaveTextContent('Diawali kode negara bila dari luar negeri.');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('ignores an all-whitespace hint', () => {
    render(<Input label="Kota" hint="   " />);

    const field = screen.getByLabelText('Kota');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText('   ')).not.toBeInTheDocument();
  });

  it('switches to the error state: aria-invalid, alert-free description and icon', () => {
    const { container } = render(<Input label="Email" error="Email tidak valid" />);

    const field = screen.getByLabelText('Email');
    expect(field).toHaveAttribute('aria-invalid', 'true');

    const message = describedElement(field);
    expect(message).toHaveTextContent('Email tidak valid');
    // Error icon is decorative: the message text is the accessible carrier.
    expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('input[class]')!.className).toContain('border-status-critical');
  });

  it('lets the error replace the hint and reuse a single message element', () => {
    const { rerender } = render(
      <Input label="Email" hint="Kami tidak pernah membagikan email." />,
    );

    const field = screen.getByLabelText('Email');
    const describedId = field.getAttribute('aria-describedby');
    expect(describedElement(field)).toHaveTextContent('Kami tidak pernah membagikan email.');

    rerender(<Input label="Email" hint="Kami tidak pernah membagikan email." error="Email wajib diisi" />);

    const errored = screen.getByLabelText('Email');
    expect(screen.getByText('Email wajib diisi')).toBeInTheDocument();
    expect(screen.queryByText('Kami tidak pernah membagikan email.')).not.toBeInTheDocument();
    // Same id is reused, so the reference always points at an existing node.
    expect(errored).toHaveAttribute('aria-describedby', describedId);
    expect(describedElement(errored)).toHaveTextContent('Email wajib diisi');
  });

  it('ignores a whitespace-only error and falls back to the hint', () => {
    render(<Input label="Email" error="   " hint="Boleh dikosongkan." />);

    const field = screen.getByLabelText('Email');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText('Boleh dikosongkan.')).toBeInTheDocument();
  });

  it('marks the field required with a visible asterisk and a screen-reader note', () => {
    const { container } = render(<Input label="Email" required />);

    const field = screen.getByLabelText(/^Email/);
    expect(field).toBeRequired();
    expect(field).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('(wajib diisi)')).toBeInTheDocument();

    const asterisk = Array.from(container.querySelectorAll('label span')).find(
      (node) => node.textContent === '*',
    );
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps a hidden label in the accessibility tree while hiding it visually', () => {
    const { container } = render(<Input label="Cari" hideLabel />);

    const field = screen.getByLabelText('Cari');
    const label = container.querySelector('label')!;

    expect(label.className).toContain('sr-only');
    expect(field).toBeInTheDocument();
  });

  it('renders prefix and suffix adornments around the input', () => {
    const { container } = render(
      <Input label="Nomor telepon" prefix="+62" suffix="seluler" />,
    );

    const prefix = container.querySelector('[data-adornment="prefix"]')!;
    const suffix = container.querySelector('[data-adornment="suffix"]')!;

    expect(prefix).toHaveTextContent('+62');
    expect(suffix).toHaveTextContent('seluler');
    // Order in the DOM matters: prefix -> input -> suffix.
    const siblings = Array.from(prefix.parentElement!.children);
    expect(siblings.indexOf(prefix)).toBe(0);
    expect(siblings[1].tagName).toBe('INPUT');
    expect(siblings.indexOf(suffix)).toBe(2);
  });

  it('renders an empty-string adornment because only null/undefined are absent', () => {
    // Documented behaviour: `prefix != null` gates the span, so `''` still
    // renders (the spacing shell), while `null`/`undefined` are omitted.
    const empty = render(<Input label="Kota" prefix="" />);
    expect(empty.container.querySelector('[data-adornment="prefix"]')).toHaveTextContent('');
    empty.unmount();

    const missing = render(<Input label="Kota" prefix={null} suffix={undefined} />);
    expect(missing.container.querySelector('[data-adornment]')).toBeNull();
    missing.unmount();

    const zero = render(<Input label="Berat" suffix={0} />);
    expect(zero.container.querySelector('[data-adornment="suffix"]')).toHaveTextContent('0');
  });

  it('keeps decorative icons inside adornments tappable, not the field', () => {
    render(<Input label="Cari" suffix={<svg data-testid="ikon-cari" />} />);

    const icon = screen.getByTestId('ikon-cari');
    expect(icon.parentElement).toHaveAttribute('data-adornment', 'suffix');
  });

  it('applies default inputMode per type while letting callers override it', () => {
    const tel = render(<Input label="Telepon" type="tel" />);
    expect(screen.getByLabelText('Telepon')).toHaveAttribute('inputmode', 'tel');
    tel.unmount();

    const number = render(<Input label="Umur" type="number" />);
    expect(screen.getByLabelText('Umur')).toHaveAttribute('inputmode', 'numeric');
    number.unmount();

    const email = render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('inputmode');
    email.unmount();

    render(<Input label="Kode pos" type="number" inputMode="tel" />);
    expect(screen.getByLabelText('Kode pos')).toHaveAttribute('inputmode', 'tel');
  });

  it('forwards numeric constraints and autocomplete to the DOM node', () => {
    render(<Input label="Umur" type="number" min={0} max={120} step={1} autoComplete="off" />);

    const field = screen.getByLabelText('Umur');
    expect(field).toHaveAttribute('min', '0');
    expect(field).toHaveAttribute('max', '120');
    expect(field).toHaveAttribute('step', '1');
    expect(field).toHaveAttribute('autocomplete', 'off');
  });

  it('sets defaultValue for uncontrolled fields', () => {
    render(<Input label="Kota" defaultValue="Yogyakarta" />);

    expect(screen.getByLabelText('Kota')).toHaveValue('Yogyakarta');
  });

  it('blocks typing and marks the node disabled when disabled', async () => {
    const onChange = vi.fn();
    render(<Input label="Kota" disabled onChange={onChange} />);

    const field = screen.getByLabelText('Kota');
    expect(field).toBeDisabled();

    await user.type(field, 'Bogor');
    expect(onChange).not.toHaveBeenCalled();
    expect(field).toHaveValue('');
  });

  it('renders placeholder text as a non-value affordance', () => {
    render(<Input label="Cari sungai" placeholder="mis. Ciliwung" />);

    const field = screen.getByLabelText('Cari sungai');
    expect(field).toHaveAttribute('placeholder', 'mis. Ciliwung');
    expect(field).toHaveValue('');
  });

  it('forwards an arbitrary aria-label override and extra DOM props', () => {
    render(<Input label="Nama" aria-label="Nama lengkap" data-testid="input-nama" name="nama" />);

    const field = screen.getByTestId('input-nama');
    expect(field).toHaveAttribute('aria-label', 'Nama lengkap');
    expect(field).toHaveAttribute('name', 'nama');
  });

  it('passes className to the wrapper and inputClassName to the input', () => {
    const { container } = render(
      <Input label="Kota" className="kolom-kota" inputClassName="input-kota" />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const field = screen.getByLabelText('Kota');

    expect(wrapper.className).toContain('kolom-kota');
    expect(wrapper.className).toContain('flex');
    expect(field.className).toContain('input-kota');
    expect(field).not.toHaveClass('kolom-kota');
  });

  it('exposes a stable control id for form-level targeting', () => {
    render(<Input label="Kota" id="kota" />);

    expect(screen.getByLabelText('Kota')).toHaveAttribute('data-control-id', 'kota-control');
  });

  it('emits focus, blur and keyboard events to the caller', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const onKeyDown = vi.fn();

    render(<Input label="Kota" onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeyDown} />);
    const field = screen.getByLabelText('Kota');

    await user.click(field);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.keyboard('{Enter}{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(2);
    expect(onKeyDown.mock.calls[0][0].key).toBe('Enter');
    expect(onKeyDown.mock.calls[1][0].key).toBe('Escape');

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('submits with the surrounding form and carries required validity', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit} aria-label="form-laporan">
        <Input label="Nama" name="nama" required />
        <button type="submit">Kirim</button>
      </form>,
    );

    const field = screen.getByLabelText(/^Nama/) as HTMLInputElement;
    expect(field.form).toBe(screen.getByRole('form', { name: 'form-laporan' }));
    expect(field.checkValidity()).toBe(false);
    expect(field.validationMessage).not.toBe('');

    field.value = 'Rani';
    expect(field.checkValidity()).toBe(true);
  });

  it('forwards a ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Kota" ref={ref} />);

    expect(ref.current).not.toBeNull();
    expect(ref.current!.tagName).toBe('INPUT');
    expect(ref.current).toBe(screen.getByLabelText('Kota'));
  });

  it('handles very long labels and error messages without losing association', () => {
    const longLabel = `Lokasi ${'sungai '.repeat(40)}`.trim();
    const longError = `Alamat terlalu panjang. ${'Ulangi. '.repeat(50)}`.trim();

    render(<Input label={longLabel} error={longError} />);

    const field = screen.getByLabelText(longLabel);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(describedElement(field)).toHaveTextContent(longError);
  });

  it('accepts every documented input type', () => {
    const types: Array<InputProps['type']> = ['text', 'email', 'tel', 'number'];

    for (const type of types) {
      const { unmount } = render(<Input label={`field-${type}`} type={type} />);
      expect(screen.getByLabelText(`field-${type}`)).toHaveAttribute('type', type);
      unmount();
    }
  });
});

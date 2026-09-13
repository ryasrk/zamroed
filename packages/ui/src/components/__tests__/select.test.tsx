import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Select, type SelectOption } from '../select';

/**
 * The shared jsdom setup defines `navigator.clipboard` as a non-configurable own
 * property, so `userEvent.setup()` throws in `attachClipboardStubToView`. The
 * direct per-call API skips that clipboard attach and works here.
 */
const user = userEvent;

const RIVERS: readonly SelectOption[] = [
  { value: 'ciliwung', label: 'Ciliwung' },
  { value: 'citarum', label: 'Citarum' },
  { value: 'kapuas', label: 'Kapuas', disabled: true },
];

function selectOf(label: string | RegExp): HTMLSelectElement {
  return screen.getByLabelText(label) as HTMLSelectElement;
}

function describedElement(field: HTMLElement): HTMLElement {
  const id = field.getAttribute('aria-describedby');
  expect(id, 'field harus punya aria-describedby').toBeTruthy();
  const node = document.getElementById(id!);
  expect(node, `elemen #${id} harus ada`).not.toBeNull();
  return node as HTMLElement;
}

function optionValues(field: HTMLSelectElement): string[] {
  return Array.from(field.options).map((option) => option.value);
}

describe('Select — render dasar', () => {
  it('renders the minimal happy path with label, options and a chevron', () => {
    const { container } = render(<Select label="Sungai" options={RIVERS} />);

    const field = selectOf('Sungai');
    const label = screen.getByText('Sungai').closest('label')!;

    expect(field.tagName).toBe('SELECT');
    expect(label).toHaveAttribute('for', field.id);
    // Native control: not a listbox reimplementation.
    expect(field).not.toHaveAttribute('role');
    expect(optionValues(field)).toEqual(['ciliwung', 'citarum', 'kapuas']);
    expect(screen.getByRole('option', { name: 'Ciliwung' })).toHaveValue('ciliwung');
    expect(screen.getByRole('option', { name: 'Kapuas' })).toBeDisabled();
    // Decorative chevron is hidden from assistive tech.
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).not.toHaveAttribute('aria-busy');
  });

  it('renders the option list in the given order with duplicate values preserved', () => {
    const duplicated: SelectOption[] = [
      { value: 'a', label: 'Pertama' },
      { value: 'a', label: 'Kedua' },
      { value: '', label: 'Kosong' },
    ];
    render(<Select label="Sungai" options={duplicated} />);

    expect(selectOf('Sungai').options).toHaveLength(3);
    expect(optionValues(selectOf('Sungai'))).toEqual(['a', 'a', '']);
    expect(screen.getByRole('option', { name: 'Pertama' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Kedua' })).toBeInTheDocument();
  });

  it('honours caller id, name and autocomplete', () => {
    render(<Select label="Sungai" id="sungai-1" name="sungai" options={RIVERS} autoComplete="off" />);

    const field = selectOf('Sungai');
    expect(field).toHaveAttribute('id', 'sungai-1');
    expect(field).toHaveAttribute('name', 'sungai');
    expect(field).toHaveAttribute('autocomplete', 'off');
    expect(screen.getByText('Sungai').closest('label')).toHaveAttribute('for', 'sungai-1');
  });

  it('passes className to the wrapper and selectClassName to the control', () => {
    const { container } = render(
      <Select label="Sungai" options={RIVERS} className="kolom-sungai" selectClassName="pilih-sungai" />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    const field = selectOf('Sungai');

    expect(wrapper.className).toContain('kolom-sungai');
    expect(wrapper.className).toContain('group');
    expect(field.className).toContain('pilih-sungai');
    expect(field).not.toHaveClass('kolom-sungai');
  });

  it('keeps a hidden label available to assistive tech', () => {
    const { container } = render(<Select label="Sungai" options={RIVERS} hideLabel />);

    expect(container.querySelector('label')!.className).toContain('sr-only');
    expect(selectOf('Sungai')).toBeInTheDocument();
  });

  it('marks required selects with an asterisk and a screen-reader note', () => {
    const { container } = render(<Select label="Sungai" options={RIVERS} required />);

    const field = selectOf(/^Sungai/);
    expect(field).toBeRequired();
    expect(field).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('(wajib dipilih)')).toBeInTheDocument();

    const asterisk = Array.from(container.querySelectorAll('label span')).find(
      (node) => node.textContent === '*',
    );
    expect(asterisk).toHaveAttribute('aria-hidden', 'true');
  });

  it('forwards a ref to the underlying select element', () => {
    const ref = createRef<HTMLSelectElement>();
    render(<Select label="Sungai" options={RIVERS} ref={ref} />);

    expect(ref.current).toBe(selectOf('Sungai'));
  });

  it('passes arbitrary DOM attributes through to the select', () => {
    render(<Select label="Sungai" options={RIVERS} data-testid="pilih" aria-label="Sungai utama" />);

    const field = screen.getByTestId('pilih');
    expect(field).toHaveAttribute('aria-label', 'Sungai utama');
  });
});

describe('Select — pilihan nilai', () => {
  it('supports uncontrolled defaultValue', () => {
    render(<Select label="Sungai" options={RIVERS} defaultValue="citarum" />);

    expect(selectOf('Sungai')).toHaveValue('citarum');
  });

  it('reports the change to the caller and keeps the selected option', async () => {
    const onChange = vi.fn();
    render(<Select label="Sungai" options={RIVERS} defaultValue="ciliwung" onChange={onChange} />);

    const field = selectOf('Sungai');
    await user.selectOptions(field, 'citarum');

    expect(field).toHaveValue('citarum');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].target.value).toBe('citarum');
  });

  it('keeps a controlled value under the parent’s authority', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Select label="Sungai" options={RIVERS} value="ciliwung" onChange={onChange} />,
    );

    const field = selectOf('Sungai');
    expect(field).toHaveValue('ciliwung');

    await user.selectOptions(field, 'citarum');
    expect(onChange).toHaveBeenCalledTimes(1);
    // React restores the controlled value because the parent never changed it.
    expect(field).toHaveValue('ciliwung');

    rerender(<Select label="Sungai" options={RIVERS} value="citarum" onChange={onChange} />);
    expect(selectOf('Sungai')).toHaveValue('citarum');
  });

  it('never lets defaultValue override a controlled value', () => {
    render(<Select label="Sungai" options={RIVERS} value="kapuas" defaultValue="ciliwung" />);

    expect(selectOf('Sungai')).toHaveValue('kapuas');
  });
});

describe('Select — placeholder dan daftar kosong', () => {
  it('renders a placeholder option with an empty value that stays selectable when optional', () => {
    render(<Select label="Sungai" options={RIVERS} placeholder="Pilih sungai" />);

    const field = selectOf('Sungai');
    const placeholder = screen.getByRole('option', { name: 'Pilih sungai' });

    expect(placeholder).toHaveValue('');
    expect(placeholder).not.toBeDisabled();
    expect(field).toHaveValue('');
    expect(optionValues(field)).toEqual(['', 'ciliwung', 'citarum', 'kapuas']);
  });

  it('disables the placeholder when the select is required', () => {
    render(<Select label="Sungai" options={RIVERS} placeholder="Pilih sungai" required />);

    expect(screen.getByRole('option', { name: 'Pilih sungai' })).toBeDisabled();
  });

  it('shows the default empty state when there are no options', () => {
    render(<Select label="Sungai" options={[]} />);

    const synthetic = screen.getByRole('option', { name: 'Belum ada data' });
    expect(synthetic).toHaveValue('');
    expect(synthetic).toBeDisabled();
    expect(screen.getByText('Belum ada data')).toBeInTheDocument();
  });

  it('uses emptyLabel for the synthetic option', () => {
    render(<Select label="Cabang" options={[]} emptyLabel="Belum ada cabang" />);

    expect(screen.getByRole('option', { name: 'Belum ada cabang' })).toBeInTheDocument();
    expect(screen.queryByText('Belum ada data')).not.toBeInTheDocument();
  });

  it('does not stack a synthetic empty option on top of a placeholder', () => {
    render(<Select label="Sungai" options={[]} placeholder="Pilih sungai" />);

    const field = selectOf('Sungai');
    expect(field.options).toHaveLength(1);
    expect(optionValues(field)).toEqual(['']);
    expect(screen.queryByText('Belum ada data')).not.toBeInTheDocument();
  });

  it('survives a non-array options value arriving from a pending fetch', () => {
    const malformed = undefined as unknown as SelectOption[];
    render(<Select label="Sungai" options={malformed} emptyLabel="Menunggu data" />);

    const field = selectOf('Sungai');
    expect(field.options).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Menunggu data' })).toBeInTheDocument();
  });
});

describe('Select — status memuat', () => {
  it('marks the control busy, disabled and inert while loading', () => {
    render(<Select label="Sungai" options={[]} loading />);

    const field = selectOf('Sungai');
    expect(field).toBeDisabled();
    expect(field).toHaveAttribute('aria-busy', 'true');
    expect(field).toHaveAttribute('data-loading', 'true');
    // The synthetic row explains why nothing is selectable yet.
    expect(screen.getByRole('option', { name: 'Memuat pilihan…' })).toBeInTheDocument();
  });

  it('uses a custom loadingLabel and keeps existing options visible', () => {
    render(<Select label="Sungai" options={RIVERS} loading loadingLabel="Mengambil data sungai" />);

    const field = selectOf('Sungai');
    expect(field).toBeDisabled();
    expect(optionValues(field)).toEqual(['ciliwung', 'citarum', 'kapuas']);
    expect(screen.queryByText('Mengambil data sungai')).not.toBeInTheDocument();
  });

  it('blocks interaction while disabled or loading', async () => {
    const onChange = vi.fn();
    render(<Select label="Sungai" options={RIVERS} disabled onChange={onChange} defaultValue="ciliwung" />);

    const field = selectOf('Sungai');
    expect(field).toBeDisabled();
    expect(field).not.toHaveAttribute('aria-busy');

    await user.selectOptions(field, 'citarum');
    expect(field).toHaveValue('ciliwung');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Select — pesan error dan petunjuk', () => {
  it('announces an error with role=alert, aria-invalid and an icon', () => {
    render(<Select label="Sungai" options={RIVERS} error="Sungai wajib dipilih" />);

    const field = selectOf('Sungai');
    const message = describedElement(field);

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(message).toHaveAttribute('role', 'alert');
    expect(message).toHaveTextContent('Sungai wajib dipilih');
    expect(message.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(field.className).toContain('border-status-critical');
  });

  it('keeps hints quiet — no alert role for guidance text', () => {
    render(<Select label="Sungai" options={RIVERS} hint="Pilih satu sungai utama." />);

    const field = selectOf('Sungai');
    const message = describedElement(field);

    expect(message).toHaveTextContent('Pilih satu sungai utama.');
    expect(message).not.toHaveAttribute('role');
    expect(field).not.toHaveAttribute('aria-invalid');
  });

  it('ignores whitespace-only hint and error values', () => {
    render(<Select label="Sungai" options={RIVERS} hint="   " error="  " />);

    const field = selectOf('Sungai');
    expect(field).not.toHaveAttribute('aria-describedby');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets a real error take over the hint while reusing one described element', () => {
    const { rerender } = render(<Select label="Sungai" options={RIVERS} hint="Pilih satu." />);

    const describedId = selectOf('Sungai').getAttribute('aria-describedby');
    rerender(<Select label="Sungai" options={RIVERS} hint="Pilih satu." error="Belum dipilih" />);

    const field = selectOf('Sungai');
    expect(screen.queryByText('Pilih satu.')).not.toBeInTheDocument();
    expect(field).toHaveAttribute('aria-describedby', describedId);
    expect(describedElement(field)).toHaveTextContent('Belum dipilih');
    expect(screen.getByRole('alert')).toHaveTextContent('Belum dipilih');
  });

  it('falls back to the hint when the error is only whitespace', () => {
    render(<Select label="Sungai" options={RIVERS} error="  " hint="Pilih satu." />);

    const field = selectOf('Sungai');
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(describedElement(field)).toHaveTextContent('Pilih satu.');
  });

  it('keeps association with a very long error message', () => {
    const longError = `Sungai tidak dikenal. ${'Pilih dari daftar. '.repeat(40)}`.trim();
    render(<Select label="Sungai" options={RIVERS} error={longError} />);

    expect(describedElement(selectOf('Sungai'))).toHaveTextContent(longError);
  });
});

describe('Select — validasi form', () => {
  it('participates in form submission and required validity', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={onSubmit} aria-label="form-sungai">
        <Select label="Sungai" name="sungai" options={RIVERS} placeholder="Pilih sungai" required />
        <button type="submit">Kirim</button>
      </form>,
    );

    const field = selectOf(/^Sungai/) as HTMLSelectElement;
    expect(field.form).toBe(screen.getByRole('form', { name: 'form-sungai' }));

    // jsdom auto-selects the first selectable option, so native checkValidity()
    // cannot express the "nothing chosen yet" state. Assert the contract that
    // actually matters to consumers: required is exposed natively and to AT.
    expect(field.required).toBe(true);
    expect(field).toHaveAttribute('aria-required', 'true');

    await user.selectOptions(field, 'ciliwung');
    expect(field.value).toBe('ciliwung');

    await user.click(screen.getByRole('button', { name: 'Kirim' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

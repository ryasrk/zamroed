import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CheckboxGroup, type CheckboxGroupOption } from '../checkbox-group';

const DIVISIONS: CheckboxGroupOption[] = [
  { value: 'air', label: 'Pemantauan Kualitas Air', description: 'Uji DO & pH tiap dua pekan' },
  { value: 'logistik', label: 'Logistik Lapangan' },
  { value: 'dokumentasi', label: 'Dokumentasi', description: 'Foto dan video aksi' },
];

/** The native checkbox for a given option label. */
function boxFor(label: string | RegExp) {
  // An option's accessible name is its label followed by its description,
  // so match on the label prefix and anchor the start.
  const pattern = typeof label === 'string' ? new RegExp('^' + label) : label;
  return screen.getByRole('checkbox', { name: pattern });
}

/**
 * The accessible group that carries the legend as its name.
 * The component nests a fieldset around a layout <div role="group">, so a bare
 * getByRole('group') would match both elements.
 */
/**
 * The inner layout element that owns the legend via aria-labelledby.
 * The surrounding <fieldset> ALSO maps to role=group and shares the name, so
 * a plain getByRole('group') is ambiguous - filter to the DIV.
 */
function group() {
  return screen
    .getAllByRole('group', { name: /Divisi/ })
    .find((el) => el.tagName === 'DIV') as HTMLElement;
}

/** The outer <fieldset> element (carries aria-invalid / aria-required / className). */
function fieldsetEl(): HTMLFieldSetElement {
  const el = screen
    .getAllByRole('group', { name: /Divisi/ })
    .find((node) => node.tagName === 'FIELDSET');
  if (!el) throw new Error('fieldset not found');
  return el as HTMLFieldSetElement;
}

describe('CheckboxGroup — render dasar', () => {
  it('renders every option as a real checkbox grouped under a fieldset legend', () => {
    render(<CheckboxGroup legend="Divisi relawan" options={DIVISIONS} value={[]} onChange={vi.fn()} />);

    expect(group()).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    for (const option of DIVISIONS) {
      expect(boxFor(option.label)).toBeInTheDocument();
    }
  });

  it('renders option descriptions when provided', () => {
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={vi.fn()} />);
    expect(screen.getByText('Uji DO & pH tiap dua pekan')).toBeInTheDocument();
    expect(screen.getByText('Foto dan video aksi')).toBeInTheDocument();
  });

  it('reflects the supplied value as checked state', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['logistik']} onChange={vi.fn()} />,
    );
    expect(boxFor('Logistik Lapangan')).toBeChecked();
    expect(boxFor('Pemantauan Kualitas Air')).not.toBeChecked();
  });

  it('tolerates a non-array options prop without crashing', () => {
    // Data dari API bisa berbentuk undefined sebelum termuat.
    render(
      <CheckboxGroup
        legend="Divisi"
        options={undefined as unknown as readonly CheckboxGroupOption[]}
        value={[]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('ignores selected values that are not present among the options', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'sudah-tidak-ada']} onChange={vi.fn()} />,
    );
    // Only the known value is checked; the stale entry cannot select a phantom box.
    expect(boxFor('Pemantauan Kualitas Air')).toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('ignores non-string entries in value', () => {
    render(
      <CheckboxGroup
        legend="Divisi"
        options={DIVISIONS}
        value={[42, null, 'air'] as unknown as string[]}
        onChange={vi.fn()}
      />,
    );
    expect(boxFor('Pemantauan Kualitas Air')).toBeChecked();
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });
});

describe('CheckboxGroup — interaksi', () => {
  it('calls onChange with the option appended in options order', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={['dokumentasi']} onChange={onChange} />);

    await user.click(boxFor('Pemantauan Kualitas Air'));

    // Order follows `options`, not click order, so the form payload is stable.
    expect(onChange).toHaveBeenCalledWith(['air', 'dokumentasi']);
  });

  it('removes an option when it is unchecked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'logistik']} onChange={onChange} />,
    );

    await user.click(boxFor('Logistik Lapangan'));

    expect(onChange).toHaveBeenCalledWith(['air']);
  });

  it('is operable with the keyboard from the native checkbox', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={onChange} />);

    await user.tab();
    expect(boxFor('Pemantauan Kualitas Air')).toHaveFocus();
    await user.keyboard(' ');

    expect(onChange).toHaveBeenCalledWith(['air']);
  });

  it('always returns a fresh array rather than mutating the incoming value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const original = ['air'];
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={original} onChange={onChange} />);

    await user.click(boxFor('Logistik Lapangan'));

    const received = onChange.mock.calls[0][0] as string[];
    expect(received).not.toBe(original);
    expect(original).toEqual(['air']);
  });
});

describe('CheckboxGroup — batas maksimum', () => {
  it('locks unchecked options once the limit is reached', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'logistik']} max={2} onChange={onChange} />,
    );

    const locked = boxFor('Dokumentasi');
    await user.click(locked);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('still allows deselecting when at the limit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'logistik']} max={2} onChange={onChange} />,
    );

    await user.click(boxFor('Logistik Lapangan'));

    expect(onChange).toHaveBeenCalledWith(['air']);
  });

  it('announces the remaining allowance', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air']} max={2} onChange={vi.fn()} />,
    );
    expect(screen.getByText('1/2 dipilih')).toBeInTheDocument();
    expect(screen.getByText(/Masih dapat memilih 1 lagi/)).toBeInTheDocument();
  });

  it('treats max of zero, negative, or non-finite as unlimited', async () => {
    const user = userEvent.setup();

    for (const badMax of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) {
      const onChange = vi.fn();
      const { unmount } = render(
        <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'logistik']} max={badMax} onChange={onChange} />,
      );

      await user.click(boxFor('Dokumentasi'));
      expect(onChange).toHaveBeenCalledWith(['air', 'logistik', 'dokumentasi']);

      unmount();
    }
  });

  it('floors a fractional max', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={['air', 'logistik']} max={2.9} onChange={onChange} />,
    );

    await user.click(boxFor('Dokumentasi'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CheckboxGroup — galat, petunjuk, dan status', () => {
  it('exposes an error through aria-invalid and describes the fieldset with it', () => {
    render(
      <CheckboxGroup
        legend="Divisi"
        options={DIVISIONS}
        value={[]}
        onChange={vi.fn()}
        error="Pilih minimal satu divisi."
      />,
    );

    const group = fieldsetEl();
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Pilih minimal satu divisi.')).toBeInTheDocument();
    expect(group.getAttribute('aria-describedby')).toContain('-message');
  });

  it('shows the hint when there is no error', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={vi.fn()} hint="Boleh pilih lebih dari satu." />,
    );
    expect(screen.getByText('Boleh pilih lebih dari satu.')).toBeInTheDocument();
    expect(fieldsetEl()).not.toHaveAttribute('aria-invalid');
  });

  it('prefers the error over the hint when both are supplied', () => {
    render(
      <CheckboxGroup
        legend="Divisi"
        options={DIVISIONS}
        value={[]}
        onChange={vi.fn()}
        hint="Petunjuk"
        error="Galat"
      />,
    );
    expect(screen.getByText('Galat')).toBeInTheDocument();
    expect(screen.queryByText('Petunjuk')).not.toBeInTheDocument();
  });

  it('treats a whitespace-only error as absent', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={vi.fn()} error="   " />,
    );
    expect(fieldsetEl()).not.toHaveAttribute('aria-invalid');
  });

  it('marks required both visually and to assistive technology', () => {
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={vi.fn()} required />);

    expect(fieldsetEl()).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('(wajib dipilih minimal satu)')).toBeInTheDocument();
  });

  it('can hide the legend visually while keeping it for screen readers', () => {
    render(
      <CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={vi.fn()} hideLegend />,
    );
    // Still reachable as the accessible name of the group.
    expect(group()).toBeInTheDocument();
  });

  it('renders an optional description node under the legend', () => {
    render(
      <CheckboxGroup
        legend="Divisi"
        options={DIVISIONS}
        value={[]}
        onChange={vi.fn()}
        description={<span>Pilih maksimal dua divisi.</span>}
      />,
    );
    expect(screen.getByText('Pilih maksimal dua divisi.')).toBeInTheDocument();
  });
});

describe('CheckboxGroup — status nonaktif', () => {
  it('does not call onChange and marks inputs disabled when the group is disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={onChange} disabled />);

    const box = boxFor('Pemantauan Kualitas Air');
    expect(box).toBeDisabled();
    await user.click(box);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('cannot be toggled by keyboard while disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CheckboxGroup legend="Divisi" options={DIVISIONS} value={[]} onChange={onChange} disabled />);

    await user.tab();
    await user.keyboard(' ');

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('CheckboxGroup — kasus tepi', () => {
  it('renders an empty group with an explanatory note instead of options', () => {
    render(<CheckboxGroup legend="Divisi" options={[]} value={[]} onChange={vi.fn()} />);

    // With no options the inner layout group is replaced by an empty-state note,
    // so the fieldset is the element that remains.
    expect(fieldsetEl()).toBeInTheDocument();
    expect(screen.getByText('Belum ada pilihan yang tersedia.')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('handles a single option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Divisi" options={[DIVISIONS[0]!]} value={[]} onChange={onChange} />,
    );

    await user.click(boxFor('Pemantauan Kualitas Air'));
    expect(onChange).toHaveBeenCalledWith(['air']);
  });

  it('handles a very long option label', () => {
    const long = 'Divisi '.repeat(40).trim();
    render(
      <CheckboxGroup legend="Divisi" options={[{ value: 'x', label: long }]} value={[]} onChange={vi.fn()} />,
    );
    expect(boxFor(long)).toBeInTheDocument();
  });

  it('accepts readonly value and options arrays', () => {
    const options = Object.freeze([...DIVISIONS]) as readonly CheckboxGroupOption[];
    const value = Object.freeze(['air']) as readonly string[];
    render(<CheckboxGroup legend="Divisi" options={options} value={value} onChange={vi.fn()} />);
    expect(boxFor('Pemantauan Kualitas Air')).toBeChecked();
  });

  it('applies caller-supplied className to the fieldset', () => {
    render(
      <CheckboxGroup
        legend="Divisi"
        options={DIVISIONS}
        value={[]}
        onChange={vi.fn()}
        className="custom-group"
      />,
    );
    expect(fieldsetEl()).toHaveClass('custom-group');
  });
});

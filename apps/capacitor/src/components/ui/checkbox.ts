import { h } from '../../core/dom';

export interface CheckboxOptions {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface CheckboxField {
  el: HTMLLabelElement;
  input: HTMLInputElement;
}

/** Kotak centang dengan label. Seluruh baris bisa disentuh, tinggi minimum 48px. */
export function createCheckbox(options: CheckboxOptions): CheckboxField {
  const input = h('input', {
    type: 'checkbox',
    checked: options.checked ?? false,
    class: 'size-icon-sm shrink-0 accent-primary',
    onchange: () => {
      options.onChange?.(input.checked);
    },
  });
  const el = h(
    'label',
    { class: 'flex min-h-button items-center gap-sm text-caption text-content' },
    input,
    options.label
  );
  return { el, input };
}

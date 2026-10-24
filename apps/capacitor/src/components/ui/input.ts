import { cx, h, uniqueId } from '../../core/dom';

export interface InputOptions {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  autocomplete?: string;
  value?: string;
  className?: string;
  onInput?: (value: string) => void;
}

export interface InputField {
  el: HTMLDivElement;
  input: HTMLInputElement;
  /** Tampilkan pesan error; null menghapusnya. */
  setError: (message: string | null) => void;
}

const BASE =
  'h-input-max min-h-input-min w-full rounded-xl border bg-surface px-lg text-body text-content ' +
  'placeholder:text-content-muted focus:border-primary focus:outline-none disabled:opacity-40';

/** Kolom isian. Tinggi 56px (AumoDimens.InputHeightMax), minimum 48px. */
export function createInput(options: InputOptions): InputField {
  const id = uniqueId('input');
  const errorId = `${id}-error`;

  const input = h('input', {
    id,
    type: options.type ?? 'text',
    placeholder: options.placeholder,
    autocomplete: options.autocomplete,
    value: options.value,
    class: cx(BASE, 'border-outline', options.className),
    oninput: () => {
      options.onInput?.(input.value);
    },
  });
  const error = h('p', { id: errorId, class: 'text-caption text-bad', hidden: true });
  const el = h(
    'div',
    { class: 'flex flex-col gap-sm' },
    h('label', { for: id, class: 'text-secondary text-content-secondary' }, options.label),
    input,
    error
  );

  const setError = (message: string | null) => {
    const has = message !== null && message !== '';
    error.textContent = has ? message : '';
    error.hidden = !has;
    input.classList.toggle('border-bad', has);
    input.classList.toggle('border-outline', !has);
    if (has) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', errorId);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  };

  return { el, input, setError };
}

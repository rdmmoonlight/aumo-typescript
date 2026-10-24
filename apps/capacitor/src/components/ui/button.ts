import { cx, h } from '../../core/dom';
import type { Child } from '../../core/dom';

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'text';

export interface ButtonOptions {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  onClick?: (event: Event) => void;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary active:brightness-90',
  outline: 'border border-outline text-content active:bg-surface-elevated',
  danger: 'bg-bad text-on-primary active:brightness-90',
  text: 'text-content-secondary active:bg-surface-elevated',
};

/** Tombol aksi. Tinggi minimum 48px (AumoDimens.ButtonHeight). */
export function createButton(options: ButtonOptions, ...children: Child[]): HTMLButtonElement {
  const { variant = 'primary', fullWidth = false, disabled = false, type = 'button' } = options;
  return h(
    'button',
    {
      type,
      disabled,
      onclick: options.onClick,
      class: cx(
        'inline-flex min-h-button items-center justify-center gap-sm rounded-xl px-lg',
        'text-body font-bold disabled:opacity-40',
        variants[variant],
        fullWidth && 'w-full',
        options.className
      ),
    },
    ...children
  );
}

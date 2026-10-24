import { h } from '../../core/dom';
import type { Child } from '../../core/dom';
import { createButton } from './button';

export interface DialogHandle {
  el: HTMLDialogElement;
  open: () => void;
  close: () => void;
}

export interface DialogOptions {
  title: string;
  body: Child;
  actions?: Node[];
  onDismiss: () => void;
}

/** Dialog modal berbasis elemen <dialog> (fokus dan Esc ditangani browser). */
export function createDialog(options: DialogOptions): DialogHandle {
  const titleId = 'dialog-title';
  const el = h(
    'dialog',
    {
      'aria-labelledby': titleId,
      class:
        'm-auto w-[calc(100%-2*var(--spacing-screen))] max-w-md rounded-2xl bg-surface p-card ' +
        'text-content backdrop:bg-black/70',
      oncancel: (event) => {
        event.preventDefault();
        options.onDismiss();
      },
      onclick: (event) => {
        if (event.target === el) options.onDismiss();
      },
    },
    h('h2', { id: titleId, class: 'text-h4 font-bold' }, options.title),
    h('div', { class: 'mt-sm text-body text-content-secondary' }, options.body),
    options.actions && options.actions.length > 0
      ? h('div', { class: 'mt-lg flex justify-end gap-sm' }, ...options.actions)
      : null
  );

  return {
    el,
    open: () => {
      if (!el.open) el.showModal();
    },
    close: () => {
      if (el.open) el.close();
    },
  };
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText: string;
  dismissText: string;
  destructive?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/** Dialog konfirmasi dua tombol (padanan ConfirmDialog.kt). */
export function createConfirmDialog(options: ConfirmDialogOptions): DialogHandle {
  return createDialog({
    title: options.title,
    body: options.message,
    onDismiss: options.onDismiss,
    actions: [
      createButton({ variant: 'text', onClick: options.onDismiss }, options.dismissText),
      createButton(
        { variant: options.destructive ? 'danger' : 'primary', onClick: options.onConfirm },
        options.confirmText
      ),
    ],
  });
}

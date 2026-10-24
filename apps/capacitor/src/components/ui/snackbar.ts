import { h } from '../../core/dom';

const DURATION_MS = { short: 4000, long: 10000 } as const;

export interface SnackbarHandle {
  el: HTMLDivElement;
  show: (message: string, duration?: keyof typeof DURATION_MS) => void;
  /** Hentikan timer dan lepas dari DOM. */
  destroy: () => void;
}

/** Pesan singkat di dasar layar (padanan SnackbarMessageHost.kt). */
export function createSnackbar(): SnackbarHandle {
  const text = h('div', {
    class: 'rounded-xl bg-surface-elevated px-lg py-sm text-secondary text-content shadow-lg',
  });
  const el = h(
    'div',
    {
      role: 'status',
      'aria-live': 'polite',
      hidden: true,
      class:
        'fixed inset-x-0 bottom-0 z-50 p-screen pb-[max(var(--spacing-screen),env(safe-area-inset-bottom))]',
    },
    text
  );

  let timer: ReturnType<typeof setTimeout> | undefined;

  const hide = () => {
    clearTimeout(timer);
    el.hidden = true;
    text.textContent = '';
  };

  return {
    el,
    show: (message, duration = 'long') => {
      clearTimeout(timer);
      text.textContent = message;
      el.hidden = false;
      timer = setTimeout(hide, DURATION_MS[duration]);
    },
    destroy: () => {
      clearTimeout(timer);
      el.remove();
    },
  };
}

import { cx, h } from '../../core/dom';
import type { Child } from '../../core/dom';

export function createList(items: HTMLLIElement[]): HTMLUListElement {
  return h(
    'ul',
    {
      class: 'divide-y divide-outline overflow-hidden rounded-2xl border border-outline bg-surface',
    },
    ...items
  );
}

export interface ListItemOptions {
  title: string;
  supporting?: string;
  leading?: Child;
  trailing?: Child;
  onClick?: () => void;
}

/** Baris daftar. Area sentuh minimum 48px. */
export function createListItem(options: ListItemOptions): HTMLLIElement {
  const body: Child[] = [
    options.leading,
    h(
      'div',
      { class: 'min-w-0 flex-1 text-left' },
      h('p', { class: 'truncate text-body text-content' }, options.title),
      options.supporting
        ? h('p', { class: 'truncate text-caption text-content-muted' }, options.supporting)
        : null
    ),
    options.trailing,
  ];
  const row = 'flex min-h-button w-full items-center gap-lg px-lg py-sm';

  return h(
    'li',
    null,
    options.onClick
      ? h(
          'button',
          {
            type: 'button',
            class: cx(row, 'active:bg-surface-elevated'),
            onclick: options.onClick,
          },
          ...body
        )
      : h('div', { class: row }, ...body)
  );
}

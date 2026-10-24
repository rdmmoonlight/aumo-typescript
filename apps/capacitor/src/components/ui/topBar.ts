import arrowLeftSvg from '@tabler/icons/outline/arrow-left.svg?raw';
import { h } from '../../core/dom';
import type { Child } from '../../core/dom';
import { createIcon } from './icon';

export interface TopBarOptions {
  title: string;
  onBack?: () => void;
  actions?: Child;
}

/** Bilah atas. Tinggi 56px (AumoDimens.TopAppBarHeight). */
export function createTopBar(options: TopBarOptions): HTMLElement {
  const back = options.onBack
    ? h(
        'button',
        {
          type: 'button',
          'aria-label': 'Kembali',
          class:
            'flex size-button items-center justify-center rounded-full active:bg-surface-elevated',
          onclick: options.onBack,
        },
        createIcon(arrowLeftSvg)
      )
    : null;

  return h(
    'header',
    {
      class:
        'sticky top-0 z-40 flex h-topbar items-center gap-sm border-b border-outline bg-background px-sm',
    },
    back,
    h('h1', { class: 'flex-1 truncate px-sm text-h4 font-bold' }, options.title),
    options.actions
  );
}

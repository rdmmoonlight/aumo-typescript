import { cx, h } from '../../core/dom';

/** Penanda posisi saat data dimuat. Ukuran lewat className (mis. "h-4 w-1/2"). */
export function createSkeleton(className?: string): HTMLDivElement {
  return h('div', {
    'aria-hidden': 'true',
    class: cx('animate-pulse rounded-lg bg-surface-elevated', className),
  });
}

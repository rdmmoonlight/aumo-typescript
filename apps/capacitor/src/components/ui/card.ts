import { cx, h } from '../../core/dom';
import type { Child } from '../../core/dom';

/** Kartu. Padding 16px (AumoDimens.CardPadding). */
export function createCard(
  options: { elevated?: boolean; className?: string },
  ...children: Child[]
): HTMLDivElement {
  return h(
    'div',
    {
      class: cx(
        'rounded-2xl border border-outline p-card',
        options.elevated ? 'bg-surface-elevated' : 'bg-surface',
        options.className
      ),
    },
    ...children
  );
}

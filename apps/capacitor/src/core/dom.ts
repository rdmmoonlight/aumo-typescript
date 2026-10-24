// Pembuat elemen DOM tanpa framework. Teks anak selalu menjadi node teks
// (bukan innerHTML), sehingga data pengguna aman dari XSS.

export type Child = Node | string | null | undefined | false;

type PropValue = string | number | boolean | null | undefined | ((event: Event) => void);
export type Props = Record<string, PropValue>;

// Diset sebagai properti DOM (bukan atribut) agar mencerminkan keadaan terkini.
const PROPERTY_KEYS = new Set(['value', 'checked', 'disabled']);

/**
 * h('button', { class: 'x', type: 'button', onclick: fn }, 'Teks')
 * - `class` -> className; `onXxx` -> addEventListener('xxx')
 * - nilai false/null/undefined dilewati; true menjadi atribut kosong
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value === null || value === undefined || value === false) continue;
      if (typeof value === 'function') {
        if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
        continue;
      }
      if (key === 'class') el.className = String(value);
      else if (PROPERTY_KEYS.has(key)) Reflect.set(el, key, value);
      else el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(el, children);
  return el;
}

export function append(parent: Node & ParentNode, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.append(child);
  }
}

/** Gabung nama kelas CSS; nilai falsy dibuang. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

let idCounter = 0;
/** ID unik untuk menghubungkan label, input, dan pesan error. */
export function uniqueId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${String(idCounter)}`;
}

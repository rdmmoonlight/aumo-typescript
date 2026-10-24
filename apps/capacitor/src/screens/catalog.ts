import calendarSvg from '@tabler/icons/outline/calendar.svg?raw';
import plusSvg from '@tabler/icons/outline/plus.svg?raw';
import trashSvg from '@tabler/icons/outline/trash.svg?raw';
import { h } from '../core/dom';
import type { Child } from '../core/dom';
import {
  createButton,
  createCard,
  createConfirmDialog,
  createIcon,
  createInput,
  createList,
  createListItem,
  createSkeleton,
  createSnackbar,
  createTopBar,
} from '../components/ui';

export interface CatalogDeps {
  onOpenCrashLog: () => void;
  onBack: () => void;
}

function section(title: string, ...children: Child[]): HTMLElement {
  return h(
    'section',
    { class: 'flex flex-col gap-lg' },
    h('h2', { class: 'text-h3 font-bold' }, title),
    ...children
  );
}

const TYPE_SCALE: [string, string][] = [
  ['text-display', 'Display 32'],
  ['text-h1', 'H1 28'],
  ['text-h2', 'H2 24'],
  ['text-h3', 'H3 20'],
  ['text-h4', 'H4 18'],
  ['text-body', 'Body 16'],
  ['text-secondary', 'Secondary 14'],
  ['text-caption', 'Caption 13'],
  ['text-label', 'Label 12'],
  ['text-label-sm', 'Label kecil 11'],
];

const COLORS: [string, string][] = [
  ['bg-primary', 'Primary'],
  ['bg-background border border-outline', 'Background'],
  ['bg-surface', 'Surface'],
  ['bg-surface-elevated', 'Elevated'],
  ['bg-good', 'Good'],
  ['bg-bad', 'Bad'],
];

/** Katalog komponen internal (Fase 3). Rute pengembangan, dibuka dari Home. */
export function mountCatalog(container: HTMLElement, deps: CatalogDeps): () => void {
  const snackbar = createSnackbar();

  const confirm = createConfirmDialog({
    title: 'Hapus entri?',
    message: 'Tindakan ini tidak dapat dibatalkan.',
    confirmText: 'Hapus',
    dismissText: 'Batal',
    destructive: true,
    onConfirm: () => {
      confirm.close();
      snackbar.show('Entri dihapus', 'short');
    },
    onDismiss: () => {
      confirm.close();
    },
  });

  const email = createInput({ label: 'Nama akun', placeholder: 'Kas' });
  const date = createInput({ label: 'Tanggal', placeholder: '2026-10-12' });
  date.setError('Format tanggal tidak valid');

  const main = h(
    'main',
    { class: 'flex flex-col gap-lg p-screen pb-24' },
    section(
      'Tombol',
      createButton({ fullWidth: true }, createIcon(plusSvg, 20), 'Tambah'),
      createButton({ variant: 'outline', fullWidth: true }, 'Batal'),
      createButton(
        {
          variant: 'danger',
          fullWidth: true,
          onClick: () => {
            confirm.open();
          },
        },
        createIcon(trashSvg, 20),
        'Hapus'
      ),
      createButton({ fullWidth: true, disabled: true }, 'Nonaktif')
    ),
    section('Input', email.el, date.el),
    section(
      'Card',
      createCard(
        {},
        h('p', { class: 'text-caption text-content-muted' }, 'Saldo kas'),
        h('p', { class: 'text-h2 font-bold' }, 'Rp35.000')
      ),
      createCard(
        { elevated: true },
        h('p', { class: 'text-secondary text-content-secondary' }, 'Kartu terangkat')
      )
    ),
    section(
      'List',
      createList([
        createListItem({
          title: 'Periode Oktober 2026',
          supporting: 'Terbuka',
          leading: createIcon(calendarSvg),
          onClick: () => {
            snackbar.show('Periode dipilih', 'short');
          },
        }),
        createListItem({
          title: 'Periode September 2026',
          supporting: 'Ditutup',
          leading: createIcon(calendarSvg),
        }),
      ])
    ),
    section(
      'Skeleton',
      createCard(
        { className: 'flex flex-col gap-sm' },
        createSkeleton('h-4 w-1/3'),
        createSkeleton('h-8 w-2/3')
      )
    ),
    section(
      'Snackbar dan Dialog',
      createButton(
        {
          variant: 'outline',
          fullWidth: true,
          onClick: () => {
            snackbar.show('Data berhasil disimpan', 'short');
          },
        },
        'Tampilkan Snackbar'
      )
    ),
    section(
      'Log',
      createButton(
        { variant: 'outline', fullWidth: true, onClick: deps.onOpenCrashLog },
        'Buka Log'
      )
    ),
    section('Tipografi', ...TYPE_SCALE.map(([cls, label]) => h('p', { class: cls }, label))),
    section(
      'Warna',
      h(
        'div',
        { class: 'grid grid-cols-3 gap-sm text-label' },
        ...COLORS.map(([cls, label]) =>
          h('div', { class: `${cls} flex h-button items-center justify-center rounded-lg` }, label)
        )
      )
    )
  );

  container.replaceChildren(
    createTopBar({
      title: 'Katalog Komponen',
      onBack: deps.onBack,
    }),
    main,
    confirm.el,
    snackbar.el
  );

  return () => {
    confirm.close();
    snackbar.destroy();
  };
}

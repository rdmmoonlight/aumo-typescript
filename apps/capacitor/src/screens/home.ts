import logoutSvg from '@tabler/icons/outline/logout.svg?raw';
import {
  createButton,
  createCard,
  createConfirmDialog,
  createIcon,
  createTopBar,
} from '../components/ui';
import { h } from '../core/dom';

export interface HomeDeps {
  fullName: string | null;
  onOpenCrashLog: () => void;
  onOpenCatalog: () => void;
  onLogout: () => void;
}

/**
 * Home sementara (Fase 5): membuktikan alur masuk-keluar. Dashboard dan menu
 * sungguhan menggantikannya di Fase 6.
 */
export function mountHome(container: HTMLElement, deps: HomeDeps): () => void {
  const confirm = createConfirmDialog({
    title: 'Keluar dari akun?',
    message: 'Anda perlu masuk kembali untuk memakai aplikasi.',
    confirmText: 'Keluar',
    dismissText: 'Batal',
    destructive: true,
    onConfirm: () => {
      confirm.close();
      deps.onLogout();
    },
    onDismiss: () => {
      confirm.close();
    },
  });

  const name = deps.fullName !== null && deps.fullName.trim() !== '' ? deps.fullName : 'Pengguna';

  container.replaceChildren(
    createTopBar({ title: 'Aumo Finance' }),
    h(
      'main',
      { class: 'flex flex-col gap-lg p-screen' },
      createCard(
        { className: 'flex flex-col gap-sm' },
        h('p', { class: 'text-caption text-content-muted' }, 'Selamat datang'),
        h('p', { class: 'text-h3 font-bold' }, name),
        h(
          'p',
          { class: 'text-secondary text-content-secondary' },
          'Dashboard dan Periods hadir di Fase 6.'
        )
      ),
      createButton(
        { variant: 'outline', fullWidth: true, onClick: deps.onOpenCrashLog },
        'Buka Log'
      ),
      createButton(
        { variant: 'outline', fullWidth: true, onClick: deps.onOpenCatalog },
        'Katalog Komponen'
      ),
      createButton(
        {
          variant: 'danger',
          fullWidth: true,
          onClick: () => {
            confirm.open();
          },
        },
        createIcon(logoutSvg, 20),
        'Keluar'
      )
    ),
    confirm.el
  );

  return () => {
    confirm.close();
  };
}

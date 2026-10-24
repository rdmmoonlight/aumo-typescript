import type { Router } from './router';

export interface BackButtonDeps {
  router: Pick<Router, 'canGoBack' | 'back' | 'currentPath'>;
  exitApp: () => void;
  /** Tutup dialog modal teratas bila ada. true bila ada yang ditutup. */
  closeOpenDialog: () => boolean;
  /** Layar yang mengabaikan tombol Back (mis. splash dan logout, sedang memproses). */
  lockedPaths: readonly string[];
}

/**
 * Urutan penanganan tombol Back Android:
 * 1. dialog terbuka -> tutup dialog
 * 2. layar terkunci -> abaikan
 * 3. ada riwayat -> kembali satu layar
 * 4. dasar riwayat -> keluar dari app
 */
export function handleBackButton(deps: BackButtonDeps): void {
  if (deps.closeOpenDialog()) return;
  const current = deps.router.currentPath();
  if (current !== null && deps.lockedPaths.includes(current)) return;
  if (deps.router.back()) return;
  deps.exitApp();
}

/**
 * Menutup <dialog> modal yang terbuka lewat event `cancel` (sama seperti tombol
 * Esc), sehingga handler onDismiss milik dialog ikut berjalan.
 */
export function closeTopDialog(doc: Document = document): boolean {
  const dialogs = doc.querySelectorAll('dialog[open]');
  const top = dialogs[dialogs.length - 1];
  if (!(top instanceof HTMLDialogElement)) return false;
  const notHandled = top.dispatchEvent(new Event('cancel', { cancelable: true }));
  if (notHandled) top.close();
  return true;
}

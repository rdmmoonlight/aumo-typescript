import { h } from '../core/dom';

export interface LogoutDeps {
  /** Menghapus sesi (memori dan penyimpanan terenkripsi). */
  signOut: () => Promise<void>;
  onDone: () => void;
  onError: (error: unknown) => void;
}

/**
 * Layar transisi tanpa konten (padanan LogoutActivity.kt): hanya latar, agar
 * tidak berkedip putih sebelum pindah ke Login. Berpindah setelah sesi dihapus,
 * termasuk bila penghapusan gagal (kegagalan dilaporkan lewat onError).
 */
export function mountLogout(container: HTMLElement, deps: LogoutDeps): () => void {
  let disposed = false;

  container.replaceChildren(
    h('main', { class: 'min-h-dvh', role: 'status', 'aria-label': 'Sedang keluar' })
  );

  void deps
    .signOut()
    .catch((error: unknown) => {
      deps.onError(error);
    })
    .finally(() => {
      if (!disposed) deps.onDone();
    });

  return () => {
    disposed = true;
  };
}

import { h } from '../core/dom';
import { createButton, createSnackbar, createTopBar } from '../components/ui';

export interface CrashLogDeps {
  readLog: () => Promise<string>;
  clearLog: () => Promise<void>;
  onBack: () => void;
}

/** Layar untuk melihat, menyalin, dan menghapus log tersimpan (padanan CrashLogScreen.kt). */
export function mountCrashLog(container: HTMLElement, deps: CrashLogDeps): () => void {
  const snackbar = createSnackbar();
  const content = h('pre', { class: 'text-label wrap-break-word whitespace-pre-wrap font-mono' });
  let disposed = false;

  const load = async () => {
    const text = await deps.readLog();
    if (!disposed) content.textContent = text;
  };

  const copy = createButton(
    {
      className: 'flex-1',
      onClick: () => {
        void (async () => {
          try {
            await navigator.clipboard.writeText(content.textContent);
            snackbar.show('Log disalin', 'short');
          } catch {
            snackbar.show('Gagal menyalin log', 'short');
          }
        })();
      },
    },
    'Copy Log'
  );

  const clear = createButton(
    {
      variant: 'danger',
      className: 'flex-1',
      onClick: () => {
        void (async () => {
          await deps.clearLog();
          await load();
          snackbar.show('Log dihapus', 'short');
        })();
      },
    },
    'Clear Log'
  );

  container.replaceChildren(
    createTopBar({ title: 'Log', onBack: deps.onBack }),
    h(
      'main',
      { class: 'flex flex-col gap-lg p-screen' },
      h('div', { class: 'flex gap-sm' }, copy, clear),
      content
    ),
    snackbar.el
  );
  void load();

  return () => {
    disposed = true;
    snackbar.destroy();
  };
}

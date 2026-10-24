import splashUrl from '../assets/images/splash_screen.png';
import { h } from '../core/dom';

/** Lama splash sebelum memeriksa sesi (SPLASH_DURATION_MS di SplashActivity.kt). */
export const SPLASH_DURATION_MS = 1200;

export interface SplashDeps {
  /** Menentukan layar tujuan (memeriksa sesi dan, bila perlu, biometrik). */
  resolveDestination: () => Promise<string>;
  onFinished: (path: string) => void;
  durationMs?: number;
}

/**
 * Splash penuh (logo + atribusi), bukan splash minimalis Android 12+. Latar putih,
 * gambar di tengah (setara SplashScreen.kt).
 */
export function mountSplash(container: HTMLElement, deps: SplashDeps): () => void {
  let disposed = false;

  container.replaceChildren(
    h(
      'main',
      { class: 'fixed inset-0 bg-white' },
      h('img', { src: splashUrl, alt: 'Aumo Finance', class: 'h-full w-full object-contain' })
    )
  );

  const timer = setTimeout(() => {
    void (async () => {
      const destination = await deps.resolveDestination();
      if (!disposed) deps.onFinished(destination);
    })();
  }, deps.durationMs ?? SPLASH_DURATION_MS);

  return () => {
    disposed = true;
    clearTimeout(timer);
  };
}

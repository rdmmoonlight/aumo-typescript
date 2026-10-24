import { App } from '@capacitor/app';
import { closeTopDialog, handleBackButton } from './backButton';
import type { Router } from './router';

/**
 * Memasang tombol Back Android. Begitu ada listener `backButton`, Capacitor
 * tidak lagi menutup app sendiri, jadi keluar dari app dilakukan eksplisit.
 * Mengembalikan fungsi pelepas.
 */
export async function installBackButton(
  router: Router,
  lockedPaths: readonly string[]
): Promise<() => Promise<void>> {
  const handle = await App.addListener('backButton', () => {
    handleBackButton({
      router,
      exitApp: () => {
        void App.exitApp();
      },
      closeOpenDialog: () => closeTopDialog(),
      lockedPaths,
    });
  });
  return () => handle.remove();
}

// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeTopDialog, handleBackButton } from './backButton';

afterEach(() => {
  document.body.replaceChildren();
});

function deps(overrides: Partial<Parameters<typeof handleBackButton>[0]> = {}) {
  const router = {
    canGoBack: vi.fn(() => true),
    back: vi.fn(() => true),
    currentPath: vi.fn(() => '/home'),
  };
  const exitApp = vi.fn();
  const closeOpenDialog = vi.fn(() => false);
  return {
    router,
    exitApp,
    closeOpenDialog,
    all: { router, exitApp, closeOpenDialog, lockedPaths: ['/splash', '/logout'], ...overrides },
  };
}

describe('handleBackButton', () => {
  it('menutup dialog lebih dulu dan tidak berpindah layar', () => {
    const d = deps();
    d.closeOpenDialog.mockReturnValue(true);
    handleBackButton(d.all);
    expect(d.router.back).not.toHaveBeenCalled();
    expect(d.exitApp).not.toHaveBeenCalled();
  });

  it('kembali satu layar bila ada riwayat', () => {
    const d = deps();
    handleBackButton(d.all);
    expect(d.router.back).toHaveBeenCalledOnce();
    expect(d.exitApp).not.toHaveBeenCalled();
  });

  it('keluar dari app di dasar riwayat', () => {
    const d = deps();
    d.router.back.mockReturnValue(false);
    handleBackButton(d.all);
    expect(d.exitApp).toHaveBeenCalledOnce();
  });

  it('layar terkunci (splash/logout) mengabaikan Back', () => {
    for (const path of ['/splash', '/logout']) {
      const d = deps();
      d.router.currentPath.mockReturnValue(path);
      handleBackButton(d.all);
      expect(d.router.back).not.toHaveBeenCalled();
      expect(d.exitApp).not.toHaveBeenCalled();
    }
  });
});

describe('closeTopDialog', () => {
  it('false bila tidak ada dialog terbuka', () => {
    expect(closeTopDialog()).toBe(false);
  });

  it('menjalankan handler cancel milik dialog; dialog tidak ditutup paksa bila ditangani', () => {
    const dialog = document.createElement('dialog');
    const onCancel = vi.fn((event: Event) => {
      event.preventDefault();
    });
    dialog.addEventListener('cancel', onCancel);
    dialog.setAttribute('open', '');
    document.body.append(dialog);

    expect(closeTopDialog()).toBe(true);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('menutup dialog yang tidak punya handler cancel', () => {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('open', '');
    document.body.append(dialog);

    expect(closeTopDialog()).toBe(true);
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});

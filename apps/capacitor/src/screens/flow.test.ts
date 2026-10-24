// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountHome } from './home';
import { mountLogout } from './logout';
import { mountSplash, SPLASH_DURATION_MS } from './splash';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('mountSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('menampilkan gambar splash, lalu menentukan tujuan setelah durasi splash', async () => {
    const root = document.createElement('div');
    const resolveDestination = vi.fn().mockResolvedValue('/home');
    const onFinished = vi.fn();
    mountSplash(root, { resolveDestination, onFinished });

    expect(root.querySelector('img')).not.toBeNull();
    await vi.advanceTimersByTimeAsync(SPLASH_DURATION_MS - 1);
    expect(resolveDestination).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolveDestination).toHaveBeenCalledOnce();
    expect(onFinished).toHaveBeenCalledWith('/home');
  });

  it('ditutup sebelum selesai: tidak ada pemeriksaan sesi maupun navigasi', async () => {
    const root = document.createElement('div');
    const resolveDestination = vi.fn().mockResolvedValue('/home');
    const onFinished = vi.fn();
    const cleanup = mountSplash(root, { resolveDestination, onFinished });
    cleanup();
    await vi.advanceTimersByTimeAsync(SPLASH_DURATION_MS * 2);
    expect(resolveDestination).not.toHaveBeenCalled();
    expect(onFinished).not.toHaveBeenCalled();
  });

  it('ditutup saat biometrik berjalan: hasilnya tidak memicu navigasi', async () => {
    const root = document.createElement('div');
    let resolve: (path: string) => void = () => undefined;
    const resolveDestination = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        })
    );
    const onFinished = vi.fn();
    const cleanup = mountSplash(root, { resolveDestination, onFinished });
    await vi.advanceTimersByTimeAsync(SPLASH_DURATION_MS);
    cleanup();
    resolve('/home');
    await vi.advanceTimersByTimeAsync(0);
    expect(onFinished).not.toHaveBeenCalled();
  });
});

describe('mountLogout', () => {
  it('menghapus sesi lebih dulu, baru berpindah', async () => {
    const root = document.createElement('div');
    const order: string[] = [];
    mountLogout(root, {
      signOut: () => {
        order.push('signOut');
        return Promise.resolve();
      },
      onDone: () => order.push('done'),
      onError: vi.fn(),
    });
    await vi.waitFor(() => {
      expect(order).toEqual(['signOut', 'done']);
    });
  });

  it('gagal menghapus sesi: dilaporkan, tetap berpindah ke Login', async () => {
    const root = document.createElement('div');
    const error = new Error('keystore');
    const onError = vi.fn();
    const onDone = vi.fn();
    mountLogout(root, { signOut: () => Promise.reject(error), onDone, onError });
    await vi.waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce();
    });
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('mountHome', () => {
  function setup(fullName: string | null = 'Ghofur') {
    const root = document.createElement('div');
    document.body.append(root);
    const deps = {
      fullName,
      onOpenCrashLog: vi.fn(),
      onOpenCatalog: vi.fn(),
      onLogout: vi.fn(),
    };
    const cleanup = mountHome(root, deps);
    const button = (label: string) =>
      [...root.querySelectorAll('button')].find((b) => b.textContent.includes(label));
    return { root, deps, cleanup, button };
  }

  it('menyapa nama pengguna; nama kosong menjadi "Pengguna"', () => {
    expect(setup('Ghofur').root.textContent).toContain('Ghofur');
    expect(setup(null).root.textContent).toContain('Pengguna');
  });

  it('nama pengguna tidak diurai sebagai HTML', () => {
    const t = setup('<img src=x onerror=alert(1)>');
    expect(t.root.querySelector('img')).toBeNull();
  });

  it('Keluar meminta konfirmasi; logout hanya berjalan setelah dikonfirmasi', () => {
    const t = setup();
    // happy-dom belum mengimplementasikan showModal; cukup tandai terbuka.
    const dialog = t.root.querySelector('dialog');
    if (!dialog) throw new Error('dialog tidak ada');
    dialog.showModal = () => {
      dialog.setAttribute('open', '');
    };

    t.button('Keluar')?.click();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(t.deps.onLogout).not.toHaveBeenCalled();

    dialog.querySelector<HTMLButtonElement>('button')?.click(); // Batal
    expect(t.deps.onLogout).not.toHaveBeenCalled();
    expect(dialog.hasAttribute('open')).toBe(false);

    t.button('Keluar')?.click();
    [...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Keluar')?.click();
    expect(t.deps.onLogout).toHaveBeenCalledOnce();
  });

  it('tombol Log dan Katalog memanggil handlernya', () => {
    const t = setup();
    t.button('Buka Log')?.click();
    t.button('Katalog Komponen')?.click();
    expect(t.deps.onOpenCrashLog).toHaveBeenCalledOnce();
    expect(t.deps.onOpenCatalog).toHaveBeenCalledOnce();
  });
});

// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountLogin, REQUIRED_FIELDS_MESSAGE, SESSION_EXPIRED_MESSAGE } from './login';
import type { LoginDeps } from './login';

afterEach(() => {
  document.body.replaceChildren();
});

function setup(overrides: Partial<LoginDeps> = {}) {
  const root = document.createElement('div');
  document.body.append(root);
  const deps: LoginDeps = {
    signIn: vi.fn().mockResolvedValue({ ok: true, fullName: 'Ghofur' }),
    loadBiometricState: vi
      .fn()
      .mockResolvedValue({ showSetupCheckbox: false, showLoginButton: false }),
    signInWithBiometric: vi.fn().mockResolvedValue({ ok: true }),
    sessionExpired: false,
    onSignedIn: vi.fn(),
    ...overrides,
  };
  const cleanup = mountLogin(root, deps);

  const must = <T>(el: T | null): T => {
    if (el === null) throw new Error('elemen tidak ditemukan');
    return el;
  };
  const email = must(root.querySelector<HTMLInputElement>('input[type="email"]'));
  const password = must(root.querySelector<HTMLInputElement>('input[type="password"]'));
  const checkboxes = [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const submit = must(root.querySelector<HTMLButtonElement>('button[type="submit"]'));
  const alert = must(root.querySelector<HTMLElement>('[role="alert"]'));
  const form = must(root.querySelector<HTMLFormElement>('form'));
  const button = (label: string) =>
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes(label));

  const fill = (e: string, p: string) => {
    email.value = e;
    password.value = p;
  };
  const send = () => {
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  };
  return { root, deps, cleanup, email, password, checkboxes, submit, alert, button, fill, send };
}

describe('mountLogin: masuk dengan kata sandi', () => {
  it('mengirim email (dipangkas) dan kata sandi apa adanya, lalu memanggil onSignedIn', async () => {
    const t = setup();
    t.fill('  a@b.c  ', ' rahasia ');
    t.send();
    await vi.waitFor(() => {
      expect(t.deps.onSignedIn).toHaveBeenCalledOnce();
    });
    expect(t.deps.signIn).toHaveBeenCalledWith({
      email: 'a@b.c',
      password: ' rahasia ',
      keepSignedIn: false,
      enableBiometric: false,
    });
  });

  it('bidang kosong: tampilkan pesan dan tidak memanggil API', () => {
    const t = setup();
    t.fill('', '');
    t.send();
    expect(t.alert.hidden).toBe(false);
    expect(t.alert.textContent).toBe(REQUIRED_FIELDS_MESSAGE);
    expect(t.deps.signIn).not.toHaveBeenCalled();
  });

  it('tombol tampil "Memproses..." dan nonaktif selama permintaan; kirim ganda diabaikan', async () => {
    let finish: (value: { ok: true; fullName: string }) => void = () => undefined;
    const signIn = vi.fn(
      () =>
        new Promise<{ ok: true; fullName: string }>((resolve) => {
          finish = resolve;
        })
    );
    const t = setup({ signIn });
    t.fill('a@b.c', 'x');
    t.send();
    t.send();
    expect(t.submit.textContent).toBe('Memproses...');
    expect(t.submit.disabled).toBe(true);
    expect(signIn).toHaveBeenCalledOnce();
    finish({ ok: true, fullName: 'Ghofur' });
    await vi.waitFor(() => {
      expect(t.deps.onSignedIn).toHaveBeenCalledOnce();
    });
  });

  it('gagal: pesan server tampil sebagai teks biasa dan tombol aktif lagi', async () => {
    const signIn = vi.fn().mockResolvedValue({ ok: false, message: '<b>Password salah</b>' });
    const t = setup({ signIn });
    t.fill('a@b.c', 'x');
    t.send();
    await vi.waitFor(() => {
      expect(t.alert.textContent).toBe('<b>Password salah</b>');
    });
    expect(t.root.querySelector('b')).toBeNull();
    expect(t.submit.disabled).toBe(false);
    expect(t.submit.textContent).toBe('Masuk');
    expect(t.deps.onSignedIn).not.toHaveBeenCalled();
  });

  it('meneruskan pilihan "Ingat saya"', async () => {
    const t = setup();
    const [keep] = t.checkboxes;
    keep.checked = true;
    t.fill('a@b.c', 'x');
    t.send();
    await vi.waitFor(() => {
      expect(t.deps.signIn).toHaveBeenCalledWith(expect.objectContaining({ keepSignedIn: true }));
    });
  });
});

describe('mountLogin: sesi berakhir', () => {
  it('menampilkan pesan sesi berakhir bila dibuka karena 401', () => {
    const t = setup({ sessionExpired: true });
    expect(t.alert.hidden).toBe(false);
    expect(t.alert.textContent).toBe(SESSION_EXPIRED_MESSAGE);
  });

  it('tanpa 401: tidak ada pesan', () => {
    const t = setup();
    expect(t.alert.hidden).toBe(true);
  });
});

describe('mountLogin: biometrik', () => {
  it('disembunyikan sebelum status biometrik dimuat dan bila tidak tersedia', async () => {
    const t = setup();
    await vi.waitFor(() => {
      expect(t.deps.loadBiometricState).toHaveBeenCalled();
    });
    expect(t.button('Masuk dengan biometrik')?.hidden).toBe(true);
    expect(t.checkboxes[1]?.closest('label')?.hidden).toBe(true);
  });

  it('setup pertama: kotak centang tampil; mencentangnya ikut mencentang "Ingat saya"', async () => {
    const t = setup({
      loadBiometricState: vi
        .fn()
        .mockResolvedValue({ showSetupCheckbox: true, showLoginButton: false }),
    });
    const [keep, setup2] = t.checkboxes;
    await vi.waitFor(() => {
      expect(setup2.closest('label')?.hidden).toBe(false);
    });
    expect(t.button('Masuk dengan biometrik')?.hidden).toBe(true);

    setup2.checked = true;
    setup2.dispatchEvent(new Event('change'));
    expect(keep.checked).toBe(true);

    t.fill('a@b.c', 'x');
    t.send();
    await vi.waitFor(() => {
      expect(t.deps.signIn).toHaveBeenCalledWith(
        expect.objectContaining({ keepSignedIn: true, enableBiometric: true })
      );
    });
  });

  it('sudah aktif: tombol biometrik tampil dan berhasil -> onSignedIn', async () => {
    const t = setup({
      loadBiometricState: vi
        .fn()
        .mockResolvedValue({ showSetupCheckbox: false, showLoginButton: true }),
    });
    await vi.waitFor(() => {
      expect(t.button('Masuk dengan biometrik')?.hidden).toBe(false);
    });
    t.button('Masuk dengan biometrik')?.click();
    await vi.waitFor(() => {
      expect(t.deps.onSignedIn).toHaveBeenCalledOnce();
    });
  });

  it('dibatalkan: tanpa pesan; gagal: pesan tampil', async () => {
    const signInWithBiometric = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, message: null })
      .mockResolvedValueOnce({ ok: false, message: 'Terlalu banyak percobaan' });
    const t = setup({
      signInWithBiometric,
      loadBiometricState: vi
        .fn()
        .mockResolvedValue({ showSetupCheckbox: false, showLoginButton: true }),
    });
    await vi.waitFor(() => {
      expect(t.button('Masuk dengan biometrik')?.hidden).toBe(false);
    });

    t.button('Masuk dengan biometrik')?.click();
    await vi.waitFor(() => {
      expect(signInWithBiometric).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(t.button('Masuk dengan biometrik')?.disabled).toBe(false);
    });
    expect(t.alert.hidden).toBe(true);

    t.button('Masuk dengan biometrik')?.click();
    await vi.waitFor(() => {
      expect(t.alert.textContent).toBe('Terlalu banyak percobaan');
    });
    expect(t.deps.onSignedIn).not.toHaveBeenCalled();
  });
});

describe('mountLogin: pembersihan', () => {
  it('hasil yang datang setelah layar ditutup tidak memicu navigasi', async () => {
    let finish: (value: { ok: true; fullName: string }) => void = () => undefined;
    const signIn = vi.fn(
      () =>
        new Promise<{ ok: true; fullName: string }>((resolve) => {
          finish = resolve;
        })
    );
    const t = setup({ signIn });
    t.fill('a@b.c', 'x');
    t.send();
    t.cleanup();
    finish({ ok: true, fullName: 'Ghofur' });
    await Promise.resolve();
    await Promise.resolve();
    expect(t.deps.onSignedIn).not.toHaveBeenCalled();
  });
});

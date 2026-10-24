// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mountCatalog } from './catalog';
import { mountCrashLog } from './crashLog';

afterEach(() => {
  document.body.replaceChildren();
});

describe('mountCatalog', () => {
  it('menampilkan semua bagian katalog dan tidak memuat HTML mentah', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const cleanup = mountCatalog(root, { onOpenCrashLog: vi.fn(), onBack: vi.fn() });
    const headings = [...root.querySelectorAll('h2')].map((el) => el.textContent);
    expect(headings).toEqual(
      expect.arrayContaining(['Tombol', 'Input', 'Card', 'List', 'Skeleton', 'Tipografi', 'Warna'])
    );
    expect(root.querySelectorAll('svg').length).toBeGreaterThan(0);
    cleanup();
  });

  it('tombol "Buka Log" memanggil onOpenCrashLog', () => {
    const root = document.createElement('div');
    const onOpenCrashLog = vi.fn();
    mountCatalog(root, { onOpenCrashLog, onBack: vi.fn() });
    const button = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Buka Log');
    button?.click();
    expect(onOpenCrashLog).toHaveBeenCalledOnce();
  });

  it('tombol kembali memanggil onBack', () => {
    const root = document.createElement('div');
    const onBack = vi.fn();
    mountCatalog(root, { onOpenCrashLog: vi.fn(), onBack });
    root.querySelector<HTMLButtonElement>('button[aria-label="Kembali"]')?.click();
    expect(onBack).toHaveBeenCalledOnce();
  });
});

describe('mountCrashLog', () => {
  it('memuat log, lalu Clear Log mengosongkan dan memuat ulang', async () => {
    const root = document.createElement('div');
    let log = 'ERROR/HTTP: GET /x -> 500';
    const clearLog = vi.fn(() => {
      log = 'Belum ada log.';
      return Promise.resolve();
    });
    const onBack = vi.fn();
    const cleanup = mountCrashLog(root, { readLog: () => Promise.resolve(log), clearLog, onBack });

    await vi.waitFor(() => {
      expect(root.querySelector('pre')?.textContent).toBe('ERROR/HTTP: GET /x -> 500');
    });

    [...root.querySelectorAll('button')].find((b) => b.textContent === 'Clear Log')?.click();
    await vi.waitFor(() => {
      expect(root.querySelector('pre')?.textContent).toBe('Belum ada log.');
    });
    expect(clearLog).toHaveBeenCalledOnce();

    root.querySelector<HTMLButtonElement>('button[aria-label="Kembali"]')?.click();
    expect(onBack).toHaveBeenCalledOnce();
    cleanup();
  });

  it('Copy Log menyalin isi ke clipboard', async () => {
    const root = document.createElement('div');
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    mountCrashLog(root, {
      readLog: () => Promise.resolve('isi log'),
      clearLog: () => Promise.resolve(),
      onBack: vi.fn(),
    });
    await vi.waitFor(() => {
      expect(root.querySelector('pre')?.textContent).toBe('isi log');
    });
    [...root.querySelectorAll('button')].find((b) => b.textContent === 'Copy Log')?.click();
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('isi log');
    });
    vi.unstubAllGlobals();
  });
});

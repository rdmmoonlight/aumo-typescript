import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_LOG_MESSAGE, Logger, MAX_LOG_CHARS, installGlobalErrorHandlers } from './logger';
import type { LogSink } from './logger';

function memorySink(initial = ''): LogSink & { text: string } {
  const sink = {
    text: initial,
    read: () => Promise.resolve(sink.text),
    write: (text: string) => {
      sink.text = text;
      return Promise.resolve();
    },
    append: (text: string) => {
      sink.text += text;
      return Promise.resolve();
    },
  };
  return sink;
}

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('log kosong menampilkan pesan bawaan', async () => {
    expect(await new Logger(memorySink()).read()).toBe(EMPTY_LOG_MESSAGE);
  });

  it('menulis baris berformat [waktu] LEVEL/TAG: pesan, berurutan', async () => {
    const logger = new Logger(memorySink());
    logger.info('A', 'satu');
    logger.warn('B', 'dua');
    logger.error('C', 'tiga');
    const text = await logger.read();
    expect(text).toMatch(/\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] INFO\/A: satu/);
    expect(text).toMatch(/WARN\/B: dua/);
    expect(text).toMatch(/ERROR\/C: tiga/);
    expect(text.indexOf('satu')).toBeLessThan(text.indexOf('dua'));
    expect(text.indexOf('dua')).toBeLessThan(text.indexOf('tiga'));
  });

  it('error menyertakan stack trace', async () => {
    const logger = new Logger(memorySink());
    logger.error('X', 'gagal', new Error('boom'));
    const text = await logger.read();
    expect(text).toContain('Error: boom');
    expect(text).toContain('logger.test.ts');
  });

  it('AbortError (pembatalan) tidak dicatat', async () => {
    const logger = new Logger(memorySink());
    const abort = new Error('dibatalkan');
    abort.name = 'AbortError';
    logger.error('X', 'batal', abort);
    expect(await logger.read()).toBe(EMPTY_LOG_MESSAGE);
  });

  it('clear mengosongkan log', async () => {
    const logger = new Logger(memorySink());
    logger.info('A', 'x');
    await logger.clear();
    expect(await logger.read()).toBe(EMPTY_LOG_MESSAGE);
  });

  it('melewati batas ukuran: separuh bagian lama dibuang, entri baru tetap ada', async () => {
    const sink = memorySink('x'.repeat(MAX_LOG_CHARS + 10));
    const logger = new Logger(sink);
    logger.info('A', 'entri-baru');
    await logger.flush();
    expect(sink.text.length).toBeLessThan(MAX_LOG_CHARS);
    expect(sink.text).toContain('entri-baru');
  });

  it('kegagalan sink tidak melempar error', async () => {
    const sink: LogSink = {
      read: () => Promise.reject(new Error('disk penuh')),
      write: () => Promise.reject(new Error('disk penuh')),
      append: () => Promise.reject(new Error('disk penuh')),
    };
    const logger = new Logger(sink);
    logger.error('A', 'x');
    await expect(logger.flush()).resolves.toBeUndefined();
    expect(await logger.read()).toBe(EMPTY_LOG_MESSAGE);
  });
});

describe('installGlobalErrorHandlers', () => {
  it('mencatat error global dan penolakan promise, lalu bisa dilepas', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const logger = new Logger(memorySink());
    const target = new EventTarget();
    const remove = installGlobalErrorHandlers(logger, target as unknown as Window);

    target.dispatchEvent(
      Object.assign(new Event('error'), { message: 'meledak', error: new Error('meledak') })
    );
    target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'ditolak' }));
    let text = await logger.read();
    expect(text).toContain('CRASH: Uncaught error: meledak');
    expect(text).toContain('CRASH: Unhandled promise rejection');
    expect(text).toContain('ditolak');

    remove();
    await logger.clear();
    target.dispatchEvent(Object.assign(new Event('error'), { message: 'lagi' }));
    text = await logger.read();
    expect(text).toBe(EMPTY_LOG_MESSAGE);
    vi.restoreAllMocks();
  });
});

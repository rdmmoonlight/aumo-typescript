import { formatLogTime } from '../format/date';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/** Penyimpanan log. Implementasi nyata: berkas lewat @capacitor/filesystem. */
export interface LogSink {
  read(): Promise<string>;
  write(text: string): Promise<void>;
  append(text: string): Promise<void>;
}

export const EMPTY_LOG_MESSAGE = 'Belum ada log.';

/** Batas ukuran berkas (karakter). Lewat batas: separuh bagian lama dibuang. */
export const MAX_LOG_CHARS = 200_000;

function describeError(error: unknown): string {
  if (error instanceof Error) return error.stack ?? `${error.name}: ${error.message}`;
  if (error === undefined || error === null) return '';
  return typeof error === 'string' ? error : JSON.stringify(error);
}

function isCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Pencatat log terpusat (padanan AppLogger.kt). Semua error (crash, kegagalan
 * HTTP, exception yang ditelan try/catch) ditulis ke satu berkas agar tampil
 * di layar CrashLog. Penulisan diantrikan supaya berurutan dan tidak pernah
 * melempar error.
 */
export class Logger {
  private readonly sink: LogSink;
  private queue: Promise<void> = Promise.resolve();
  private size: number | null = null;

  constructor(sink: LogSink) {
    this.sink = sink;
  }

  info(tag: string, message: string): void {
    console.info(`[${tag}] ${message}`);
    this.write('INFO', tag, message);
  }

  warn(tag: string, message: string): void {
    console.warn(`[${tag}] ${message}`);
    this.write('WARN', tag, message);
  }

  error(tag: string, message: string, error?: unknown): void {
    // Pembatalan (AbortError) bukan error.
    if (isCancellation(error)) return;
    console.error(`[${tag}] ${message}`, error);
    this.write('ERROR', tag, message, error);
  }

  /** Menunggu semua penulisan yang sedang antre selesai. */
  async flush(): Promise<void> {
    await this.queue;
  }

  async read(): Promise<string> {
    await this.flush();
    try {
      const text = await this.sink.read();
      return text.length > 0 ? text : EMPTY_LOG_MESSAGE;
    } catch {
      return EMPTY_LOG_MESSAGE;
    }
  }

  async clear(): Promise<void> {
    this.enqueue(async () => {
      await this.sink.write('');
      this.size = 0;
    });
    await this.flush();
  }

  private write(level: LogLevel, tag: string, message: string, error?: unknown): void {
    const trace = describeError(error);
    const entry = `\n[${formatLogTime(new Date())}] ${level}/${tag}: ${message}${trace ? `\n${trace}` : ''}\n`;
    this.enqueue(async () => {
      this.size ??= (await this.sink.read()).length;
      if (this.size > MAX_LOG_CHARS) {
        const text = await this.sink.read();
        const kept = text.slice(Math.floor(text.length / 2));
        await this.sink.write(kept);
        this.size = kept.length;
      }
      await this.sink.append(entry);
      this.size += entry.length;
    });
  }

  private enqueue(task: () => Promise<void>): void {
    this.queue = this.queue.then(task).catch(() => {
      // Logging tidak boleh menyebabkan error tambahan.
    });
  }
}

/** Tangkap error global (padanan CrashLogHandler.kt). Mengembalikan fungsi pelepas. */
export function installGlobalErrorHandlers(logger: Logger, target: Window = window): () => void {
  const onError = (event: ErrorEvent) => {
    logger.error('CRASH', `Uncaught error: ${event.message}`, event.error);
  };
  const onRejection = (event: PromiseRejectionEvent) => {
    logger.error('CRASH', 'Unhandled promise rejection', event.reason);
  };
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}

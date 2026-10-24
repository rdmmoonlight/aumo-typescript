import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import type { LogSink } from './logger';

const FILE = { path: 'crash_log.txt', directory: Directory.Data, encoding: Encoding.UTF8 } as const;

/** Log disimpan sebagai berkas di penyimpanan privat app. */
export const fileLogSink: LogSink = {
  async read() {
    try {
      const result = await Filesystem.readFile(FILE);
      return typeof result.data === 'string' ? result.data : await result.data.text();
    } catch {
      return ''; // berkas belum ada
    }
  },
  async write(text) {
    await Filesystem.writeFile({ ...FILE, data: text, recursive: true });
  },
  async append(text) {
    try {
      await Filesystem.appendFile({ ...FILE, data: text });
    } catch {
      await Filesystem.writeFile({ ...FILE, data: text, recursive: true });
    }
  },
};

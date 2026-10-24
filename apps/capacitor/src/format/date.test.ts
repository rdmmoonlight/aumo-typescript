import { describe, expect, it } from 'vitest';
import {
  formatBackendDateLong,
  formatDateLong,
  formatDateShort,
  formatLogTime,
  formatTimestamp,
  parseLocalDateTime,
  toIsoDateOnly,
  toIsoDateTime,
} from './date';

describe('parseLocalDateTime', () => {
  it('membaca tanggal dan jam sebagai waktu lokal (tanpa pergeseran UTC)', () => {
    const date = parseLocalDateTime('2026-10-05T00:00:00');
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(9);
    expect(date?.getDate()).toBe(5);
    expect(date?.getHours()).toBe(0);
  });

  it('menerima tanggal saja dan jam tanpa detik', () => {
    expect(parseLocalDateTime('2026-01-31')?.getDate()).toBe(31);
    expect(parseLocalDateTime('2026-01-31T23:59')?.getMinutes()).toBe(59);
  });

  it.each(['', 'abc', '2026-02-30', '2026-13-01', '2026-10-05T25:00:00', '05/10/2026'])(
    'menolak %j',
    (value) => {
      expect(parseLocalDateTime(value)).toBeNull();
    }
  );

  it('menerima 29 Februari tahun kabisat saja', () => {
    expect(parseLocalDateTime('2028-02-29')).not.toBeNull();
    expect(parseLocalDateTime('2026-02-29')).toBeNull();
  });
});

describe('format ISO (dikirim ke backend)', () => {
  it('toIsoDateTime pulang-pergi tanpa perubahan', () => {
    const text = '2026-10-05T14:30:09';
    const date = parseLocalDateTime(text);
    if (!date) throw new Error('parseLocalDateTime mengembalikan null');
    expect(toIsoDateTime(date)).toBe(text);
  });

  it('toIsoDateOnly selalu T00:00:00', () => {
    expect(toIsoDateOnly(new Date(2026, 9, 5, 23, 59, 59))).toBe('2026-10-05T00:00:00');
  });

  it('tanggal akhir bulan/tahun tidak bergeser', () => {
    expect(toIsoDateOnly(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31T00:00:00');
    expect(toIsoDateOnly(new Date(2027, 0, 1, 0, 0))).toBe('2027-01-01T00:00:00');
  });
});

describe('format tampilan id-ID (paritas SimpleDateFormat)', () => {
  const date = new Date(2026, 9, 5, 14, 3, 7);
  it('dd MMM yyyy', () => {
    expect(formatDateShort(date)).toBe('05 Okt 2026');
    expect(formatDateShort(new Date(2026, 7, 17))).toBe('17 Agu 2026');
  });
  it('dd MMMM yyyy', () => {
    expect(formatDateLong(date)).toBe('05 Oktober 2026');
    expect(formatDateLong(new Date(2026, 4, 1))).toBe('01 Mei 2026');
  });
  it('dd/MM HH:mm', () => {
    expect(formatTimestamp(date)).toBe('05/10 14:03');
  });
  it('baris log', () => {
    expect(formatLogTime(date)).toBe('2026-10-05 14:03:07');
  });
  it('formatBackendDateLong mengembalikan nilai asli bila tidak valid', () => {
    expect(formatBackendDateLong('2026-10-05T00:00:00')).toBe('05 Oktober 2026');
    expect(formatBackendDateLong('bukan tanggal')).toBe('bukan tanggal');
  });
});

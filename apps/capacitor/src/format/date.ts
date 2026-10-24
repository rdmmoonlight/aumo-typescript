// Tanggal dari backend berbentuk "yyyy-MM-ddTHH:mm:ss" TANPA zona waktu.
// Semua fungsi memakai komponen waktu LOKAL (bukan Date.parse / toISOString)
// agar tanggal tidak bergeser sehari akibat konversi UTC.

const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

// Singkatan locale Indonesia di Java (SimpleDateFormat "MMM"), dikunci agar
// tidak bergantung versi ICU WebView.
const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** Parse "yyyy-MM-dd" atau "yyyy-MM-ddTHH:mm[:ss]" sebagai waktu lokal. null bila tidak valid. */
export function parseLocalDateTime(value: string): Date | null {
  const m = ISO_PATTERN.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4] || '0');
  const minute = Number(m[5] || '0');
  const second = Number(m[6] || '0');
  const date = new Date(year, month - 1, day, hour, minute, second);
  const valid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hour &&
    date.getMinutes() === minute &&
    date.getSeconds() === second;
  return valid ? date : null;
}

/** "yyyy-MM-ddTHH:mm:ss" (waktu lokal), format kirim ke backend. */
export function toIsoDateTime(date: Date): string {
  return (
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** "yyyy-MM-ddT00:00:00", format kirim untuk tanggal tanpa jam. */
export function toIsoDateOnly(date: Date): string {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00`;
}

/** "05 Okt 2026" (padanan "dd MMM yyyy"). */
export function formatDateShort(date: Date): string {
  return `${pad(date.getDate())} ${MONTHS_SHORT[date.getMonth()] ?? ''} ${String(date.getFullYear())}`;
}

/** "05 Oktober 2026" (padanan "dd MMMM yyyy"). */
export function formatDateLong(date: Date): string {
  return `${pad(date.getDate())} ${MONTHS_LONG[date.getMonth()] ?? ''} ${String(date.getFullYear())}`;
}

/** "05/10 14:30" (padanan "dd/MM HH:mm"). */
export function formatTimestamp(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** "2026-10-05 14:30:00" untuk baris log. */
export function formatLogTime(date: Date): string {
  return (
    `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** Ubah string tanggal backend ke tampilan panjang. Nilai tidak valid dikembalikan apa adanya. */
export function formatBackendDateLong(value: string): string {
  const date = parseLocalDateTime(value);
  return date ? formatDateLong(date) : value;
}

/**
 * Padanan serialisasi/parsing DateTime ASP.NET (server berzona UTC) agar bentuk JSON tidak berubah.
 */

/** Seperti System.Text.Json untuk DateTime UTC: tanpa milidetik bila nol, "Z" di akhir. */
export function formatDotNetDate(date: Date): string {
    const iso = date.toISOString(); // 2026-10-01T00:00:00.000Z
    const ms = iso.slice(20, 23).replace(/0+$/, '');
    return iso.slice(0, 19) + (ms ? `.${ms}` : '') + 'Z';
}

const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/**
 * Mengurai tanggal kiriman klien. Tanggal-waktu tanpa offset dianggap UTC
 * (DateTime.SpecifyKind(..., Utc) di sumber). Mengembalikan null bila tidak valid.
 */
export function parseDotNetDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value !== 'string' || value.trim() === '') return null;
    const text = value.trim();
    const normalized = DATE_TIME.test(text) && !HAS_OFFSET.test(text) ? `${text}Z` : text;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
}

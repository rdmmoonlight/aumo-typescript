/**
 * Padanan DateTime.TryParse sumber untuk kolom tanggal Excel. Hanya hari dalam bulan yang dipakai:
 * tahun dan bulan selalu dipaksa mengikuti periode target impor.
 */
const ISO = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/;
const HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})\s*$/i;

/** Hari dalam bulan (1-31) bila teks adalah tanggal yang sah, selain itu null. */
export function parseTransactionDay(text: string): number | null {
    if (typeof text !== 'string' || text.trim() === '') return null;

    const iso = ISO.exec(text);
    if (iso) {
        const [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
        const check = new Date(Date.UTC(year, month - 1, day));
        if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
            return null;
        }
        // Tanggal-waktu dengan offset dikonversi ke UTC (server berzona UTC), seperti DateTime.TryParse.
        if (HAS_OFFSET.test(text) && text.includes('T')) {
            const parsed = new Date(text);
            return Number.isNaN(parsed.getTime()) ? null : parsed.getUTCDate();
        }
        return day;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getDate();
}

export function daysInMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Setara new DateTime(year, month, min(day, DaysInMonth)) berjenis UTC. */
export function forceToTargetMonth(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, Math.min(day, daysInMonth(year, month))));
}

const ID_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** Setara ToString("MMMM yyyy", id-ID). */
export function periodNameId(year: number, month: number): string {
    return `${ID_MONTHS[month - 1]} ${year}`;
}

export function isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

/**
 * Fixture paritas jurnal. Setiap langkah adalah satu request HTTP beserta hasil yang diharapkan.
 * Nilai yang diharapkan ditetapkan dari perilaku backend .NET (JournalEntryController,
 * TransactionNumberService, PeriodLock, JournalEntryValidatorBase), bukan dari keluaran Nest.
 * "$any" berarti nilai bebas (mis. stempel waktu yang dibuat server).
 */
export const USER = '11111111-1111-1111-1111-111111111111';
export const OTHER_USER = '22222222-2222-2222-2222-222222222222';

export interface Step {
    name: string;
    user?: string | null;
    method: 'get' | 'post' | 'put' | 'delete';
    path: string;
    body?: unknown;
    status: number;
    expect: unknown;
}

const OCT = '2026-10-05T00:00:00Z';
const two = (a: number, b: number, desc?: string) => [
    { accountId: a, debit: 100000, credit: 0, lineDescription: desc ?? 'Bayar listrik' },
    { accountId: b, debit: 0, credit: 100000, lineDescription: null },
];

export const steps: Step[] = [
    // --- penomoran ---
    {
        name: 'create General Oktober: GJ + yyMM + urut 4 digit',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { journalType: 'General', entryDate: midnight('2026-10-05'), lines: two(1, 2) },
        expect: { success: true, message: 'Journal entry GJ26100001 has been posted.', entryId: 1, transactionNumber: 'GJ26100001' },
    },
    {
        name: 'create kedua di bulan yang sama menaikkan urutan',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { entryDate: midnight('2026-10-20'), lines: two(1, 2, 'Bayar listrik') },
        expect: { success: true, message: 'Journal entry GJ26100002 has been posted.', entryId: 2, transactionNumber: 'GJ26100002' },
    },
    {
        name: 'Adjusting memakai prefix AJ dan counter sendiri',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { journalType: 'Adjusting', entryDate: midnight('2026-10-31'), lines: two(1, 2, 'Penyesuaian') },
        expect: { success: true, message: 'Journal entry AJ26100001 has been posted.', entryId: 3, transactionNumber: 'AJ26100001' },
    },
    {
        name: 'bulan lain memakai counter lain',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { entryDate: midnight('2026-11-02'), lines: two(1, 2) },
        expect: { success: true, message: 'Journal entry GJ26110001 has been posted.', entryId: 4, transactionNumber: 'GJ26110001' },
    },
    {
        name: 'counter dipisah per pengguna',
        user: OTHER_USER, method: 'post', path: '/journal-entry/create', status: 200,
        body: { entryDate: midnight('2026-10-05'), lines: two(11, 12) },
        expect: { success: true, message: 'Journal entry GJ26100001 has been posted.', entryId: 5, transactionNumber: 'GJ26100001' },
    },
    {
        name: 'next-transaction-number hanya mengintip, tidak menaikkan counter',
        method: 'get', path: '/journal-entry/next-transaction-number?journalType=General&entryDate=2026-10-05', status: 200,
        expect: { success: true, transactionNumber: 'GJ26100003' },
    },
    {
        name: 'next-transaction-number kedua kali hasilnya sama',
        method: 'get', path: '/journal-entry/next-transaction-number?journalType=General&entryDate=2026-10-05', status: 200,
        expect: { success: true, transactionNumber: 'GJ26100003' },
    },
    {
        name: 'next-transaction-number Adjusting',
        method: 'get', path: '/journal-entry/next-transaction-number?journalType=Adjusting&entryDate=2026-10-05', status: 200,
        expect: { success: true, transactionNumber: 'AJ26100002' },
    },
    {
        name: 'next-transaction-number bulan tanpa counter dimulai dari 0001',
        method: 'get', path: '/journal-entry/next-transaction-number?entryDate=2027-02-01', status: 200,
        expect: { success: true, transactionNumber: 'GJ27020001' },
    },
    {
        name: 'next-transaction-number jenis jurnal tidak valid',
        method: 'get', path: '/journal-entry/next-transaction-number?journalType=Sales', status: 400,
        expect: { success: false, message: "Journal type must be 'General' or 'Adjusting'.", errors: ["Journal type must be 'General' or 'Adjusting'."] },
    },
    {
        name: 'next-transaction-number tanggal di luar rentang',
        method: 'get', path: '/journal-entry/next-transaction-number?entryDate=1999-01-01', status: 400,
        expect: { success: false, message: 'Entry date is invalid.', errors: ['Entry date is invalid.'] },
    },

    // --- periode terkunci (September 2026 ditutup) ---
    {
        name: 'create di periode tertutup ditolak',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: midnight('2026-09-15'), lines: two(1, 2) },
        expect: { success: false, message: 'This date falls within a closed accounting period. Choose a date in an open period.' },
    },
    {
        name: 'penolakan periode tertutup tidak menghabiskan nomor urut',
        method: 'get', path: '/journal-entry/next-transaction-number?entryDate=2026-09-15', status: 200,
        expect: { success: true, transactionNumber: 'GJ26090001' },
    },
    {
        name: 'batas akhir periode tertutup tetap terkunci',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: '2026-09-30T23:59:59Z', lines: two(1, 2) },
        expect: { success: false, message: 'This date falls within a closed accounting period. Choose a date in an open period.' },
    },
    {
        name: 'tepat setelah periode tertutup masih boleh',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { entryDate: '2026-10-01T00:00:00Z', lines: two(1, 2) },
        expect: { success: true, entryId: 6, transactionNumber: 'GJ26100003' },
    },

    // --- validasi ---
    {
        name: 'tidak seimbang',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: [{ accountId: 1, debit: 100, credit: 0 }, { accountId: 2, debit: 0, credit: 99 }] },
        expect: { success: false, message: 'Total debit must equal total credit before posting.', errors: ['Total debit must equal total credit before posting.'] },
    },
    {
        name: 'kurang dari dua baris efektif',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: [{ accountId: 1, debit: 100, credit: 0 }, { accountId: 0, debit: 5, credit: 0 }] },
        expect: { success: false, message: 'A journal entry must have at least two line items.' },
    },
    {
        name: 'satu baris berisi debit dan kredit sekaligus',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: [{ accountId: 1, debit: 100, credit: 50 }, { accountId: 2, debit: 0, credit: 50 }] },
        expect: { success: false, message: 'A journal line cannot have both a debit and a credit amount.' },
    },
    {
        name: 'lebih dari dua angka desimal',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: [{ accountId: 1, debit: 10.005, credit: 0 }, { accountId: 2, debit: 0, credit: 10.005 }] },
        expect: { success: false, message: 'Amounts support at most 2 decimal places and 16 digits before the decimal point.' },
    },
    {
        name: 'akun nonaktif ditolak',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: two(1, 3) },
        expect: { success: false, message: 'One or more selected accounts are invalid or inactive.' },
    },
    {
        name: 'akun milik pengguna lain ditolak',
        method: 'post', path: '/journal-entry/create', status: 400,
        body: { entryDate: OCT, lines: two(1, 11) },
        expect: { success: false, message: 'One or more selected accounts are invalid or inactive.' },
    },
    {
        name: 'baris kosong diabaikan dan LineOrder dihitung ulang',
        method: 'post', path: '/journal-entry/create', status: 200,
        body: { entryDate: OCT, lines: [{ accountId: 0, debit: 5, credit: 0 }, ...two(1, 2), { accountId: 1, debit: 0, credit: 0 }] },
        expect: { success: true, entryId: 7, transactionNumber: 'GJ26100004' },
    },

    // --- baca ---
    {
        name: 'GET by id: bentuk entry, baris terurut, tidak terkunci',
        method: 'get', path: '/journal-entry/1', status: 200,
        expect: {
            success: true,
            entry: {
                id: 1, transactionNumber: 'GJ26100001', journalType: 'General',
                entryDate: '2026-10-05T00:00:00Z', createdAt: '$any', updatedAt: null, isLocked: false,
                lines: [
                    { id: '$any', accountId: 1, lineDescription: 'Bayar listrik', debit: 100000, credit: 0, lineOrder: 0 },
                    { id: '$any', accountId: 2, lineDescription: null, debit: 0, credit: 100000, lineOrder: 1 },
                ],
            },
        },
    },
    {
        name: 'GET milik pengguna lain: 404',
        user: OTHER_USER, method: 'get', path: '/journal-entry/1', status: 404,
        expect: { success: false, message: 'Journal entry not found.' },
    },
    { name: 'GET id tidak ada: 404', method: 'get', path: '/journal-entry/999', status: 404, expect: { success: false, message: 'Journal entry not found.' } },
    { name: 'GET id bukan angka: 404', method: 'get', path: '/journal-entry/abc', status: 404, expect: { success: false } },
    {
        name: 'GET entry di periode tertutup: isLocked true',
        method: 'get', path: '/journal-entry/100', status: 200,
        expect: { success: true, entry: { id: 100, transactionNumber: 'GJ26090099', isLocked: true } },
    },

    // --- ubah ---
    {
        name: 'edit: nomor transaksi dan createdAt tetap, updatedAt terisi',
        method: 'put', path: '/journal-entry/edit/1', status: 200,
        body: { journalType: '', entryDate: '2026-10-06T00:00:00Z', lines: [
            { accountId: 1, debit: 250000, credit: 0, lineDescription: 'Revisi' },
            { accountId: 2, debit: 0, credit: 250000 },
        ] },
        expect: { success: true, message: 'Journal entry GJ26100001 updated successfully.' },
    },
    {
        name: 'setelah edit: jenis jurnal semula dipakai, baris diganti',
        method: 'get', path: '/journal-entry/1', status: 200,
        expect: {
            success: true,
            entry: {
                id: 1, transactionNumber: 'GJ26100001', journalType: 'General',
                entryDate: '2026-10-06T00:00:00Z', createdAt: '$any', updatedAt: '$any', isLocked: false,
                lines: [
                    { accountId: 1, lineDescription: 'Revisi', debit: 250000, credit: 0, lineOrder: 0 },
                    { accountId: 2, lineDescription: null, debit: 0, credit: 250000, lineOrder: 1 },
                ],
            },
        },
    },
    {
        name: 'edit tidak boleh memindahkan ke periode tertutup',
        method: 'put', path: '/journal-entry/edit/1', status: 400,
        body: { entryDate: '2026-09-10T00:00:00Z', lines: two(1, 2) },
        expect: { success: false, message: 'Journal entry GJ26100001 falls within a closed period and cannot be modified.' },
    },
    {
        name: 'edit entri di periode tertutup ditolak',
        method: 'put', path: '/journal-entry/edit/100', status: 400,
        body: { entryDate: OCT, lines: two(1, 2) },
        expect: { success: false, message: 'Journal entry GJ26090099 falls within a closed period and cannot be modified.' },
    },
    {
        name: 'edit entri yang tidak ada',
        method: 'put', path: '/journal-entry/edit/999', status: 404,
        body: { entryDate: OCT, lines: two(1, 2) },
        expect: { success: false, message: 'Journal entry not found.' },
    },
    {
        name: 'edit tidak seimbang: validasi lebih dulu daripada pencarian',
        method: 'put', path: '/journal-entry/edit/999', status: 400,
        body: { entryDate: OCT, lines: [{ accountId: 1, debit: 1, credit: 0 }, { accountId: 2, debit: 0, credit: 2 }] },
        expect: { success: false, message: 'Total debit must equal total credit before posting.' },
    },

    // --- hapus ---
    {
        name: 'hapus entri di periode tertutup ditolak',
        method: 'delete', path: '/journal-entry/delete/100', status: 400,
        expect: { success: false, message: 'Cannot delete transactions in closed accounting periods.' },
    },
    {
        name: 'hapus entri pengguna lain: 404',
        user: OTHER_USER, method: 'delete', path: '/journal-entry/delete/2', status: 404,
        expect: { success: false, message: 'Journal entry not found.' },
    },
    {
        name: 'hapus entri',
        method: 'delete', path: '/journal-entry/delete/2', status: 200,
        expect: { success: true, message: 'Journal entry GJ26100002 deleted successfully.' },
    },
    { name: 'hapus ulang: 404', method: 'delete', path: '/journal-entry/delete/2', status: 404, expect: { success: false, message: 'Journal entry not found.' } },
    {
        name: 'nomor urut tidak dipakai ulang setelah hapus',
        method: 'get', path: '/journal-entry/next-transaction-number?entryDate=2026-10-05', status: 200,
        expect: { success: true, transactionNumber: 'GJ26100005' },
    },

    // --- pencarian deskripsi ---
    {
        name: 'search-descriptions: urut berdasarkan jumlah pemakaian lalu LineId terbaru',
        method: 'get', path: '/journal-entry/search-descriptions?q=ist', status: 200,
        expect: ['Bayar listrik'],
    },
    { name: 'search-descriptions: kurang dari 2 huruf menghasilkan daftar kosong', method: 'get', path: '/journal-entry/search-descriptions?q=a', status: 200, expect: [] },
    { name: 'search-descriptions: tanpa q menghasilkan daftar kosong', method: 'get', path: '/journal-entry/search-descriptions', status: 200, expect: [] },
    {
        name: 'search-descriptions: pencarian tidak membedakan huruf',
        method: 'get', path: '/journal-entry/search-descriptions?q=REVISI', status: 200, expect: ['Revisi'],
    },
    {
        name: 'search-descriptions: hanya milik pengguna sendiri',
        user: OTHER_USER, method: 'get', path: '/journal-entry/search-descriptions?q=ist', status: 200, expect: ['Bayar listrik'],
    },
    {
        name: 'search-descriptions: kata kunci lebih dari 100 karakter',
        method: 'get', path: `/journal-entry/search-descriptions?q=${'a'.repeat(101)}`, status: 400,
        expect: { success: false, message: 'Search keyword must not exceed 100 characters.' },
    },
    {
        name: 'tanpa header X-User-Id: 401',
        user: null, method: 'get', path: '/journal-entry/1', status: 401,
        expect: { success: false },
    },
];

/** Tanggal tanpa jam, dikirim sebagai tanggal-waktu UTC tengah malam. */
function midnight(date: string): string {
    return `${date}T00:00:00`;
}

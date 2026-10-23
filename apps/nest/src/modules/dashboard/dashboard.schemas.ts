import { ValidationMessagesError } from '../../lib/errors.js';

export type DashboardPeriod = 'monthly' | 'annual';

/** Setara GetDashboardQueryValidator: kosong, "monthly", atau "annual" (tanpa membedakan huruf). */
export function parseDashboardPeriod(period: unknown): DashboardPeriod {
    if (period === undefined || period === null || (typeof period === 'string' && period.trim() === '')) {
        return 'monthly';
    }
    if (typeof period === 'string') {
        const lower = period.toLowerCase();
        if (lower === 'monthly' || lower === 'annual') return lower;
    }
    throw new ValidationMessagesError(["Period must be 'monthly' or 'annual'."]);
}

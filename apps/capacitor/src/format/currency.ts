// Format Rupiah konsisten di seluruh app (padanan CurrencyFormatter.kt):
// "Rp 1.234.567", tanpa desimal, pemisah ribuan titik. Negatif: "-Rp 50.000".
const formatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

// Math.round JS dan Java sama-sama membulatkan .5 ke arah +tak hingga.
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? '-Rp ' : 'Rp ';
  return prefix + formatter.format(Math.abs(rounded));
}

/** Nominal murni tanpa "Rp" (baris jurnal; mata uang dinyatakan sekali di header). */
export function formatCurrencyBare(amount: number): string {
  const rounded = Math.round(amount);
  const prefix = rounded < 0 ? '-' : '';
  return prefix + formatter.format(Math.abs(rounded));
}

/** Untuk kotak input: "150000" -> "150.000" saat mengetik, tanpa "Rp". */
export function formatDigitsGrouped(rawDigits: string): string {
  if (rawDigits === '') return '';
  if (!/^\d+$/.test(rawDigits)) return rawDigits;
  return formatter.format(BigInt(rawDigits));
}

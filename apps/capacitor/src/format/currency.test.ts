import { describe, expect, it } from 'vitest';
import { formatCurrency, formatCurrencyBare, formatDigitsGrouped } from './currency';

describe('formatCurrency (paritas CurrencyFormatter.kt)', () => {
  it.each([
    [1234567, 'Rp 1.234.567'],
    [0, 'Rp 0'],
    [999, 'Rp 999'],
    [1000, 'Rp 1.000'],
    [35000, 'Rp 35.000'],
    [-50000, '-Rp 50.000'],
    [1234.4, 'Rp 1.234'],
    [1234.5, 'Rp 1.235'],
    // Math.round: .5 dibulatkan ke arah +tak hingga (sama dengan Java).
    [2.5, 'Rp 3'],
    [-2.5, '-Rp 2'],
    [-0.4, 'Rp 0'],
    [1_000_000_000, 'Rp 1.000.000.000'],
  ])('%s -> %s', (amount, expected) => {
    expect(formatCurrency(amount)).toBe(expected);
  });
});

describe('formatCurrencyBare', () => {
  it('tanpa awalan Rp', () => {
    expect(formatCurrencyBare(1500000)).toBe('1.500.000');
    expect(formatCurrencyBare(-50000)).toBe('-50.000');
    expect(formatCurrencyBare(0)).toBe('0');
  });
});

describe('formatDigitsGrouped', () => {
  it('mengelompokkan digit mentah', () => {
    expect(formatDigitsGrouped('150000')).toBe('150.000');
    expect(formatDigitsGrouped('7')).toBe('7');
  });
  it('string kosong tetap kosong, input non-digit dikembalikan apa adanya', () => {
    expect(formatDigitsGrouped('')).toBe('');
    expect(formatDigitsGrouped('12a')).toBe('12a');
  });
  it('aman untuk angka sangat besar', () => {
    expect(formatDigitsGrouped('12345678901234567890')).toBe('12.345.678.901.234.567.890');
  });
});

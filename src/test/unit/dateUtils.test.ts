import { describe, it, expect } from 'vitest';
import { getLocalDateISO, getDaysInMonth, getMonthRange, formatMonthLabel } from '../../lib/dateUtils';

describe('dateUtils', () => {
  it('getLocalDateISO should format date correctly', () => {
    // Note: this test needs to mock Date or use a fixed date
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    expect(getLocalDateISO(date)).toBe('2024-01-15');
  });

  it('getDaysInMonth should return correct days for leap and non-leap years', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29); // Leap year February
    expect(getDaysInMonth(2023, 1)).toBe(28); // Non-leap year February
    expect(getDaysInMonth(2024, 3)).toBe(30); // April
  });

  it('getMonthRange should return correct start and end boundaries', () => {
    const range = getMonthRange(2024, 1); // Feb 2024
    expect(range.start).toBe('2024-02-01');
    expect(range.end).toBe('2024-02-29');
  });

  it('formatMonthLabel should capitalize properly or format to locale', () => {
    const label = formatMonthLabel(2024, 0); // Jan 2024
    expect(label.toLowerCase()).toContain('janeiro');
    expect(label.toLowerCase()).toContain('2024');
  });
});

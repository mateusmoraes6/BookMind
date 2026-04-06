export const getLocalDateISO = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalISOString = (date: Date = new Date()): string => {
  const tzOffset = date.getTimezoneOffset() * 60000; // offset in milliseconds
  const localTime = new Date(date.getTime() - tzOffset);
  return localTime.toISOString();
};

/** Returns the number of days in a given month. Uses the local calendar. */
export const getDaysInMonth = (year: number, month: number): number => {
  // new Date(year, month + 1, 0) → last day of `month` (0-indexed)
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Returns the exact start and end date strings (YYYY-MM-DD) for a month.
 * Uses only local dates — no timezone offset issues.
 * @param year  full year, e.g. 2024
 * @param month 0-indexed month (0 = January, 11 = December)
 */
export const getMonthRange = (
  year: number,
  month: number
): { start: string; end: string } => {
  const mm = String(month + 1).padStart(2, '0');
  const lastDay = getDaysInMonth(year, month);
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
};

/**
 * Returns a human-readable month label, e.g. "Abril 2024".
 * Locale is fixed to pt-BR so it works regardless of system locale.
 */
export const formatMonthLabel = (year: number, month: number): string => {
  return new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
};

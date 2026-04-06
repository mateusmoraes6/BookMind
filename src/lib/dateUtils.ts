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

export function formatDateUTC(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  const utc3 = new Date(date.getTime());
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Europe/Moscow',
    ...options,
  };
  return utc3.toLocaleDateString('ru-RU', defaultOptions);
}

export function formatDateTimeUTC(dateStr: string): string {
  const date = new Date(dateStr);
  const utc3 = new Date(date.getTime());
  return utc3.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
}
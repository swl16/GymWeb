/** Presentation formatting, consistently using Malaysia time. */
export const date = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
) =>
  value
    ? new Date(value).toLocaleDateString('en-MY', {
        timeZone: 'Asia/Kuala_Lumpur',
        ...options,
      })
    : 'Not set';
export const time = (value: string) =>
  new Date(value).toLocaleTimeString('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
  });
export const localInput = (value: string) =>
  new Date(value)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .slice(0, 16)
    .replace(' ', 'T');

// Locale-aware time helpers — never hardcode 12/24h; defer to device.
export function formatLocalTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function endOfDay(d: Date = new Date()): Date {
  const e = new Date(d);
  e.setHours(23, 59, 0, 0);
  return e;
}

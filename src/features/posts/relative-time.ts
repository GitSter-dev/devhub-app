const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

const sameYear = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const otherYear = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });

export function relativeTime(iso: string, now: number = Date.now()): string {
  const date = new Date(iso);
  const elapsed = Math.max(0, now - date.getTime());
  if (elapsed < MINUTE) return "now";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}d`;
  return (date.getFullYear() === new Date(now).getFullYear() ? sameYear : otherYear).format(date);
}

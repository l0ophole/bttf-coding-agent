const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(locale?: string, withSeconds = false): Intl.DateTimeFormat {
  const key = `${locale ?? 'default'}|${withSeconds}`;
  let formatter = timeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' } : {}),
    });
    timeFormatters.set(key, formatter);
  }
  return formatter;
}

/** "10:24 AM" in en-US; follows the user's locale otherwise. */
export function formatTime(value: string | number | Date, locale?: string): string {
  return getTimeFormatter(locale).format(new Date(value));
}

export function formatTimeWithSeconds(value: string | number | Date, locale?: string): string {
  return getTimeFormatter(locale, true).format(new Date(value));
}

/**
 * Compact duration: "45s", "2m 14s", "2h 34m". Seconds are dropped once the
 * duration reaches an hour because they add noise at that scale.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Spoken form for screen readers: "2 minutes 14 seconds". */
export function formatDurationLong(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours) parts.push(pluralize(hours, 'hour'));
  if (minutes) parts.push(pluralize(minutes, 'minute'));
  if (!hours && (seconds || parts.length === 0)) parts.push(pluralize(seconds, 'second'));
  return parts.join(' ');
}

const numberFormatter = new Intl.NumberFormat('en-US');

/** "12,483" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}

/** Last path segment: "~/projects/web-app/server/routes/users.py" → "users.py" */
export function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  const index = trimmed.lastIndexOf('/');
  return index === -1 ? trimmed : trimmed.slice(index + 1);
}

/** Truncate text to a maximum length on a word boundary, adding an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trimEnd()}…`;
}

/** Strip the light markdown we support so text can be used in labels and search. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/^\s*(?:[-*]|\d+\.)\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

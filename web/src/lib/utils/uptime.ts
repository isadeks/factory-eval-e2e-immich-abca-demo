import { Duration } from 'luxon';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

/**
 * Formats an uptime in seconds as a short, localized duration made of the
 * two largest non-zero-leading units (e.g. "2d 3h", "5h 12m", "42s").
 */
export const formatUptime = (totalSeconds: number, locale?: string): string => {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  const days = Math.floor(seconds / SECONDS_PER_DAY);
  const hours = Math.floor((seconds % SECONDS_PER_DAY) / SECONDS_PER_HOUR);
  const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const remainder = seconds % SECONDS_PER_MINUTE;

  let parts: Partial<Record<'days' | 'hours' | 'minutes' | 'seconds', number>>;
  if (days > 0) {
    parts = { days, hours };
  } else if (hours > 0) {
    parts = { hours, minutes };
  } else if (minutes > 0) {
    parts = { minutes, seconds: remainder };
  } else {
    parts = { seconds: remainder };
  }

  return Duration.fromObject(parts, locale ? { locale } : {}).toHuman({ unitDisplay: 'short' });
};

import { DateTime } from 'luxon';
import { get } from 'svelte/store';
import { dateFormats } from '$lib/constants';
import { locale } from '$lib/stores/preferences.store';

export function parseUtcDate(date: string) {
  return DateTime.fromISO(date, { zone: 'UTC' }).toUTC();
}

export const getShortDateRange = (startTimestamp: string, endTimestamp: string) => {
  const userLocale = get(locale);
  let startDate = DateTime.fromISO(startTimestamp).setZone('UTC');
  let endDate = DateTime.fromISO(endTimestamp).setZone('UTC');

  if (userLocale) {
    startDate = startDate.setLocale(userLocale);
    endDate = endDate.setLocale(userLocale);
  }

  const endDateLocalized = endDate.toLocaleString({
    month: 'short',
    year: 'numeric',
  });

  if (startDate.year === endDate.year) {
    if (startDate.month === endDate.month) {
      // Same year and month.
      // e.g.: aug. 2024
      return endDateLocalized;
    }

    // Same year but different month.
    // e.g.: jul. - sept. 2024
    const startMonthLocalized = startDate.toLocaleString({
      month: 'short',
    });
    return `${startMonthLocalized} - ${endDateLocalized}`;
  }

  // Different year.
  // e.g.: feb. 2021 - sept. 2024
  const startDateLocalized = startDate.toLocaleString({
    month: 'short',
    year: 'numeric',
  });
  return `${startDateLocalized} - ${endDateLocalized}`;
};

const formatDate = (date?: string) => {
  if (!date) {
    return;
  }

  // without timezone
  const localDate = date.replace(/Z$/, '').replace(/\+.+$/, '');
  return localDate ? new Date(localDate).toLocaleDateString(get(locale), dateFormats.album) : undefined;
};

export const getAlbumDateRange = (album: { startDate?: string; endDate?: string }) => {
  const start = formatDate(album.startDate);
  const end = formatDate(album.endDate);

  if (start && end && start !== end) {
    return `${start} - ${end}`;
  }

  if (start) {
    return start;
  }

  return '';
};

/**
 * Month-level range of an album's photos, e.g. "Jan 2024 – Mar 2024".
 * Collapses to a single "Jan 2024" when both ends fall in the same month.
 */
export const getAlbumMonthRange = (album: { startDate?: string; endDate?: string }) => {
  const userLocale = get(locale);
  const format = (date?: string) => {
    if (!date) {
      return;
    }
    let parsed = DateTime.fromISO(date, { zone: 'UTC' });
    if (!parsed.isValid) {
      return;
    }
    if (userLocale) {
      parsed = parsed.setLocale(userLocale);
    }
    return { label: parsed.toLocaleString({ month: 'short', year: 'numeric' }), key: parsed.toFormat('yyyy-MM') };
  };

  const start = format(album.startDate);
  const end = format(album.endDate);

  if (start && end && start.key !== end.key) {
    return `${start.label} \u{2013} ${end.label}`;
  }

  return (start ?? end)?.label ?? '';
};

/**
 * Use this to convert from "5pm EST" to "5pm UTC"
 *
 * Useful with some APIs where you want to query by "today", but the values in the database are stored as UTC
 */
export const asLocalTimeISO = (date: DateTime<true>) =>
  (date.setZone('utc', { keepLocalTime: true }) as DateTime<true>).toISO();

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

type DayOfWeek = (typeof days)[number];
export const dayOfWeek = (day: DayOfWeek, options?: { locale?: string; style?: 'long' | 'short' | 'narrow' }) => {
  const fmt = new Intl.DateTimeFormat(options?.locale, { weekday: options?.style ?? 'long', timeZone: 'UTC' });
  // 2021-08-01 is a Sunday
  return fmt.format(new Date(Date.UTC(2021, 7, 1 + days.indexOf(day))));
};

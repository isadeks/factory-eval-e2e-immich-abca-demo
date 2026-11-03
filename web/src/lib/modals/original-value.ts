import { DateTime } from 'luxon';

const LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS";
const DISPLAY_FORMAT = 'yyyy-MM-dd HH:mm';

/** Initial date as a `datetime-local` string, as used for the dialog's date input. */
export const toLocalInputValue = (date: DateTime) => date.toFormat(LOCAL_FORMAT);

/**
 * Whether the date input value differs from the original one.
 *
 * Browsers may emit `datetime-local` values without seconds/milliseconds, so values are compared as date/times
 * rather than as strings.
 */
export const isDateChanged = (original: DateTime, current: string) => {
  const parsed = DateTime.fromISO(current, { zone: 'utc' });
  if (!parsed.isValid) {
    return false;
  }
  return parsed.toMillis() !== DateTime.fromISO(toLocalInputValue(original), { zone: 'utc' }).toMillis();
};

/** Human readable original date/time, e.g. `2024-05-01 10:30`. */
export const formatOriginalDate = (original: DateTime) => original.toFormat(DISPLAY_FORMAT);

/** Tint (and tooltip anchor) classes for a field that differs from its original value. */
export const changedFieldClass = 'bg-green-100! dark:bg-green-950! ring-green-500! dark:ring-green-700!';

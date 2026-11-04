import type { PersonResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';
import { derived } from 'svelte/store';
import { normalizeSearchString } from './string-utils';

export const searchNameLocal = (
  name: string,
  people: PersonResponseDto[],
  slice: number,
  personId?: string,
): PersonResponseDto[] => {
  const normalizedName = normalizeSearchString(name);
  return name.includes(' ')
    ? people
        .filter((person: PersonResponseDto) => {
          return personId
            ? normalizeSearchString(person.name).startsWith(normalizedName) && person.id !== personId
            : normalizeSearchString(person.name).startsWith(normalizedName);
        })
        .slice(0, slice)
    : people
        .filter((person: PersonResponseDto) => {
          const nameParts = person.name.split(' ');
          return personId
            ? nameParts.some((splitName) => normalizeSearchString(splitName).startsWith(normalizedName)) &&
                person.id !== personId
            : nameParts.some((splitName) => normalizeSearchString(splitName).startsWith(normalizedName));
        })
        .slice(0, slice);
};

export const getPersonNameWithHiddenValue = derived(t, ($t) => {
  return (name: string, isHidden: boolean) => $t('person_hidden', { values: { name, hidden: isHidden } });
});

export type PersonAge =
  | { key: 'age_months'; values: { months: number } }
  | { key: 'age_year_months'; values: { months: number } }
  | { key: 'age_years'; values: { years: number } };

/**
 * Returns the translation key and values describing how old a person is at `now`,
 * or `undefined` when the birth date is missing, invalid or in the future.
 */
export const getPersonAge = (
  birthDate: string | null | undefined,
  now: DateTime = DateTime.now(),
): PersonAge | undefined => {
  if (!birthDate) {
    return;
  }

  const birth = DateTime.fromISO(birthDate);
  if (!birth.isValid) {
    return;
  }

  const totalMonths = Math.floor(now.diff(birth, 'months').months);
  if (totalMonths < 0) {
    return;
  }

  if (totalMonths < 12) {
    return { key: 'age_months', values: { months: totalMonths } };
  }
  if (totalMonths < 24) {
    const months = totalMonths - 12;
    return months === 0 ? { key: 'age_years', values: { years: 1 } } : { key: 'age_year_months', values: { months } };
  }
  return { key: 'age_years', values: { years: Math.floor(totalMonths / 12) } };
};

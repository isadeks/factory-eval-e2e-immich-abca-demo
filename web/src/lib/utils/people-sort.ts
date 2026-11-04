import type { PersonResponseDto } from '@immich/sdk';

type SortablePerson = Pick<PersonResponseDto, 'name' | 'isFavorite'>;

const rank = (person: SortablePerson) => {
  if (!person.name) {
    return 2;
  }
  return person.isFavorite ? 0 : 1;
};

/**
 * Sorts people for the People page: favorite named people first, then the remaining named people, each group
 * alphabetically (case-insensitive). Unnamed people stay at the end, in their original order.
 * Does not mutate the input.
 */
export const sortPeopleByName = <T extends SortablePerson>(people: T[], locale?: string): T[] => {
  const collator = new Intl.Collator(locale, { sensitivity: 'accent', numeric: true });

  // Array.prototype.sort is stable, so ties keep their original (server-provided) order.
  return [...people].sort((a, b) => {
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0 || rank(a) === 2) {
      return rankDiff;
    }
    return collator.compare(a.name, b.name);
  });
};

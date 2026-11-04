import { sortPeopleByName } from '$lib/utils/people-sort';

const person = (id: string, name: string, isFavorite = false) => ({ id, name, isFavorite });

describe('sortPeopleByName', () => {
  it('should sort named people alphabetically', () => {
    const result = sortPeopleByName([person('1', 'Charlie'), person('2', 'Alice'), person('3', 'Bob')]);
    expect(result.map(({ name }) => name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should ignore case when sorting', () => {
    const result = sortPeopleByName([
      person('1', 'bob'),
      person('2', 'Alice'),
      person('3', 'carol'),
      person('4', 'Dave'),
    ]);
    expect(result.map(({ name }) => name)).toEqual(['Alice', 'bob', 'carol', 'Dave']);
  });

  it('should keep unnamed people at the end in their original order', () => {
    const result = sortPeopleByName([person('u1', ''), person('b', 'Bob'), person('u2', ''), person('a', 'Alice')]);
    expect(result.map(({ id }) => id)).toEqual(['a', 'b', 'u1', 'u2']);
  });

  it('should keep favorites ahead of other named people, each group alphabetical', () => {
    const result = sortPeopleByName([
      person('1', 'Alice'),
      person('2', 'zed', true),
      person('3', 'Bob'),
      person('4', 'Yan', true),
      person('5', '', true),
    ]);
    expect(result.map(({ id }) => id)).toEqual(['4', '2', '1', '3', '5']);
  });

  it('should not mutate the input', () => {
    const input = [person('1', 'b'), person('2', 'a')];
    sortPeopleByName(input);
    expect(input.map(({ id }) => id)).toEqual(['1', '2']);
  });

  it('should handle an empty list', () => {
    expect(sortPeopleByName([])).toEqual([]);
  });
});

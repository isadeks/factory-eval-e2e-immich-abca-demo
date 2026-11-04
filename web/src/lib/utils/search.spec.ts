import { getSearchInputValue } from '$lib/utils/search';

describe('getSearchInputValue', () => {
  it('returns an empty string without terms', () => {
    expect(getSearchInputValue()).toBe('');
    expect(getSearchInputValue(null)).toBe('');
    expect(getSearchInputValue({})).toBe('');
  });

  it('returns the smart search query', () => {
    expect(getSearchInputValue({ query: 'beach' })).toBe('beach');
  });

  it.each([
    ['originalFileName', 'IMG_0001.jpg'],
    ['description', 'a sunny day'],
    ['originalPath', '/library/trips'],
    ['ocr', 'invoice'],
  ] as const)('returns the %s term so it stays in the input after navigating back', (key, text) => {
    expect(getSearchInputValue({ [key]: text })).toBe(text);
  });

  it('ignores filters that are not text', () => {
    expect(getSearchInputValue({ city: 'Paris', isFavorite: true })).toBe('');
  });
});

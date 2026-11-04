import { splitByMatch } from '$lib/utils/string-utils';

describe('splitByMatch', () => {
  it('returns a single unmatched segment for an empty query', () => {
    expect(splitByMatch('beach day', '')).toEqual([{ text: 'beach day', match: false }]);
    expect(splitByMatch('beach day', ' '.repeat(3))).toEqual([{ text: 'beach day', match: false }]);
  });

  it('returns nothing for empty text', () => {
    expect(splitByMatch('', 'a')).toEqual([]);
  });

  it('returns a single unmatched segment when nothing matches', () => {
    expect(splitByMatch('beach day', 'xyz')).toEqual([{ text: 'beach day', match: false }]);
  });

  it('highlights the match case-insensitively and keeps the original casing', () => {
    expect(splitByMatch('Sunset at the Beach', 'beach')).toEqual([
      { text: 'Sunset at the ', match: false },
      { text: 'Beach', match: true },
    ]);
  });

  it('highlights every occurrence', () => {
    expect(splitByMatch('cat and Cat', 'cat')).toEqual([
      { text: 'cat', match: true },
      { text: ' and ', match: false },
      { text: 'Cat', match: true },
    ]);
  });

  it('treats regex special characters literally', () => {
    expect(splitByMatch('a.b (c) a+b', '.b')).toEqual([
      { text: 'a', match: false },
      { text: '.b', match: true },
      { text: ' (c) a+b', match: false },
    ]);
    expect(splitByMatch('x (c) y', '(c)')).toEqual([
      { text: 'x ', match: false },
      { text: '(c)', match: true },
      { text: ' y', match: false },
    ]);
  });

  it('round-trips to the original text', () => {
    const text = 'Paris, Paris & more';
    expect(
      splitByMatch(text, 'par')
        .map((s) => s.text)
        .join(''),
    ).toBe(text);
  });
});

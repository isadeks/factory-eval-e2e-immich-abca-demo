export const removeAccents = (str: string) => {
  return str.normalize('NFD').replaceAll(/[\u{300}-\u{36F}]/gu, '');
};

export const normalizeSearchString = (str: string) => {
  return removeAccents(str.toLocaleLowerCase());
};

export type TextSegment = { text: string; match: boolean };

/**
 * Splits `text` into consecutive segments, flagging the parts that match `query`
 * (case-insensitive, every occurrence). Joining the segments yields the original text.
 */
export const splitByMatch = (text: string, query: string): TextSegment[] => {
  const needle = query.trim();
  if (!needle || !text) {
    return text ? [{ text, match: false }] : [];
  }

  const pattern = new RegExp(needle.replaceAll(/[$()*+.?[\\\]^{|}]/g, String.raw`\$&`), 'giu');
  const segments: TextSegment[] = [];
  let last = 0;
  for (const found of text.matchAll(pattern)) {
    const start = found.index;
    if (start > last) {
      segments.push({ text: text.slice(last, start), match: false });
    }
    segments.push({ text: found[0], match: true });
    last = start + found[0].length;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), match: false });
  }
  return segments;
};

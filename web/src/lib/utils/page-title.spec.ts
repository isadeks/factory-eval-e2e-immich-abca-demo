import { getPageTitle } from '$lib/utils/page-title';

describe('getPageTitle', () => {
  it('uses the page title when nothing is selected', () => {
    expect(getPageTitle('Photos', undefined)).toBe('Photos - Immich');
  });

  it('falls back to a default title', () => {
    expect(getPageTitle(undefined, undefined)).toBe('Web - Immich');
  });

  it('prefixes the number of selected assets', () => {
    expect(getPageTitle('Photos', '3 selected')).toBe('(3 selected) Photos - Immich');
  });
});

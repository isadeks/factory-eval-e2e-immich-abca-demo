import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(import.meta.dirname, 'app.css'), 'utf8');

const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

describe('app theme', () => {
  it('uses purple for the legacy immich primary colors', () => {
    expect(css).toContain('--immich-primary: 126 34 206;');
    expect(css).toContain('--immich-dark-primary: 216 180 254;');
  });

  it('overrides the full @immich/ui primary scale for light and dark mode', () => {
    const [light, dark] = css.split(/^\s*\.dark \{/m, 2);
    expect(dark).toBeDefined();
    for (const shade of shades) {
      expect(light).toMatch(new RegExp(String.raw`--immich-ui-primary-${shade}: oklch\(`));
      expect(dark).toMatch(new RegExp(String.raw`--immich-ui-primary-${shade}: oklch\(`));
    }
  });

  it('no longer uses the old blue primary colors', () => {
    expect(css).not.toContain('66 80 175');
    expect(css).not.toContain('172 203 250');
  });
});

import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('app background color', () => {
  it('defines a green page background variable and applies it to the body', () => {
    const css = read('app.css');
    expect(css).toMatch(/--immich-app-background:\s*#22c55e;/);
    expect(css).toMatch(/body\s*{[^}]*background-color:\s*var\(--immich-app-background\)/);
  });

  it('paints the html element green in both themes before the app loads', () => {
    const html = read('app.html');
    expect(html).toMatch(/html\.dark,\s*html\.light\s*{\s*background-color:\s*#22c55e;/);
  });
});

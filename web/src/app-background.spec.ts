import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

describe('app background', () => {
  it('should use a yellow background for the body', () => {
    const css = read('./app.css');
    expect(css).toMatch(/\n\s*body\s*\{[^}]*background-color:\s*#ffeb3b;/);
  });

  it('should not override the body background with the bg-light class', () => {
    const html = read('./app.html');
    expect(html).toMatch(/<body class="text-dark">/);
    expect(html).not.toContain('<body class="bg-light');
  });

  it('should use yellow for the pre-hydration (FOUC) background in both themes', () => {
    const html = read('./app.html');
    expect(html).toMatch(/html\.dark\s*\{\s*background-color:\s*#ffeb3b;/);
    expect(html).toMatch(/html\.light\s*\{\s*background-color:\s*#ffeb3b;/);
  });
});

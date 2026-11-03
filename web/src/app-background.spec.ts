import { readFileSync } from 'node:fs';

describe('app.html page background', () => {
  const html = readFileSync('src/app.html', 'utf8');

  it('should use a purple background on the body for light and dark themes', () => {
    const body = html.match(/<body class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(body).toContain('bg-purple-200');
    expect(body).toContain('dark:bg-purple-900');
    expect(body).not.toContain('bg-light');
  });

  it('should use matching purple colors before the app styles load', () => {
    expect(html).toMatch(/html\.dark\s*{\s*background-color:\s*#581c87;/);
    expect(html).toMatch(/html\.light\s*{\s*background-color:\s*#e9d5ff;/);
  });
});

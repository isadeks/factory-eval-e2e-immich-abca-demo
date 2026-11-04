import { logoManager, Theme } from '@immich/ui';
import { render, screen } from '@testing-library/svelte';
import AuthPageLayout from '$lib/components/layouts/AuthPageLayout.svelte';

describe('AuthPageLayout', () => {
  it('shows the icon logo with a visible title by default', () => {
    render(AuthPageLayout, { title: 'Login', withBackdrop: false });

    const logo = screen.getByAltText('Immich logo');
    expect(logo.getAttribute('src')).toBe(logoManager.getLogo('icon', Theme.Light));
    const heading = screen.getByRole('heading', { level: 1, name: 'Login' });
    expect(heading.className).not.toContain('sr-only');
  });

  it('shows a single centered stacked logo (logo above the product name) when requested', () => {
    render(AuthPageLayout, { title: 'Login', withBackdrop: false, logoVariant: 'stacked' });

    const logo = screen.getByAltText('Immich logo');
    expect(logo.getAttribute('src')).toBe(logoManager.getLogo('stacked', Theme.Light));
    expect(logo.getAttribute('src')).not.toBe(logoManager.getLogo('icon', Theme.Light));
    expect(logo.className).toContain('mx-auto');
    // 20% smaller than the stock landing size (h-64)
    expect(logo.className).toContain('h-[12.8rem]');
    expect(logo.className).not.toContain('h-64');
    // the title stays available to assistive technology, but the wordmark is the visible product name
    expect(screen.getByRole('heading', { level: 1, name: 'Login' }).className).toContain('sr-only');
  });
});

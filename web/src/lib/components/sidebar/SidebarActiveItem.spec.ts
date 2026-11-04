import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import SideBarSection from '$lib/components/sidebar/Sidebar.svelte';

describe('Sidebar active item', () => {
  it('styles the active nav item (aria-current=page) with a 3px primary left border', () => {
    const children = createRawSnippet(() => ({
      render: () => `<div><a href="/photos" aria-current="page">Photos</a><a href="/albums">Albums</a></div>`,
    }));

    render(SideBarSection, { children });

    const nav = screen.getByTestId('sidebar-parent');
    expect(nav.classList).toContain('[&_a[aria-current=page]]:border-s-[3px]');
    expect(nav.classList).toContain('[&_a[aria-current=page]]:border-s-primary');
    expect(nav.querySelectorAll('a[aria-current="page"]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Photos' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Albums' })).not.toHaveAttribute('aria-current');
  });
});

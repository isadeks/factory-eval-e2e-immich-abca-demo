import { render, screen } from '@testing-library/svelte';
import FavoritesEmptyState from './FavoritesEmptyState.svelte';

describe('FavoritesEmptyState', () => {
  it('shows the empty-state message (translation key; tests run without a locale)', () => {
    render(FavoritesEmptyState);

    expect(screen.getByText('no_favorites_yet')).toBeInTheDocument();
  });

  it('shows a decorative heart icon', () => {
    render(FavoritesEmptyState);

    const container = screen.getByTestId('favorites-empty-state');
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('is centered and muted', () => {
    render(FavoritesEmptyState);

    const container = screen.getByTestId('favorites-empty-state');
    expect(container).toHaveClass('mx-auto', 'items-center', 'justify-center', 'text-gray-500');
  });
});

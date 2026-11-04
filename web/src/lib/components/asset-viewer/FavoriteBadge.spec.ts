import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import FavoriteBadge from './FavoriteBadge.svelte';

describe('FavoriteBadge', () => {
  it('renders an accessible favorite badge', () => {
    render(FavoriteBadge);
    const badge = screen.getByTestId('asset-viewer-favorite-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'favorite');
    expect(badge.querySelector(':scope svg path')).toBeInTheDocument();
  });
});

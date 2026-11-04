import { render, screen } from '@testing-library/svelte';
import ExplorePlacesHeader from './ExplorePlacesHeader.svelte';

describe('ExplorePlacesHeader component', () => {
  it('shows the number of places next to the Places title', () => {
    render(ExplorePlacesHeader, { count: 3 });

    expect(screen.getByText('places')).toBeInTheDocument();
    expect(screen.getByTestId('places-count')).toHaveTextContent('(3)');
  });

  it('links to the places page', () => {
    render(ExplorePlacesHeader, { count: 12 });

    expect(screen.getByTestId('places-count')).toHaveTextContent('(12)');
    expect(screen.getByRole('link', { name: 'view_all' })).toHaveAttribute('href', '/places');
  });
});

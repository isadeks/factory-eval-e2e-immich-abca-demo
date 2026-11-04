import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanelFavorite from './DetailPanelFavorite.svelte';

describe('DetailPanelFavorite', () => {
  it('shows the date the asset was favorited', () => {
    const asset = assetFactory.build({ isFavorite: true, favoritedAt: '2024-03-15T10:30:00.000Z' });

    render(DetailPanelFavorite, { props: { asset } });

    const row = screen.getByTestId('detail-panel-favorited-at');
    expect(row).toBeInTheDocument();
    expect(row).toHaveTextContent('2024');
  });

  it('renders nothing when the asset is not a favorite', () => {
    const asset = assetFactory.build({ isFavorite: false, favoritedAt: null });

    render(DetailPanelFavorite, { props: { asset } });

    expect(screen.queryByTestId('detail-panel-favorited-at')).not.toBeInTheDocument();
  });

  it('renders nothing when the favorite date is unknown', () => {
    const asset = assetFactory.build({ isFavorite: true, favoritedAt: null });

    render(DetailPanelFavorite, { props: { asset } });

    expect(screen.queryByTestId('detail-panel-favorited-at')).not.toBeInTheDocument();
  });
});

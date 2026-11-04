import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { assetFactory } from '@test-data/factories/asset-factory';
import DetailPanelOpenOriginal from './DetailPanelOpenOriginal.svelte';

describe('DetailPanelOpenOriginal', () => {
  afterEach(() => {
    authManager.reset();
  });

  it('links to the original file in a new tab for the owner', () => {
    const asset = assetFactory.build({ id: 'asset-1' });
    render(DetailPanelOpenOriginal, { asset, isOwner: true });

    const link = screen.getByRole('link', { name: 'open_original' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('href')).toContain('/assets/asset-1/original');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('does not render the link for non-owners', () => {
    const asset = assetFactory.build({ id: 'asset-1' });
    render(DetailPanelOpenOriginal, { asset, isOwner: false });

    expect(screen.queryByTestId('open-original-link')).not.toBeInTheDocument();
    expect(screen.queryByText('open_original')).not.toBeInTheDocument();
  });
});

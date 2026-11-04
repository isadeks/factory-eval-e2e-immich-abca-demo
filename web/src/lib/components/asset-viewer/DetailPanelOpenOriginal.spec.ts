import '@testing-library/jest-dom';
import { screen } from '@testing-library/svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import DetailPanel from './DetailPanel.svelte';

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: {
      init: vi.fn(),
      loadFeatureFlags: vi.fn(),
      value: { map: false },
    } as never,
  };
});

vi.mock('@immich/sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@immich/sdk')>();
  return { ...actual, getAllAlbums: vi.fn().mockResolvedValue([]) };
});

describe('DetailPanel open original link', () => {
  afterEach(() => {
    authManager.reset();
  });

  it('shows the link to the original file for the asset owner', () => {
    const ownerId = 'owner-id';
    authManager.setUser(userAdminFactory.build({ id: ownerId }));
    authManager.setPreferences(preferencesFactory.build());
    const asset = assetFactory.build({ id: 'asset-1', ownerId });

    renderWithTooltips(DetailPanel, { asset });

    const link = screen.getByTestId('detail-panel-open-original');
    expect(link).toHaveTextContent('open_original');
    expect(link).toHaveAttribute('href', expect.stringContaining('/assets/asset-1/original'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('does not show the link when the user does not own the asset', () => {
    authManager.setUser(userAdminFactory.build({ id: 'someone-else' }));
    authManager.setPreferences(preferencesFactory.build());
    const asset = assetFactory.build({ id: 'asset-1', ownerId: 'owner-id' });

    renderWithTooltips(DetailPanel, { asset });

    expect(screen.queryByTestId('detail-panel-open-original')).not.toBeInTheDocument();
  });
});

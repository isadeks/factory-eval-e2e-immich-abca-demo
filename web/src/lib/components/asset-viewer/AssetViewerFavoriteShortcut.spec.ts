import { updateAsset } from '@immich/sdk';
import { commandPaletteManager } from '@immich/ui';
import '@testing-library/jest-dom';
import { fireEvent, waitFor } from '@testing-library/svelte';
import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import AssetViewerNavBar from './AssetViewerNavBar.svelte';

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: vi.fn().mockResolvedValue((key: string) => key),
  getPreferredLocale: vi.fn(),
}));

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: {
      init: vi.fn(),
      loadFeatureFlags: vi.fn(),
      value: { smartSearch: true, trash: true },
    } as never,
  };
});

vi.mock('@immich/sdk', async () => {
  const sdk = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return { ...sdk, updateAsset: vi.fn() };
});

describe('AssetViewerNavBar favorite shortcut', () => {
  const ownerId = 'owner-id';
  const additionalProps = {
    preAction: () => {},
    onAction: () => {},
    onClose: () => {},
    isPlayingOriginalVideo: false,
    setPlayOriginalVideo: () => Promise.resolve(),
  };

  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(function () {
      return { cancel: () => {} };
    });
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
    commandPaletteManager.enable();
  });

  beforeEach(() => {
    authManager.setUser(userAdminFactory.build({ id: ownerId }));
    authManager.setPreferences(preferencesFactory.build({ cast: { gCastEnabled: false } }));
  });

  afterEach(() => {
    authManager.reset();
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('favorites a non-favorite asset when pressing "f"', async () => {
    const asset = assetFactory.build({ ownerId, isFavorite: false, isTrashed: false });
    vi.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: true });

    const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    expect(getByLabelText('to_favorite')).toBeInTheDocument();

    await fireEvent.keyDown(document.body, { key: 'f' });

    await waitFor(() =>
      expect(updateAsset).toHaveBeenCalledWith({ id: asset.id, updateAssetDto: { isFavorite: true } }),
    );
    expect(updateAsset).toHaveBeenCalledTimes(1);
  });

  it('unfavorites a favorite asset when pressing "f"', async () => {
    const asset = assetFactory.build({ ownerId, isFavorite: true, isTrashed: false });
    vi.mocked(updateAsset).mockResolvedValue({ ...asset, isFavorite: false });

    const { getByLabelText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
    expect(getByLabelText('unfavorite')).toBeInTheDocument();

    await fireEvent.keyDown(document.body, { key: 'f' });

    await waitFor(() =>
      expect(updateAsset).toHaveBeenCalledWith({ id: asset.id, updateAssetDto: { isFavorite: false } }),
    );
    expect(updateAsset).toHaveBeenCalledTimes(1);
  });

  it('does not toggle favorite when the user does not own the asset', async () => {
    const asset = assetFactory.build({ ownerId: 'someone-else', isFavorite: false, isTrashed: false });

    renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });

    await fireEvent.keyDown(document.body, { key: 'f' });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(updateAsset).not.toHaveBeenCalled();
  });
});

import '@testing-library/jest-dom';
import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import AssetViewerNavBar from './AssetViewerNavBar.svelte';

vi.mock(import('$lib/managers/feature-flags-manager.svelte'), function () {
  return {
    featureFlagsManager: {
      init: vi.fn(),
      loadFeatureFlags: vi.fn(),
      value: { smartSearch: true, trash: true },
    } as never,
  };
});

describe('AssetViewerNavBar navigation hint', () => {
  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(function () {
      return { cancel: () => {} };
    });
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
  });

  afterEach(() => {
    authManager.reset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('shows the left/right arrow keyboard hint', () => {
    authManager.setPreferences(preferencesFactory.build({ cast: { gCastEnabled: false } }));
    const asset = assetFactory.build({ isTrashed: false });
    const { getByTestId } = renderWithTooltips(AssetViewerNavBar, {
      asset,
      preAction: () => {},
      onAction: () => {},
      onClose: () => {},
      isPlayingOriginalVideo: false,
      setPlayOriginalVideo: () => {},
    });

    const hint = getByTestId('asset-viewer-navigation-hint');
    expect(hint).toBeInTheDocument();
    expect(hint).toHaveTextContent('← →');
    expect(hint).toHaveAttribute('title', 'asset_viewer_navigation_hint');
  });
});

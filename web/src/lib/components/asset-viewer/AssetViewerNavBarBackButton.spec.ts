import '@testing-library/jest-dom';
import { getResizeObserverMock } from '$lib/__mocks__/resize-observer.mock';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { renderWithTooltips } from '$tests/helpers';
import { assetFactory } from '@test-data/factories/asset-factory';
import { preferencesFactory } from '@test-data/factories/preferences-factory';
import { fireEvent } from '@testing-library/svelte';
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

describe('AssetViewerNavBar back button', () => {
  const baseProps = {
    preAction: () => {},
    onAction: () => {},
    isPlayingOriginalVideo: false,
    setPlayOriginalVideo: () => {},
  };

  beforeAll(() => {
    Element.prototype.animate = vi.fn().mockImplementation(function () {
      return { cancel: () => {} };
    });
    vi.stubGlobal('ResizeObserver', getResizeObserverMock());
  });

  beforeEach(() => {
    authManager.setPreferences(preferencesFactory.build({ cast: { gCastEnabled: false } }));
  });

  afterEach(() => {
    authManager.reset();
  });

  it('shows a visible "Back" button that calls onClose', async () => {
    const onClose = vi.fn();
    const asset = assetFactory.build({ isTrashed: false });
    const { getByTestId } = renderWithTooltips(AssetViewerNavBar, { asset, ...baseProps, onClose });

    const button = getByTestId('asset-viewer-back-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('back');

    await fireEvent.click(button);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not show the back button without an onClose handler', () => {
    const asset = assetFactory.build({ isTrashed: false });
    const { queryByTestId } = renderWithTooltips(AssetViewerNavBar, { asset, ...baseProps });
    expect(queryByTestId('asset-viewer-back-button')).not.toBeInTheDocument();
  });
});

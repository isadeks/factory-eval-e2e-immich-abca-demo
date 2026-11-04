import { render } from '@testing-library/svelte';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
import { AssetVisibility } from '@immich/sdk';
import { assetFactory } from '@test-data/factories/asset-factory';

vi.mock('$lib/utils/navigation', () => ({
  currentUrlReplaceAssetId: vi.fn(),
  isSharedLinkRoute: vi.fn().mockReturnValue(false),
}));

vi.hoisted(() => {
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    enumerable: true,
    value: vi.fn().mockImplementation(function (query) {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });
});

describe('Thumbnail archived dimming', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
  });

  const build = (visibility: AssetVisibility) =>
    assetFactory.build({ originalPath: 'image.jpg', originalMimeType: 'image/jpeg', visibility });

  it('dims archived assets when dimArchived is set', () => {
    const { getByTestId } = render(Thumbnail, { asset: build(AssetVisibility.Archive), dimArchived: true });
    expect(getByTestId('archived-dim')).toBeInTheDocument();
  });

  it('does not dim archived assets by default', () => {
    const { queryByTestId } = render(Thumbnail, { asset: build(AssetVisibility.Archive) });
    expect(queryByTestId('archived-dim')).toBeNull();
  });

  it('does not dim timeline assets when dimArchived is set', () => {
    const { queryByTestId } = render(Thumbnail, { asset: build(AssetVisibility.Timeline), dimArchived: true });
    expect(queryByTestId('archived-dim')).toBeNull();
  });
});

import { render } from '@testing-library/svelte';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
import { locale } from '$lib/stores/preferences.store';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';

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

describe('Thumbnail capture date tooltip', () => {
  beforeAll(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    locale.set('en-US');
  });

  it('shows the capture date as the hover tooltip', () => {
    const asset = timelineAssetFactory.build({
      localDateTime: { year: 2024, month: 1, day: 15, hour: 14, minute: 30, second: 0, millisecond: 0 },
    });
    const { baseElement } = render(Thumbnail, { asset });

    const container = baseElement.querySelector('[data-thumbnail-focus-container]');
    expect(container?.getAttribute('title')).toBe('Jan 15, 2024, 2:30 PM');
  });
});

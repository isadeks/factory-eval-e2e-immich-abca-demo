import { fireEvent, render } from '@testing-library/svelte';
import PlacesCardGroup from './PlacesCardGroup.svelte';

vi.mock('$lib/utils/sw-messaging', () => ({
  cancelImageUrl: vi.fn(),
}));

const makePlace = (id: string, city: string) => ({ id, exifInfo: { city } }) as never;

describe('PlacesCardGroup component', () => {
  it('renders a thumbnail image for each place', () => {
    const { baseElement } = render(PlacesCardGroup, {
      places: [makePlace('asset-1', 'Paris'), makePlace('asset-2', 'Berlin')],
    });

    expect(baseElement.querySelectorAll('img')).toHaveLength(2);
    expect(baseElement.querySelector('[data-broken-asset]')).toBeNull();
  });

  it('shows a placeholder for a place whose thumbnail fails to load', async () => {
    const { baseElement } = render(PlacesCardGroup, {
      places: [makePlace('asset-1', 'Paris'), makePlace('asset-2', 'Berlin')],
    });

    const [first] = baseElement.querySelectorAll('img');
    await fireEvent.error(first);

    expect(baseElement.querySelectorAll('[data-broken-asset]')).toHaveLength(1);
    expect(baseElement.querySelectorAll('img')).toHaveLength(1);
  });
});

import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumSummary from '../AlbumSummary.svelte';

describe('AlbumSummary component', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows the month range of the album photos', () => {
    const album = albumFactory.build({
      assetCount: 3,
      startDate: '2024-01-10T00:00:00.000Z',
      endDate: '2024-03-12T00:00:00.000Z',
    });
    const { getByTestId } = render(AlbumSummary, { album });
    expect(getByTestId('album-details')).toHaveTextContent('Jan 2024 – Mar 2024');
    expect(getByTestId('album-details')).toHaveTextContent('3 items');
  });
});

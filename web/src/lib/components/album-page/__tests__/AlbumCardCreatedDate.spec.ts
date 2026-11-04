import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumCard from '../AlbumCard.svelte';

describe('AlbumCard created date', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows the album creation date under the album title', () => {
    const album = albumFactory.build({
      albumThumbnailAssetId: null,
      albumName: 'Holiday',
      createdAt: '2024-03-15T12:00:00.000Z',
    });
    const sut = render(AlbumCard, { album });

    const name = sut.getByTestId('album-name');
    const created = sut.getByTestId('album-created-date');

    expect(created).toHaveTextContent('Mar 15, 2024');
    expect(created).toHaveClass('text-gray-500');
    expect(name.compareDocumentPosition(created) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

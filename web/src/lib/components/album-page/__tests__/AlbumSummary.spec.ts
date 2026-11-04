import { render } from '@testing-library/svelte';
import AlbumSummary from '$lib/components/album-page/AlbumSummary.svelte';
import { albumFactory } from '@test-data/factories/album-factory';

describe('AlbumSummary component', () => {
  it('shows the last-modified date of the album', () => {
    const updatedAt = '2024-03-15T12:00:00.000Z';
    const album = albumFactory.build({ updatedAt });
    const { getByTestId } = render(AlbumSummary, { album });

    const time = getByTestId('album-last-modified').querySelector('time');
    expect(time).not.toBeNull();
    expect(time?.getAttribute('datetime')).toBe(updatedAt);
    expect(time?.textContent).toContain('Mar');
    expect(time?.textContent).toContain('2024');
  });

  it('updates when the album is modified later', () => {
    const album = albumFactory.build({ updatedAt: '2023-01-10T12:00:00.000Z' });
    const { getByTestId } = render(AlbumSummary, { album });

    expect(getByTestId('album-last-modified').querySelector('time')?.textContent).toContain('2023');
  });
});

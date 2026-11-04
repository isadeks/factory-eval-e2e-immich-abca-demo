import '@testing-library/jest-dom';
import { render } from '@testing-library/svelte';
import { init, register, waitLocale } from 'svelte-i18n';
import { albumFactory } from '@test-data/factories/album-factory';
import AlbumCard from '../AlbumCard.svelte';

describe('AlbumCard password protected shared link icon', () => {
  beforeAll(async () => {
    await init({ fallbackLocale: 'en-US' });
    register('en-US', () => import('$i18n/en.json'));
    await waitLocale('en-US');
  });

  it('shows a lock icon when the album has a password protected shared link', () => {
    const album = albumFactory.build({
      albumThumbnailAssetId: null,
      shared: true,
      hasSharedLink: true,
      hasPasswordProtectedSharedLink: true,
    });
    const sut = render(AlbumCard, { album });

    const icon = sut.getByTestId('album-password-protected-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('aria-label', 'Shared with a password');
  });

  it.each([
    { hasSharedLink: false, hasPasswordProtectedSharedLink: undefined },
    { hasSharedLink: true, hasPasswordProtectedSharedLink: false },
  ])('hides the lock icon without a password protected link: %j', (flags) => {
    const album = albumFactory.build({ albumThumbnailAssetId: null, shared: flags.hasSharedLink, ...flags });
    const sut = render(AlbumCard, { album });

    expect(sut.queryByTestId('album-password-protected-icon')).not.toBeInTheDocument();
  });
});

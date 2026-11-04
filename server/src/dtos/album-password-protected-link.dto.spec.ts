import { AuthSharedLink } from 'src/database';
import { mapAlbum } from 'src/dtos/album.dto';
import { AlbumFactory } from 'test/factories/album.factory';
import { getForAlbum } from 'test/mappers';

const sharedLink = (password: string | null): AuthSharedLink => ({
  id: 'link-id',
  expiresAt: null,
  userId: 'user-id',
  albumId: 'album-id',
  showExif: true,
  allowUpload: false,
  allowDownload: true,
  password,
});

const build = (sharedLinks?: AuthSharedLink[]) =>
  mapAlbum({ ...getForAlbum(AlbumFactory.create()), sharedLinks: sharedLinks as never });

describe('mapAlbum hasPasswordProtectedSharedLink', () => {
  it('should be false without shared links', () => {
    expect(build().hasPasswordProtectedSharedLink).toBe(false);
    expect(build([]).hasPasswordProtectedSharedLink).toBe(false);
  });

  it('should be false when no shared link has a password', () => {
    const dto = build([sharedLink(null), sharedLink('')]);
    expect(dto.hasSharedLink).toBe(true);
    expect(dto.hasPasswordProtectedSharedLink).toBe(false);
  });

  it('should be true when any shared link has a password', () => {
    const dto = build([sharedLink(null), sharedLink('secret')]);
    expect(dto.hasSharedLink).toBe(true);
    expect(dto.hasPasswordProtectedSharedLink).toBe(true);
  });
});

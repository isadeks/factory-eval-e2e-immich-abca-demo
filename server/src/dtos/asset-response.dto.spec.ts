import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetFactory } from 'test/factories/asset.factory';
import { AuthFactory } from 'test/factories/auth.factory';
import { getForAsset } from 'test/mappers';

describe('mapAsset favoritedAt', () => {
  const favoritedAt = new Date('2024-03-15T10:30:00.000Z');

  it('should expose when the owner favorited the asset', () => {
    const auth = AuthFactory.create();
    const asset = AssetFactory.create({ ownerId: auth.user.id, isFavorite: true });

    const dto = mapAsset({ ...getForAsset(asset), favoritedAt }, { auth });

    expect(dto.isFavorite).toBe(true);
    expect(dto.favoritedAt).toEqual(favoritedAt.toISOString());
  });

  it('should not expose favoritedAt when the asset is not a favorite', () => {
    const auth = AuthFactory.create();
    const asset = AssetFactory.create({ ownerId: auth.user.id, isFavorite: false });

    const dto = mapAsset({ ...getForAsset(asset), favoritedAt: null }, { auth });

    expect(dto.isFavorite).toBe(false);
    expect(dto.favoritedAt).toBeNull();
  });

  it('should not expose favoritedAt to users other than the owner', () => {
    const asset = AssetFactory.create({ isFavorite: true });

    const dto = mapAsset({ ...getForAsset(asset), favoritedAt }, { auth: AuthFactory.create() });

    expect(dto.isFavorite).toBe(false);
    expect(dto.favoritedAt).toBeNull();
  });
});

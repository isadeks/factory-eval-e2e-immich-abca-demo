import { mapAsset } from 'src/dtos/asset-response.dto';
import { AssetFactory } from 'test/factories/asset.factory';

describe('mapAsset', () => {
  it('should not set deletedAt for an asset that is not trashed', () => {
    const dto = mapAsset(AssetFactory.create({ deletedAt: null }));

    expect(dto.isTrashed).toBe(false);
    expect(dto.deletedAt).toBeUndefined();
  });

  it('should set deletedAt for a trashed asset', () => {
    const deletedAt = new Date('2024-03-05T12:00:00.000Z');
    const dto = mapAsset(AssetFactory.create({ deletedAt }));

    expect(dto.isTrashed).toBe(true);
    expect(dto.deletedAt).toBe('2024-03-05T12:00:00.000Z');
  });
});

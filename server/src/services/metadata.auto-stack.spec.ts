import { Stats } from 'node:fs';
import { ImmichWorker } from 'src/enum';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { MetadataService } from 'src/services/metadata.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { getForMetadataExtraction } from 'test/mappers';
import { newTestService, ServiceMocks } from 'test/utils';

describe(`${MetadataService.name} auto stacking`, () => {
  let sut: MetadataService;
  let mocks: ServiceMocks;

  const mockReadTags = (exifData?: Partial<ImmichTags>) => {
    mocks.metadata.readTags.mockReset();
    mocks.metadata.readTags.mockResolvedValueOnce(exifData ?? {});
    mocks.metadata.readTags.mockResolvedValueOnce({});
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(MetadataService));
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    const time = new Date('2022-01-01T00:00:00.000Z');
    mocks.storage.stat.mockResolvedValue({
      size: 123_456,
      mtime: time,
      mtimeMs: time.valueOf(),
      birthtimeMs: time.valueOf(),
    } as Stats);
  });

  it('should not look for matches when the asset has no burst id', async () => {
    const asset = AssetFactory.create();
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    mockReadTags({});

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.stack.findAutoStackMatches).not.toHaveBeenCalled();
    expect(mocks.stack.create).not.toHaveBeenCalled();
  });

  it('should not create a stack when no other asset shares the burst id', async () => {
    const asset = AssetFactory.create();
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    mocks.stack.findAutoStackMatches.mockResolvedValue([{ id: asset.id, stackId: null }]);
    mockReadTags({ BurstID: 'burst-1' });

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.stack.findAutoStackMatches).toHaveBeenCalledWith({ ownerId: asset.ownerId, autoStackId: 'burst-1' });
    expect(mocks.stack.create).not.toHaveBeenCalled();
    expect(mocks.event.emit).not.toHaveBeenCalledWith('StackCreate', expect.anything());
  });

  it('should create a stack with the earliest asset as primary when assets share a burst id', async () => {
    const asset = AssetFactory.create();
    const other = AssetFactory.create({ ownerId: asset.ownerId });
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    mocks.stack.findAutoStackMatches.mockResolvedValue([
      { id: other.id, stackId: null },
      { id: asset.id, stackId: null },
    ]);
    mocks.stack.create.mockResolvedValue({ id: 'stack-1' } as never);
    mockReadTags({ BurstID: 'burst-1' });

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.stack.create).toHaveBeenCalledWith({ ownerId: asset.ownerId }, [other.id, asset.id]);
    expect(mocks.event.emit).toHaveBeenCalledWith('StackCreate', { stackId: 'stack-1', userId: asset.ownerId });
  });

  it('should add the asset to the existing stack of its burst', async () => {
    const asset = AssetFactory.create();
    const other = AssetFactory.create({ ownerId: asset.ownerId });
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    mocks.stack.findAutoStackMatches.mockResolvedValue([
      { id: other.id, stackId: 'stack-1' },
      { id: asset.id, stackId: null },
    ]);
    mockReadTags({ BurstID: 'burst-1' });

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, stackId: 'stack-1' });
    expect(mocks.event.emit).toHaveBeenCalledWith('StackUpdate', { stackId: 'stack-1', userId: asset.ownerId });
    expect(mocks.stack.create).not.toHaveBeenCalled();
  });

  it('should not move an asset that is already in a stack', async () => {
    const asset = AssetFactory.create();
    const other = AssetFactory.create({ ownerId: asset.ownerId });
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    mocks.stack.findAutoStackMatches.mockResolvedValue([
      { id: other.id, stackId: 'stack-1' },
      { id: asset.id, stackId: 'stack-2' },
    ]);
    mockReadTags({ BurstID: 'burst-1' });

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.asset.update).not.toHaveBeenCalledWith({ id: asset.id, stackId: expect.anything() });
    expect(mocks.stack.create).not.toHaveBeenCalled();
  });

  it('should ignore assets that are not visible in the timeline', async () => {
    const asset = AssetFactory.create();
    const other = AssetFactory.create({ ownerId: asset.ownerId });
    mocks.assetJob.getForMetadataExtraction.mockResolvedValue(getForMetadataExtraction(asset));
    // the repository only returns timeline assets, so the archived/hidden asset itself is missing
    mocks.stack.findAutoStackMatches.mockResolvedValue([{ id: other.id, stackId: null }]);
    mockReadTags({ BurstID: 'burst-1' });

    await sut.handleMetadataExtraction({ id: asset.id });

    expect(mocks.stack.create).not.toHaveBeenCalled();
  });
});

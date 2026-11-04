import { ForbiddenException } from '@nestjs/common';
import { mapSharedLink } from 'src/dtos/shared-link.dto';
import { SharedLinkService } from 'src/services/shared-link.service';
import { SharedLinkFactory } from 'test/factories/shared-link.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { getForSharedLink } from 'test/mappers';
import { newTestService, ServiceMocks } from 'test/utils';

describe(`${SharedLinkService.name} view count`, () => {
  let sut: SharedLinkService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SharedLinkService));
  });

  describe('mapSharedLink', () => {
    it('should expose the view count', () => {
      const sharedLink = { ...getForSharedLink(SharedLinkFactory.create()), viewCount: 7 };
      expect(mapSharedLink(sharedLink, { stripAssetMetadata: false }).viewCount).toBe(7);
    });

    it('should default the view count to 0 for a link that was never viewed', () => {
      const sharedLink = getForSharedLink(SharedLinkFactory.create());
      expect(mapSharedLink({ ...sharedLink, viewCount: null }, { stripAssetMetadata: false }).viewCount).toBe(0);
      expect(mapSharedLink(sharedLink, { stripAssetMetadata: false }).viewCount).toBe(0);
    });
  });

  describe('recordView', () => {
    it('should only work for a public user', async () => {
      await expect(sut.recordView(authStub.admin)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mocks.sharedLink.incrementViewCount).not.toHaveBeenCalled();
    });

    it('should count a view of the shared link', async () => {
      mocks.sharedLink.incrementViewCount.mockResolvedValue();

      await sut.recordView(authStub.adminSharedLink);

      expect(mocks.sharedLink.incrementViewCount).toHaveBeenCalledTimes(1);
      expect(mocks.sharedLink.incrementViewCount).toHaveBeenCalledWith(authStub.adminSharedLink.sharedLink?.id);
    });
  });
});

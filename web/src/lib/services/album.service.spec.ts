import { addUsersToAlbum, AlbumUserRole } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { handleAddUsersToAlbum } from '$lib/services/album.service';
import { albumFactory } from '@test-data/factories/album-factory';
import { userFactory } from '@test-data/factories/user-factory';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  addUsersToAlbum: vi.fn().mockResolvedValue({}),
}));

describe('AlbumService', () => {
  describe('handleAddUsersToAlbum', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.spyOn(eventManager, 'emit').mockReturnValue(undefined as never);
    });

    it('should add users as editors by default', async () => {
      const album = albumFactory.build();
      const user = userFactory.build();

      await expect(handleAddUsersToAlbum(album, [user])).resolves.toBe(true);

      expect(addUsersToAlbum).toHaveBeenCalledWith({
        id: album.id,
        addUsersDto: { albumUsers: [{ userId: user.id, role: AlbumUserRole.Editor }] },
      });
    });

    it('should add users with the requested role', async () => {
      const album = albumFactory.build();
      const [user1, user2] = userFactory.buildList(2);

      await expect(handleAddUsersToAlbum(album, [user1, user2], AlbumUserRole.Viewer)).resolves.toBe(true);

      expect(addUsersToAlbum).toHaveBeenCalledWith({
        id: album.id,
        addUsersDto: {
          albumUsers: [
            { userId: user1.id, role: AlbumUserRole.Viewer },
            { userId: user2.id, role: AlbumUserRole.Viewer },
          ],
        },
      });
    });
  });
});

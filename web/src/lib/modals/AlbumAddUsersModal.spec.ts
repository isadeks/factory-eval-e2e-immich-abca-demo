import { AlbumUserRole } from '@immich/sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { getAnimateMock } from '$lib/__mocks__/animate.mock';
import { getIntersectionObserverMock } from '$lib/__mocks__/intersection-observer.mock';
import { getVisualViewportMock } from '$lib/__mocks__/visual-viewport.mock';
import { handleAddUsersToAlbum } from '$lib/services/album.service';
import { albumFactory } from '@test-data/factories/album-factory';
import { userAdminFactory } from '@test-data/factories/user-factory';
import AlbumAddUsersModal from './AlbumAddUsersModal.svelte';

const users = vi.hoisted(() => [] as unknown[]);

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  searchUsers: vi.fn().mockImplementation(() => Promise.resolve(users)),
}));

vi.mock('$lib/services/album.service', () => ({
  handleAddUsersToAlbum: vi.fn().mockResolvedValue(true),
}));

describe('AlbumAddUsersModal component', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', getIntersectionObserverMock());
    vi.stubGlobal('visualViewport', getVisualViewportMock());
    vi.clearAllMocks();
    Element.prototype.animate = getAnimateMock();
    users.length = 0;
    users.push(userAdminFactory.build({ name: 'Alice Example', email: 'alice@example.com' }));
  });

  afterAll(async () => {
    await waitFor(() => {
      expect(document.body.style.pointerEvents).not.toBe('none');
    });
  });

  const selectAliceAndSubmit = async () => {
    await fireEvent.click(await screen.findByText('Alice Example'));
    await fireEvent.click(screen.getByRole('button', { name: /^add$/i }));
  };

  test('shares with the Editor role by default', async () => {
    const album = albumFactory.build();
    render(AlbumAddUsersModal, { props: { album, onClose } });

    await selectAliceAndSubmit();

    await waitFor(() => expect(handleAddUsersToAlbum).toHaveBeenCalledTimes(1));
    expect(handleAddUsersToAlbum).toHaveBeenCalledWith(
      album,
      [expect.objectContaining({ name: 'Alice Example' })],
      AlbumUserRole.Editor,
    );
  });

  test('shares with the Viewer role when it is picked', async () => {
    const album = albumFactory.build();
    render(AlbumAddUsersModal, { props: { album, onClose } });

    await screen.findByText('Alice Example');
    await fireEvent.keyDown(screen.getByText('role_editor').closest('button')!, { key: 'ArrowDown' });
    const viewer = await screen.findByRole('option', { name: 'role_viewer' });
    await fireEvent.pointerUp(viewer);
    await fireEvent.click(viewer);
    await selectAliceAndSubmit();

    await waitFor(() => expect(handleAddUsersToAlbum).toHaveBeenCalledTimes(1));
    expect(handleAddUsersToAlbum).toHaveBeenCalledWith(
      album,
      [expect.objectContaining({ name: 'Alice Example' })],
      AlbumUserRole.Viewer,
    );
  });
});

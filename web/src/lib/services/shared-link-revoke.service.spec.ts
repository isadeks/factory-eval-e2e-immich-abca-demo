import type { ServerConfigDto } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { getRevokeSharedLinkPrompt, handleDeleteSharedLink } from '$lib/services/shared-link.service';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';

vi.mock(import('$lib/managers/server-config-manager.svelte'), () => ({
  serverConfigManager: {
    value: { externalDomain: 'http://localhost:2283' } as ServerConfigDto,
    init: vi.fn(),
    loadServerConfig: vi.fn(),
  },
}));

const $t = vi.fn((key: string, options?: { values?: Record<string, string> }) =>
  options?.values ? `${key}:${JSON.stringify(options.values)}` : key,
);

describe('shared link revoke confirmation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should include the expiry date in the prompt', () => {
    const expiresAt = '2030-05-17T10:30:00.000Z';
    const prompt = getRevokeSharedLinkPrompt($t as never, sharedLinkFactory.build({ expiresAt }));
    expect(prompt).toContain('confirm_revoke_shared_link_expires');
    expect(prompt).toContain('2030');
  });

  it('should say the link never expires when there is no expiry', () => {
    expect(getRevokeSharedLinkPrompt($t as never, sharedLinkFactory.build({ expiresAt: null }))).toBe(
      'confirm_revoke_shared_link_never_expires',
    );
  });

  it('should ask for confirmation with a revoke button before deleting', async () => {
    const showDialog = vi.spyOn(modalManager, 'showDialog').mockResolvedValue(false);
    await handleDeleteSharedLink(sharedLinkFactory.build({ expiresAt: null }));
    expect(showDialog).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.any(String), confirmText: expect.any(String) }),
    );
  });
});

import type { ServerConfigDto } from '@immich/sdk';
import { fireEvent, screen } from '@testing-library/svelte';
import { copyToClipboard } from '$lib/utils';
import { renderWithTooltips } from '$tests/helpers';
import { sharedLinkFactory } from '@test-data/factories/shared-link-factory';
import SharedLinkCard from './SharedLinkCard.svelte';

vi.mock('$lib/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/utils')>()),
  copyToClipboard: vi.fn(),
}));

vi.mock(import('$lib/managers/server-config-manager.svelte'), () => ({
  serverConfigManager: {
    value: { externalDomain: 'http://localhost:2283' } as ServerConfigDto,
    init: vi.fn(),
    loadServerConfig: vi.fn(),
  },
}));

describe('SharedLinkCard component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('shows "Copied" on the copy button for 2 seconds after copying', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true);
    renderWithTooltips(SharedLinkCard, { sharedLink: sharedLinkFactory.build() });

    await fireEvent.click(screen.getByRole('button', { name: 'copy_link' }));

    expect(copyToClipboard).toHaveBeenCalledOnce();
    const copied = await screen.findByRole('button', { name: 'copied' });
    expect(copied).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'copy_link' })).not.toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1999);
    expect(screen.getByRole('button', { name: 'copied' })).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(1);
    expect(screen.getByRole('button', { name: 'copy_link' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'copied' })).not.toBeInTheDocument();
  });

  it('does not show "Copied" when copying fails', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(false);
    renderWithTooltips(SharedLinkCard, { sharedLink: sharedLinkFactory.build() });

    await fireEvent.click(screen.getByRole('button', { name: 'copy_link' }));
    await vi.advanceTimersByTimeAsync(0);

    expect(screen.getByRole('button', { name: 'copy_link' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'copied' })).not.toBeInTheDocument();
  });
});

import { getQueue } from '@immich/sdk';
import { LIBRARY_SCAN_POLL_INTERVAL, LibraryScanManager } from '$lib/managers/library-scan-manager.svelte';

vi.mock('@immich/sdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@immich/sdk')>()),
  getQueue: vi.fn(),
}));

const queue = (active: number, waiting: number) =>
  ({ statistics: { active, waiting } }) as Awaited<ReturnType<typeof getQueue>>;

describe('LibraryScanManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getQueue).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is not scanning initially', () => {
    const manager = new LibraryScanManager();
    expect(manager.isScanning('library-1')).toBe(false);
    expect(manager.isScanningAny).toBe(false);
  });

  it('shows a scan as running until the library queue is idle', async () => {
    vi.mocked(getQueue)
      .mockResolvedValueOnce(queue(1, 0))
      .mockResolvedValueOnce(queue(0, 2))
      .mockResolvedValue(queue(0, 0));
    const manager = new LibraryScanManager();

    manager.start('library-1');
    expect(manager.isScanning('library-1')).toBe(true);
    expect(manager.isScanning('library-2')).toBe(false);

    await vi.advanceTimersByTimeAsync(0);
    expect(manager.isScanning('library-1')).toBe(true);

    await vi.advanceTimersByTimeAsync(LIBRARY_SCAN_POLL_INTERVAL);
    expect(manager.isScanning('library-1')).toBe(true);

    await vi.advanceTimersByTimeAsync(LIBRARY_SCAN_POLL_INTERVAL);
    expect(manager.isScanning('library-1')).toBe(false);
    expect(getQueue).toHaveBeenCalledTimes(3);
  });

  it('marks every library as scanning when scanning all libraries', async () => {
    vi.mocked(getQueue).mockResolvedValueOnce(queue(1, 0)).mockResolvedValue(queue(0, 0));
    const manager = new LibraryScanManager();

    manager.start();
    expect(manager.isScanning('any-library')).toBe(true);

    await vi.advanceTimersByTimeAsync(LIBRARY_SCAN_POLL_INTERVAL);
    expect(manager.isScanning('any-library')).toBe(false);
  });

  it('stops showing the spinner when the queue cannot be fetched', async () => {
    vi.mocked(getQueue).mockRejectedValue(new Error('boom'));
    const manager = new LibraryScanManager();

    manager.start('library-1');
    await vi.advanceTimersByTimeAsync(0);

    expect(manager.isScanning('library-1')).toBe(false);
  });

  it('polls once when several scans are started', async () => {
    vi.mocked(getQueue).mockResolvedValueOnce(queue(1, 0)).mockResolvedValue(queue(0, 0));
    const manager = new LibraryScanManager();

    manager.start('library-1');
    manager.start('library-2');
    await vi.advanceTimersByTimeAsync(LIBRARY_SCAN_POLL_INTERVAL);

    expect(getQueue).toHaveBeenCalledTimes(2);
    expect(manager.isScanningAny).toBe(false);
  });
});

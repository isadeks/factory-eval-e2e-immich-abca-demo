import { getQueue, QueueName } from '@immich/sdk';
import { SvelteSet } from 'svelte/reactivity';

export const LIBRARY_SCAN_POLL_INTERVAL = 1000;

/**
 * Tracks which libraries are being scanned. A scan is queued on the server, so the library queue is polled
 * until it has no active or waiting jobs left.
 */
export class LibraryScanManager {
  #libraryIds = new SvelteSet<string>();
  #all = $state(false);
  #polling = false;

  isScanning(libraryId: string) {
    return this.#all || this.#libraryIds.has(libraryId);
  }

  get isScanningAny() {
    return this.#all || this.#libraryIds.size > 0;
  }

  /** Mark a single library as scanning, or every library when no id is given. */
  start(libraryId?: string) {
    if (libraryId === undefined) {
      this.#all = true;
    } else {
      this.#libraryIds.add(libraryId);
    }
    void this.#poll();
  }

  #clear() {
    this.#all = false;
    this.#libraryIds.clear();
  }

  async #poll() {
    if (this.#polling) {
      return;
    }

    this.#polling = true;
    try {
      while (this.isScanningAny) {
        try {
          const { statistics } = await getQueue({ name: QueueName.Library });
          if (statistics.active + statistics.waiting === 0) {
            break;
          }
        } catch {
          break;
        }
        await new Promise<void>((resolve) => setTimeout(resolve, LIBRARY_SCAN_POLL_INTERVAL));
      }
    } finally {
      this.#clear();
      this.#polling = false;
    }
  }
}

export const libraryScanManager = new LibraryScanManager();

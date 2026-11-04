import { TIMELINE_GRID_GAP } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import { getJustifiedLayoutFromAssets } from '$lib/utils/layout-utils';
import { timelineAssetFactory } from '@test-data/factories/asset-factory';

describe('timeline grid gap', () => {
  it('separates neighbouring thumbnails by 2px', () => {
    const timelineManager = new TimelineManager();
    timelineManager.viewportWidth = 1000;
    const options = timelineManager.justifiedLayoutOptions;
    expect(TIMELINE_GRID_GAP).toBe(2);
    expect(options.spacing).toBe(TIMELINE_GRID_GAP);

    const assets = timelineAssetFactory.buildList(6, { ratio: 1.5 });
    const layout = getJustifiedLayoutFromAssets(assets, options);

    for (let i = 0; i < assets.length - 1; i++) {
      const current = layout.getPosition(i);
      const next = layout.getPosition(i + 1);
      if (next.top === current.top) {
        expect(next.left - (current.left + current.width)).toBeCloseTo(2, 5);
      } else {
        expect(next.top - (current.top + current.height)).toBeCloseTo(2, 5);
      }
    }
  });
});

import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('timelineGridSize preference', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  const load = () => import('$lib/stores/preferences.store');

  it('defaults to medium', async () => {
    const { timelineGridSize, TimelineGridSize } = await load();
    expect(get(timelineGridSize)).toBe(TimelineGridSize.Medium);
  });

  it('persists the selected size to localStorage', async () => {
    const { timelineGridSize, TimelineGridSize } = await load();
    timelineGridSize.set(TimelineGridSize.Large);
    expect(localStorage.getItem('timeline-grid-size')).toBe(TimelineGridSize.Large);
  });

  it('restores the stored size after a reload', async () => {
    localStorage.setItem('timeline-grid-size', 'small');
    const { timelineGridSize, TimelineGridSize } = await load();
    expect(get(timelineGridSize)).toBe(TimelineGridSize.Small);
  });

  it('falls back to medium for an invalid stored value', async () => {
    localStorage.setItem('timeline-grid-size', 'huge');
    const { timelineGridSize, TimelineGridSize } = await load();
    expect(get(timelineGridSize)).toBe(TimelineGridSize.Medium);
  });

  it('maps sizes to row heights, medium keeping the previous defaults', async () => {
    const { getTimelineRowHeight, TimelineGridSize } = await load();
    expect(getTimelineRowHeight(TimelineGridSize.Medium, false)).toBe(235);
    expect(getTimelineRowHeight(TimelineGridSize.Medium, true)).toBe(100);
    expect(getTimelineRowHeight(TimelineGridSize.Small, false)).toBeLessThan(235);
    expect(getTimelineRowHeight(TimelineGridSize.Large, false)).toBeGreaterThan(235);
    expect(getTimelineRowHeight(TimelineGridSize.Small, true)).toBeLessThan(100);
    expect(getTimelineRowHeight(TimelineGridSize.Large, true)).toBeGreaterThan(100);
  });
});

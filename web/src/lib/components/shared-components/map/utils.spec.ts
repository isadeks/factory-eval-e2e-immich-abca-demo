import { getMarkersBounds } from '$lib/components/shared-components/map/utils';

describe('getMarkersBounds', () => {
  it('returns undefined without markers', () => {
    expect(getMarkersBounds(undefined)).toBeUndefined();
    expect(getMarkersBounds([])).toBeUndefined();
  });

  it('returns a degenerate box for a single marker', () => {
    expect(getMarkersBounds([{ lat: 10, lon: 20 }])).toEqual([
      [20, 10],
      [20, 10],
    ]);
  });

  it('returns the box containing all markers', () => {
    const markers = [
      { lat: 48.1, lon: 11.5 },
      { lat: -33.9, lon: 151.2 },
      { lat: 40.7, lon: -74 },
    ];
    expect(getMarkersBounds(markers)).toEqual([
      [-74, -33.9],
      [151.2, 48.1],
    ]);
  });
});

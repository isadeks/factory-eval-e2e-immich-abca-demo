import { countMarkersInBounds } from '$lib/utils/map-utils';

describe('countMarkersInBounds', () => {
  const markers = [
    { lat: 10, lon: 10 },
    { lat: 20, lon: 20 },
    { lat: -30, lon: 170 },
    { lat: -30, lon: -170 },
  ];

  it('returns 0 for no markers', () => {
    expect(countMarkersInBounds([], { west: -180, south: -90, east: 180, north: 90 })).toBe(0);
  });

  it('counts all markers when the view covers the world', () => {
    expect(countMarkersInBounds(markers, { west: -180, south: -90, east: 180, north: 90 })).toBe(4);
  });

  it('counts only markers inside the bounds', () => {
    expect(countMarkersInBounds(markers, { west: 0, south: 0, east: 15, north: 15 })).toBe(1);
    expect(countMarkersInBounds(markers, { west: 0, south: 0, east: 30, north: 30 })).toBe(2);
  });

  it('includes markers on the edge and excludes those outside', () => {
    expect(countMarkersInBounds(markers, { west: 10, south: 10, east: 10, north: 10 })).toBe(1);
    expect(countMarkersInBounds(markers, { west: 50, south: 50, east: 60, north: 60 })).toBe(0);
  });

  it('supports bounds crossing the antimeridian', () => {
    expect(countMarkersInBounds(markers, { west: 160, south: -40, east: -160, north: -20 })).toBe(2);
    expect(countMarkersInBounds(markers, { west: 160, south: -10, east: -160, north: 0 })).toBe(0);
  });
});

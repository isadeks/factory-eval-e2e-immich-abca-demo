export type ViewBounds = { west: number; south: number; east: number; north: number };

/**
 * Counts the markers inside the given bounds. Supports bounds crossing the antimeridian (west > east).
 */
export const countMarkersInBounds = (markers: ReadonlyArray<{ lat: number; lon: number }>, bounds: ViewBounds) => {
  const { west, south, east, north } = bounds;
  const crossesAntimeridian = west > east;

  let count = 0;
  for (const { lat, lon } of markers) {
    if (lat < south || lat > north) {
      continue;
    }
    const inLongitude = crossesAntimeridian ? lon >= west || lon <= east : lon >= west && lon <= east;
    if (inLongitude) {
      count++;
    }
  }
  return count;
};

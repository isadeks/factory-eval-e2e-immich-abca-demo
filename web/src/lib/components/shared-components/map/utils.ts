import type { MapMarkerResponseDto } from '@immich/sdk';

export type MarkerBounds = [[west: number, south: number], [east: number, north: number]];

/** Returns the bounding box ([sw, ne]) that contains all markers, or undefined if there are none. */
export const getMarkersBounds = (markers: Pick<MapMarkerResponseDto, 'lat' | 'lon'>[] | undefined) => {
  if (!markers || markers.length === 0) {
    return undefined;
  }

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const { lat, lon } of markers) {
    west = Math.min(west, lon);
    south = Math.min(south, lat);
    east = Math.max(east, lon);
    north = Math.max(north, lat);
  }

  return [
    [west, south],
    [east, north],
  ] as MarkerBounds;
};

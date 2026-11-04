export const MAP_VIEW_STORAGE_KEY = 'map-view';

export type MapView = {
  zoom: number;
  center: { lng: number; lat: number };
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export const loadMapView = (storage: Pick<Storage, 'getItem'> = localStorage): MapView | undefined => {
  try {
    const raw = storage.getItem(MAP_VIEW_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw);
    const lng = parsed?.center?.lng;
    const lat = parsed?.center?.lat;
    const zoom = parsed?.zoom;
    if (!isFiniteNumber(zoom) || !isFiniteNumber(lng) || !isFiniteNumber(lat)) {
      return undefined;
    }
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90 || zoom < 0) {
      return undefined;
    }

    return { zoom, center: { lng, lat } };
  } catch {
    return undefined;
  }
};

export const saveMapView = (view: MapView, storage: Pick<Storage, 'setItem'> = localStorage) => {
  try {
    storage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify({ zoom: view.zoom, center: view.center }));
  } catch {
    // storage may be unavailable or full; remembering the view is best-effort
  }
};

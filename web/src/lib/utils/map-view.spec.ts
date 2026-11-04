import { loadMapView, MAP_VIEW_STORAGE_KEY, saveMapView } from '$lib/utils/map-view';

describe('map view persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return undefined when nothing is stored', () => {
    expect(loadMapView()).toBeUndefined();
  });

  it('should restore a saved zoom and center', () => {
    saveMapView({ zoom: 7.5, center: { lng: 13.4, lat: 52.5 } });
    expect(loadMapView()).toEqual({ zoom: 7.5, center: { lng: 13.4, lat: 52.5 } });
  });

  it('should store the view in localStorage', () => {
    saveMapView({ zoom: 3, center: { lng: -10, lat: 20 } });
    expect(JSON.parse(localStorage.getItem(MAP_VIEW_STORAGE_KEY)!)).toEqual({ zoom: 3, center: { lng: -10, lat: 20 } });
  });

  it('should ignore invalid JSON', () => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, '{nope');
    expect(loadMapView()).toBeUndefined();
  });

  it.each([
    { zoom: 'a', center: { lng: 1, lat: 1 } },
    { zoom: 5, center: { lng: 1 } },
    { zoom: 5, center: { lng: 181, lat: 1 } },
    { zoom: 5, center: { lng: 1, lat: 91 } },
    { zoom: -1, center: { lng: 1, lat: 1 } },
    null,
  ])('should ignore invalid stored value %j', (value) => {
    localStorage.setItem(MAP_VIEW_STORAGE_KEY, JSON.stringify(value));
    expect(loadMapView()).toBeUndefined();
  });

  it('should not throw when storage fails', () => {
    const storage = {
      setItem: () => {
        throw new Error('quota');
      },
    };
    expect(() => saveMapView({ zoom: 1, center: { lng: 0, lat: 0 } }, storage)).not.toThrow();
  });
});

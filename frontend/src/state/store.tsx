import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  listLocations,
  createLocation,
  refreshLocation,
  deleteLocation,
  logInteraction,
} from '../api';
import type {
  CreateLocationPayload,
  Location,
  MapViewState,
  ProviderProps,
  StoreValue,
} from '../types';

const StoreContext = createContext<StoreValue | null>(null);
const DEFAULT_MAP_VIEW: MapViewState = {
  center: [1.3521, 103.8198],
  zoom: 11,
};

function deriveMapView(locations: Location[]): MapViewState {
  if (locations.length === 0) return DEFAULT_MAP_VIEW;
  if (locations.length === 1) {
    return {
      center: [locations[0].latitude, locations[0].longitude],
      zoom: 11,
    };
  }

  const latitudes = locations.map((location) => location.latitude);
  const longitudes = locations.map((location) => location.longitude);
  const center: [number, number] = [
    (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
    (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
  ];
  return {
    center,
    zoom: 10,
  };
}

export function StoreProvider({ children }: ProviderProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingId, setRefreshingId] = useState<number | null>(null);
  const [mapView, setMapView] = useState<MapViewState>(DEFAULT_MAP_VIEW);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const hydratedSavedLocations = useRef(false);
  const hydratedAirQualityLocations = useRef(false);
  const lastLocationsSignature = useRef('');

  const updateMapView = useCallback((next: MapViewState) => {
    setMapView((current) => {
      if (
        current.zoom === next.zoom &&
        current.center[0] === next.center[0] &&
        current.center[1] === next.center[1]
      ) {
        return current;
      }
      return next;
    });
  }, []);

  const load = useCallback(async (): Promise<Location[]> => {
    try {
      const data = await listLocations();
      setLocations(data.locations);
      setError(null);
      return data.locations;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load-on-mount syncs API → React state
    load().then((next) => {
      if (next.length > 0) setSelectedId((current) => current ?? next[0].id);
    });
  }, [load]);

  useEffect(() => {
    const signature = locations
      .map((location) => `${location.id}:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`)
      .join('|');
    if (signature === lastLocationsSignature.current) return;
    lastLocationsSignature.current = signature;
    updateMapView(deriveMapView(locations));
  }, [locations]);

  useEffect(() => {
    if (hydratedSavedLocations.current || isLoading || locations.length === 0) return;

    const needsHydration = locations.some(
      (location) =>
        location.weather.psi_twenty_four_hourly === null ||
        location.weather.pm25_one_hourly === null ||
        location.weather.temperature_c === null ||
        location.weather.humidity_percent === null ||
        location.weather.rainfall_mm === null ||
        location.weather.wind_speed_knots === null ||
        location.weather.wind_direction_degrees === null ||
        location.weather.uv_index === null,
    );

    if (!needsHydration) {
      hydratedSavedLocations.current = true;
      return;
    }

    hydratedSavedLocations.current = true;
    void (async () => {
      await Promise.all(
        locations.map((location) =>
          refreshLocation(location.id).catch((err) => {
            setError(err);
          }),
        ),
      );
      await load();
    })();
  }, [isLoading, locations, load]);

  useEffect(() => {
    if (hydratedAirQualityLocations.current || isLoading || locations.length === 0) return;

    const needsAirQualityHydration = locations.some(
      (location) =>
        location.weather.psi_twenty_four_hourly === null ||
        location.weather.pm25_one_hourly === null ||
        location.weather.air_quality_region === null,
    );

    if (!needsAirQualityHydration) {
      hydratedAirQualityLocations.current = true;
      return;
    }

    hydratedAirQualityLocations.current = true;
    void (async () => {
      await Promise.all(
        locations.map((location) =>
          refreshLocation(location.id).catch((err) => {
            setError(err);
          }),
        ),
      );
      await load();
    })();
  }, [isLoading, locations, load]);

  const effectiveSelectedId = (() => {
    if (locations.length === 0) return null;
    return locations.some((l) => l.id === selectedId) ? selectedId : locations[0].id;
  })();

  const create = useCallback(
    async (payload: CreateLocationPayload) => {
      setError(null);
      logInteraction('location_create_submitted', payload);
      try {
        const created = await createLocation(payload);
        const next = await load();
        const targetId = created?.id ?? next[next.length - 1]?.id;
        if (targetId) setSelectedId(targetId);
        setIsAdding(false);
        logInteraction('location_created', {
          locationId: targetId,
          latitude: created.latitude,
          longitude: created.longitude,
        });
      } catch (err) {
        setError(err);
        logInteraction('location_create_failed', {
          latitude: payload.latitude,
          longitude: payload.longitude,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        throw err;
      }
    },
    [load],
  );

  const refresh = useCallback(
    async (id: number) => {
      setRefreshingId(id);
      setError(null);
      logInteraction('location_refresh_clicked', { locationId: id });
      try {
        await refreshLocation(id);
        await load();
        logInteraction('location_refreshed', { locationId: id });
      } catch (err) {
        setError(err);
        logInteraction('location_refresh_failed', {
          locationId: id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setRefreshingId(null);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);
      logInteraction('location_delete_clicked', { locationId: id });
      try {
        await deleteLocation(id);
        const next = await load();
        if (next.length === 0) {
          setSelectedId(null);
        } else if (!next.some((location) => location.id === selectedId)) {
          setSelectedId(next[0].id);
        }
        logInteraction('location_deleted', { locationId: id });
      } catch (err) {
        setError(err);
        logInteraction('location_delete_failed', {
          locationId: id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [load, selectedId],
  );

  const value: StoreValue = {
    locations,
    selectedId: effectiveSelectedId,
    isAdding,
    isLoading,
    refreshingId,
    mapView,
    isMapFullscreen,
    error,
    select: setSelectedId,
    setAdding: (nextIsAdding) => {
      setIsAdding(nextIsAdding);
      if (nextIsAdding) logInteraction('location_form_opened');
    },
    create,
    refresh,
    remove,
    openMap: () => setIsMapFullscreen(true),
    closeMap: () => setIsMapFullscreen(false),
    setMapView: updateMapView,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useSelectedLocation(): Location | null {
  const { locations, selectedId } = useStore();
  return locations.find((l) => l.id === selectedId) ?? null;
}

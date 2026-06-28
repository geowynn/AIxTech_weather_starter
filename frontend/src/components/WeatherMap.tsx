import { useEffect, useMemo, useRef } from 'react';
import { Marker, MapContainer, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { useStore } from '../state/store';
import type { Location, MapViewState } from '../types';

interface WeatherMapProps {
  locations: Location[];
  view: MapViewState;
  onViewChange?: (view: MapViewState) => void;
  onLocationClick?: (location: Location) => void;
}

function locationLabel(location: Location): string {
  return (
    location.weather.condition ||
    location.weather.area ||
    `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`
  );
}

function LocationPins({
  locations,
  onLocationClick,
}: Pick<WeatherMapProps, 'locations' | 'onLocationClick'>) {
  const icon = useMemo(
    () =>
      divIcon({
        className: 'weather-map-icon',
        html: '<div class="weather-map-pin"><span class="weather-map-label"></span><span class="weather-map-dot"></span></div>',
        iconSize: [1, 1],
        iconAnchor: [0, 0],
      }),
    [],
  );

  return (
    <>
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={icon}
          eventHandlers={{
            click: () => onLocationClick?.(location),
          }}
        >
          <Tooltip
            permanent
            direction="top"
            offset={[0, -10]}
            opacity={1}
            className="weather-map-tooltip"
          >
            {locationLabel(location)}
          </Tooltip>
        </Marker>
      ))}
    </>
  );
}

function MapSync({
  view,
  onViewChange,
}: {
  view: MapViewState;
  onViewChange?: (view: MapViewState) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onViewChange?.({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      });
    },
    zoomend: () => {
      const center = map.getCenter();
      onViewChange?.({
        center: [center.lat, center.lng],
        zoom: map.getZoom(),
      });
    },
  });

  useEffect(() => {
    map.setView(view.center as LatLngExpression, view.zoom, { animate: false });
  }, [map, view.center, view.zoom]);

  return null;
}

export function WeatherMap({ locations, view, onViewChange, onLocationClick }: WeatherMapProps) {
  const { setMapView } = useStore();
  const handleViewChange = onViewChange ?? setMapView;

  return (
    <MapContainer
      center={view.center}
      zoom={view.zoom}
      scrollWheelZoom
      className="weather-map-container"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapSync view={view} onViewChange={handleViewChange} />
      <LocationPins locations={locations} onLocationClick={onLocationClick} />
    </MapContainer>
  );
}

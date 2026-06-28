import { useEffect } from 'react';
import { CloseIcon } from './icons';
import { useStore } from '../state/store';
import { WeatherMap } from './WeatherMap';

export function MapFullscreen() {
  const { locations, mapView, isMapFullscreen, closeMap, select } = useStore();

  useEffect(() => {
    if (!isMapFullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMap();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeMap, isMapFullscreen]);

  if (!isMapFullscreen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/55 p-3 backdrop-blur-md"
      onClick={closeMap}
      role="presentation"
    >
      <div
        className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#1d2733] shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <header className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Map
            </p>
            <p className="text-sm text-white/85">Saved locations</p>
          </div>
          <button
            type="button"
            onClick={closeMap}
            aria-label="Close map"
            className="rounded-full border border-white/10 bg-white/[0.08] p-2 text-white/85 hover:bg-white/[0.16]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>
        <div className="h-full w-full pt-[3.5rem]">
          <WeatherMap
            locations={locations}
            view={mapView}
            onLocationClick={(location) => select(location.id)}
          />
        </div>
      </div>
    </div>
  );
}

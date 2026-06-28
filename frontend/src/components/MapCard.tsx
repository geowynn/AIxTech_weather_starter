import { useStore } from '../state/store';
import { ExpandIcon, LocationIcon } from './icons';
import { WeatherMap } from './WeatherMap';

export function MapCard() {
  const { locations, mapView, openMap, select } = useStore();

  return (
    <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <LocationIcon className="h-3.5 w-3.5" />
            <span>Map</span>
          </div>
          <p className="mt-1 text-sm text-white/80">Saved locations on the map</p>
        </div>
        <button
          type="button"
          onClick={openMap}
          className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/[0.14]"
        >
          Expand
        </button>
      </header>

      <div className="relative h-[18rem]">
        <WeatherMap
          locations={locations}
          view={mapView}
          onLocationClick={(location) => select(location.id)}
        />
        <button
          type="button"
          onClick={openMap}
          aria-label="Open map fullscreen"
          className="absolute inset-0 z-10 cursor-zoom-in bg-transparent"
        />
      </div>

      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-white/60">
        <span>{locations.length} saved location{locations.length === 1 ? '' : 's'}</span>
        <span className="inline-flex items-center gap-1.5">
          <ExpandIcon className="h-3.5 w-3.5" />
          Fullscreen
        </span>
      </footer>
    </section>
  );
}

interface LocationErrorModalProps {
  message: string | null;
  onClose: () => void;
}

export function LocationErrorModal({ message, onClose }: LocationErrorModalProps) {
  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="weather-panel-strong w-full max-w-sm rounded-2xl border border-white/20 bg-slate-950/85 p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-error-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="location-error-title" className="text-base font-semibold text-white">
          Location unavailable
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/75">{message}</p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

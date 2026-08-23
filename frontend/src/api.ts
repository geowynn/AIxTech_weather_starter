import type { CreateLocationPayload, Location } from './types';

const API_BASE = '/api';

// Hidden Code: Fox

interface LocationsResponse {
  locations: Location[];
}

interface ApiError {
  detail?: string;
  existing_location_id?: number;
  forecast_area?: string;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly existingLocationId?: number,
    readonly forecastArea?: string
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiError;
    throw new ApiRequestError(
      error.detail || 'Request failed',
      response.status,
      error.existing_location_id,
      error.forecast_area
    );
  }
  if (response.status === 204) return null as T;
  return (await response.json()) as T;
}

export const listLocations = () => request<LocationsResponse>('/locations');

export const createLocation = (payload: CreateLocationPayload) =>
  request<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const refreshLocation = (id: number) =>
  request<Location>(`/locations/${id}/refresh`, { method: 'POST' });

export const deleteLocation = (id: number) =>
  request<void>(`/locations/${id}`, { method: 'DELETE' });

export function logInteraction(event: string, metadata: object = {}) {
  const page = typeof window === 'undefined' ? undefined : window.location.pathname;
  void fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, metadata, page }),
    keepalive: true,
  }).catch(() => {});
}

import { ApiRequestError } from './api';

export const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 15_000,
};

export function isSingaporeCoordinate(latitude: number, longitude: number): boolean {
  return 1.1 <= latitude && latitude <= 1.5 && 103.6 <= longitude && longitude <= 104.1;
}

export function formatGeolocationError(error: GeolocationPositionError): string {
  if (error.code === 1) {
    return 'Location access was denied. Please allow location access and try again.';
  }
  return 'Your location could not be determined. Please try again later.';
}

export function formatLocationError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 422 && error.message.includes('Coordinates must be within Singapore')) {
      return 'You appear to be outside Singapore. This app only supports Singapore locations.';
    }
    if (error.status === 409) return error.message;
  }
  return 'Your location could not be determined. Please try again later.';
}

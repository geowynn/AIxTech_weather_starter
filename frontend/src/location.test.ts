import { describe, expect, it } from 'vitest';
import {
  formatGeolocationError,
  formatLocationError,
  GEOLOCATION_OPTIONS,
  isSingaporeCoordinate,
} from './location';

describe('location detection helpers', () => {
  it('uses the 15-second geolocation timeout', () => {
    expect(GEOLOCATION_OPTIONS).toEqual({ timeout: 15_000 });
  });

  it('accepts coordinates inside Singapore bounds only', () => {
    expect(isSingaporeCoordinate(1.3521, 103.8198)).toBe(true);
    expect(isSingaporeCoordinate(1.6, 103.8198)).toBe(false);
    expect(isSingaporeCoordinate(1.3521, 103.4)).toBe(false);
  });

  it('formats permission denial separately from other geolocation failures', () => {
    expect(formatGeolocationError({ code: 1 } as GeolocationPositionError)).toContain(
      'Location access was denied'
    );
    expect(formatGeolocationError({ code: 2 } as GeolocationPositionError)).toContain(
      'try again later'
    );
    expect(formatGeolocationError({ code: 3 } as GeolocationPositionError)).toContain(
      'try again later'
    );
  });

  it('formats unexpected API failures as retryable location errors', () => {
    expect(formatLocationError(new Error('network failure'))).toBe(
      'Your location could not be determined. Please try again later.'
    );
  });
});

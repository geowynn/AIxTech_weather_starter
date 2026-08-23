import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WeatherProviderError, type WeatherSnapshot } from '../weather.js';

const weather: WeatherSnapshot = {
  condition: 'Cloudy',
  observed_at: '2026-05-04T00:00:00Z',
  source: 'test',
  area: 'Bishan',
  valid_period_text: 'Now',
  temperature_c: 29,
  humidity_percent: 80,
  rainfall_mm: 0,
  wind_speed_knots: 4,
  wind_direction_degrees: 180,
  forecast_low_c: 25,
  forecast_high_c: 32,
  uv_index: 7,
  psi_twenty_four_hourly: 42,
  pm25_one_hourly: 9,
  air_quality_region: 'central',
  forecast_periods: [{ label: 'Now', forecast: 'Cloudy' }],
  daily_forecast: [
    {
      date: '2026-05-04',
      forecast: 'Cloudy',
      temperature_low_c: 25,
      temperature_high_c: 32,
    },
  ],
};

describe('locations API', () => {
  let tempDir: string;
  let app: Awaited<ReturnType<typeof import('../server.js').createApp>>;
  let resetStore: typeof import('../db.js').resetStore;
  let currentWeather = weather;
  let failCurrentWeather = false;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'weather-starter-test-'));
    process.env.DATABASE_PATH = join(tempDir, 'weather.db');
    process.env.LOG_LEVEL = 'silent';

    const { createApp } = await import('../server.js');
    ({ resetStore } = await import('../db.js'));
    app = await createApp({
      serveFrontend: false,
      enableRequestLogging: false,
      weatherClient: {
        async getCurrentWeather() {
          if (failCurrentWeather) throw new WeatherProviderError('Weather provider unavailable');
          return currentWeather;
        },
        async getForecastArea() {
          return weather.area as string;
        },
      },
    });
  });

  beforeEach(async () => {
    await resetStore();
    currentWeather = weather;
    failCurrentWeather = false;
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('refreshes weather when a location is created', async () => {
    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body).toMatchObject({
      id: 1,
      latitude: 1.35,
      longitude: 103.85,
      weather: {
        condition: 'Cloudy',
        area: 'Bishan',
        temperature_c: 29,
      },
    });

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(1);
    expect(listResponse.body.locations[0].weather.condition).toBe('Cloudy');
  });

  it('serves the health check and accepts frontend interaction logs', async () => {
    await request(app).get('/health').expect(200).expect({ status: 'healthy' });

    await request(app)
      .post('/api/logs')
      .send({ event: 'location_refresh_clicked', metadata: { locationId: 1 }, page: '/' })
      .expect(204);
  });

  it('rejects invalid location log events', async () => {
    await request(app)
      .post('/api/logs')
      .send({ event: 'Invalid Event' })
      .expect(422)
      .expect({ detail: 'event is required' });
  });

  it.each([
    [{}, 'latitude and longitude are required'],
    [{ latitude: 'not-a-number', longitude: 103.85 }, 'latitude and longitude are required'],
    [
      { latitude: 1.6, longitude: 103.85 },
      'Coordinates must be within Singapore (lat 1.1-1.5, lon 103.6-104.1)',
    ],
  ])('rejects invalid location coordinates: %j', async (payload, detail) => {
    await request(app).post('/api/locations').send(payload).expect(422).expect({ detail });
  });

  it('returns a saved location by id', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    await request(app)
      .get(`/api/locations/${created.body.id}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: created.body.id,
          latitude: 1.35,
          longitude: 103.85,
          weather: { area: 'Bishan', source: 'test' },
        });
      });
  });

  it('refreshes an existing location with the latest weather snapshot', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);
    currentWeather = { ...weather, condition: 'Rain', temperature_c: 27, source: 'refresh-test' };

    await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(200)
      .expect((response) => {
        expect(response.body.weather).toMatchObject({
          condition: 'Rain',
          temperature_c: 27,
          source: 'refresh-test',
        });
      });
  });

  it('returns provider failures from a refresh as a bad gateway', async () => {
    const created = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);
    failCurrentWeather = true;

    await request(app)
      .post(`/api/locations/${created.body.id}/refresh`)
      .expect(502)
      .expect({ detail: 'Weather provider unavailable' });
  });

  it('keeps a location when the initial weather refresh fails', async () => {
    failCurrentWeather = true;

    const response = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    expect(response.body.weather).toMatchObject({
      condition: 'Not refreshed',
      source: 'not-refreshed',
    });
    await request(app).get('/api/locations').expect(200).expect((listResponse) => {
      expect(listResponse.body.locations).toHaveLength(1);
    });
  });

  it('returns 404 for a missing location', async () => {
    await request(app)
      .get('/api/locations/9999')
      .expect(404)
      .expect({ detail: 'Location not found' });
  });

  it('rejects a second location in the same forecast area and identifies the saved location', async () => {
    const first = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    await request(app)
      .post('/api/locations')
      .send({ latitude: 1.36, longitude: 103.86 })
      .expect(409)
      .expect({
        detail: 'Forecast area "Bishan" is already saved',
        existing_location_id: first.body.id,
        forecast_area: 'Bishan',
      });
  });

  it('deletes a location', async () => {
    const createdResponse = await request(app)
      .post('/api/locations')
      .send({ latitude: 1.35, longitude: 103.85 })
      .expect(201);

    await request(app).delete(`/api/locations/${createdResponse.body.id}`).expect(204);

    const listResponse = await request(app).get('/api/locations').expect(200);
    expect(listResponse.body.locations).toHaveLength(0);
  });

  it('returns 404 when refreshing or deleting a missing location', async () => {
    await request(app)
      .post('/api/locations/9999/refresh')
      .expect(404)
      .expect({ detail: 'Location not found' });
    await request(app)
      .delete('/api/locations/9999')
      .expect(404)
      .expect({ detail: 'Location not found' });
  });
});



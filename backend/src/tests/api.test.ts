import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApplication } from '../app.js'
import { InMemoryAlertRepository, InMemoryDecisionRepository, InMemoryEnvironmentalRepository } from '../repositories/in-memory.js'
import type { RepositorySet } from '../aws/repositories.js'
import { LocationSearchUnavailableError } from '../services/location-search-service.js'
import { CpcbAqiUnavailableError } from '../services/cpcb-aqi-client.js'
import { LocationRoutesUnavailableError } from '../services/location-routes-service.js'

describe('Express API compatibility', () => {
  let app: ReturnType<typeof createApplication>
  let repositories: RepositorySet

  beforeEach(() => {
    repositories = {
      alerts: new InMemoryAlertRepository(),
      decisions: new InMemoryDecisionRepository(),
      environmental: new InMemoryEnvironmentalRepository(),
      mode: 'memory',
    }
    app = createApplication({ repositories })
  })

  it('serves health and accurate disabled integration mode', async () => {
    const response = await request(app).get('/health').expect(200)
    expect(response.body).toMatchObject({
      status: 'healthy',
      app_name: 'Saans Saathi API',
      environment: process.env.NODE_ENV ?? 'development',
      bedrock_mode: 'local_deterministic_fallback',
    })
    expect(response.body.timestamp).toEqual(expect.any(String))
  })

  it('exposes DynamoDB connectivity separately from application liveness', async () => {
    const disabled = await request(app).get('/health/dynamodb').expect(503)
    expect(disabled.body).toMatchObject({ status: 'disabled', database: 'dynamodb' })

    let checkCount = 0
    repositories = {
      ...repositories,
      mode: 'dynamodb',
      checkConnectivity: async () => { checkCount += 1 },
    }
    app = createApplication({ repositories })
    const connected = await request(app).get('/health/dynamodb').expect(200)
    expect(connected.body).toMatchObject({
      status: 'healthy',
      database: 'dynamodb',
      region: 'us-east-1',
      table: 'AtheraEnvironmentalData',
    })
    expect(connected.body.checked_at).toEqual(expect.any(String))
    expect(checkCount).toBe(1)
  })

  it('returns an honest no-data response when the CPCB station provider is not configured', async () => {
    const unconfiguredApp = createApplication({
      repositories,
      cpcbAqi: { configured: false, getDelhiStations: async () => [] },
    })
    const response = await request(unconfiguredApp).get('/api/aqi/stations').expect(200)
    expect(response.body).toMatchObject({
      status: 'unavailable',
      updated_at: null,
      source: null,
      stations: [],
    })
    expect(response.body.detail).toContain('DATA_GOV_IN_API_KEY')
  })

  it('serves CPCB station observations and returns provider errors as service-unavailable', async () => {
    const cpcbAqi = {
      configured: true,
      getDelhiStations: async () => [{
        id: 'ito|28.6289|77.2405',
        name: 'ITO',
        locality: 'Delhi',
        latitude: 28.6289,
        longitude: 77.2405,
        aqi: 137,
        aqi_system: 'INDIA_CPCB' as const,
        observed_at: new Date().toISOString(),
        source: 'CPCB · data.gov.in',
        pollutants: {},
      }],
    }
    const stationsApp = createApplication({ repositories, cpcbAqi })
    const response = await request(stationsApp).get('/api/aqi/stations').expect(200)
    expect(response.body).toMatchObject({
      status: 'available',
      source: 'CPCB · data.gov.in',
      stations: [{ name: 'ITO', aqi: 137, aqi_system: 'INDIA_CPCB' }],
    })

    const failedApp = createApplication({
      repositories,
      cpcbAqi: {
        configured: true,
        getDelhiStations: async () => { throw new CpcbAqiUnavailableError() },
      },
    })
    await request(failedApp).get('/api/aqi/stations').expect(503)
  })

  it('scores routes only from recent nearby CPCB stations', async () => {
    const cpcbAqi = {
      configured: true,
      getDelhiStations: async () => [{
        id: 'central-delhi|28.6139|77.209',
        name: 'Central Delhi',
        locality: 'Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        aqi: 82,
        aqi_system: 'INDIA_CPCB' as const,
        observed_at: new Date().toISOString(),
        source: 'CPCB · data.gov.in',
        pollutants: {},
      }],
    }
    const scoreApp = createApplication({ repositories, cpcbAqi })
    const score = await request(scoreApp)
      .post('/api/routes/score')
      .send({ geometry: { type: 'LineString', coordinates: [[77.2, 28.6], [77.22, 28.62]] } })
      .expect(200)
    expect(score.body).toMatchObject({
      average_aqi: 82,
      is_green_corridor: true,
      source: 'CPCB · data.gov.in',
    })

    await request(scoreApp)
      .post('/api/routes/score')
      .send({ geometry: { type: 'LineString', coordinates: [[181, 28.6], [77.22, 28.62]] } })
      .expect(422)
  })

  it('validates place-search input and returns bounded Amazon Location results', async () => {
    const locationSearch = {
      configured: true,
      search: async (query: string) => [{
        id: 'place-1',
        label: query,
        address: 'Delhi, India',
        longitude: 77.209,
        latitude: 28.6139,
      }],
    }
    const searchApp = createApplication({ repositories, locationSearch })

    await request(searchApp).get('/api/location/search?q=x').expect(422)
    const response = await request(searchApp).get('/api/location/search?q=Connaught%20Place').expect(200)
    expect(response.body.results).toEqual([{
      id: 'place-1',
      label: 'Connaught Place',
      address: 'Delhi, India',
      longitude: 77.209,
      latitude: 28.6139,
    }])
    await request(searchApp).get(`/api/location/search?q=${'a'.repeat(161)}`).expect(422)

    const unconfiguredApp = createApplication({
      repositories,
      locationSearch: { configured: false, search: async () => [] },
    })
    await request(unconfiguredApp).get('/api/location/search?q=Delhi').expect(503)

    const failedSearchApp = createApplication({
      repositories,
      locationSearch: {
        configured: true,
        search: async () => { throw new LocationSearchUnavailableError() },
      },
    })
    const unavailable = await request(failedSearchApp).get('/api/location/search?q=Delhi').expect(503)
    expect(unavailable.body.detail).toContain('temporarily unavailable')
  })

  it('calculates routes through the Amazon Location SDK provider and validates coordinates', async () => {
    let requestedCoordinates: unknown
    const locationRoutes = {
      calculate: async (origin: [number, number], destination: [number, number]) => {
        requestedCoordinates = { origin, destination }
        return [{
          summary: { Distance: 4200, Duration: 900 },
          legs: [{ geometry: { LineString: [[77.2, 28.6], [77.3, 28.7]] } }],
        }]
      },
    }
    const routesApp = createApplication({ repositories, locationRoutes })

    await request(routesApp)
      .post('/api/location/routes')
      .send({ origin: [181, 28.6], destination: [77.3, 28.7] })
      .expect(422)

    const response = await request(routesApp)
      .post('/api/location/routes')
      .send({ origin: [77.2, 28.6], destination: [77.3, 28.7] })
      .expect(200)

    expect(requestedCoordinates).toEqual({
      origin: [77.2, 28.6],
      destination: [77.3, 28.7],
    })
    expect(response.body.routes).toEqual([{
      summary: { Distance: 4200, Duration: 900 },
      legs: [{ geometry: { LineString: [[77.2, 28.6], [77.3, 28.7]] } }],
    }])

    const unavailableApp = createApplication({
      repositories,
      locationRoutes: {
        calculate: async () => { throw new LocationRoutesUnavailableError() },
      },
    })
    const unavailable = await request(unavailableApp)
      .post('/api/location/routes')
      .send({ origin: [77.2, 28.6], destination: [77.3, 28.7] })
      .expect(503)
    expect(unavailable.body.detail).toContain('temporarily unavailable')
  })

  it('returns complete forecast, inversion, plume and metrics contracts', async () => {
    const forecast = await request(app).get('/api/forecast?area=noida&hours=72').expect(200)
    expect(forecast.body.points).toHaveLength(73)
    expect(forecast.body.summary).toHaveProperty('peak_aqi')
    expect(forecast.body.points[30]).toMatchObject({
      pm25_ugm3: expect.any(Number),
      aqi_coupled: expect.any(Number),
      aqi_uncoupled: expect.any(Number),
      ventilation_coefficient_m2s: expect.any(Number),
    })
    expect(forecast.body.source_provenance.model).toContain('demonstration')

    const inversion = await request(app).get('/api/inversion?area=noida').expect(200)
    expect(['Weak', 'Moderate', 'Strong']).toContain(inversion.body.inversion_status_now)
    expect(inversion.body.timeline[0]).toHaveProperty('ventilation_coefficient')

    const plumes = await request(app).get('/api/plumes?area=noida').expect(200)
    expect(plumes.body.fire_count_upwind).toBeGreaterThan(0)
    expect(plumes.body.plume_path).toHaveLength(6)

    const metrics = await request(app).get('/api/metrics').expect(200)
    expect(metrics.body.metrics_by_horizon['0-24h']).toMatchObject({ mae: expect.any(Number), rmse: expect.any(Number) })
  })

  it('persists forecast snapshots and exposes recent environmental history', async () => {
    const forecast = await request(app).get('/api/forecast?area=noida&hours=24').expect(200)
    const history = await request(app).get('/api/environmental-data?area=noida&limit=5').expect(200)

    expect(history.body).toMatchObject({
      area: 'noida',
      forecasts: [forecast.body],
    })
    await request(app).get('/api/environmental-data?limit=101').expect(422)
  })

  it('returns agent status and redacted historical decisions', async () => {
    const status = await request(app).get('/api/agents/status').expect(200)
    expect(status.body).toMatchObject({
      active_mode: 'local_deterministic',
      bedrock_available: false,
      bedrock_status: 'disabled',
      guardrails_enforced: true,
    })
    expect(status.body.agents_ready).toEqual(['Air Watcher', 'Health Guardian', 'Care Circle', 'Master Coordinator'])

    const decisions = await request(app).get('/api/decisions').expect(200)
    expect(decisions.body.total_count).toBeGreaterThan(0)
    expect(decisions.body.decisions[0].redacted).toBe(true)
    expect(JSON.stringify(decisions.body)).not.toMatch(/SpO2|bpm|heart rate/i)
  })

  it('enforces consent and sharing before health-event processing', async () => {
    const payload = {
      user_id: 'demo',
      consent_given: false,
      sharing_enabled: false,
      coarse_risk_band: 'HIGH',
      coarse_area: 'Noida',
      event_trigger: 'ANOMALOUS_VITALS',
      client_timestamp: '10:10:00 AM',
    }
    const denied = await request(app).post('/api/events/health').send(payload).expect(200)
    expect(denied.body.status).toBe('REJECTED_NO_CONSENT')
    expect(denied.body.caregiver_notified).toBe(false)

    const sharingDenied = await request(app).post('/api/events/health')
      .send({ ...payload, consent_given: true })
      .expect(200)
    expect(sharingDenied.body.status).toBe('REJECTED_NO_CONSENT')
  })

  it('surfaces failed persistence instead of returning success or falling back', async () => {
    repositories.alerts = {
      put: async () => { throw new Error('simulated storage outage') },
      get: async () => undefined,
    }
    app = createApplication({ repositories })
    const response = await request(app).post('/api/events/health').send({
      consent_given: true,
      sharing_enabled: true,
      coarse_risk_band: 'LOW',
      event_trigger: 'MANUAL_CHECKIN',
      client_timestamp: 'now',
    }).expect(500)
    expect(response.body).toEqual({ detail: 'Internal Server Error' })
  })

  it('deduplicates repeated consented events within the cooldown window', async () => {
    const payload = {
      user_id: 'dedup-test',
      consent_given: true,
      sharing_enabled: true,
      coarse_risk_band: 'LOW',
      coarse_area: 'Noida',
      event_trigger: 'MANUAL_CHECKIN',
      client_timestamp: 'now',
    }
    const first = await request(app).post('/api/events/health').send(payload).expect(200)
    const second = await request(app).post('/api/events/health').send(payload).expect(200)
    expect(first.body.status).toBe('ACCEPTED')
    expect(second.body.status).toBe('DEDUPLICATED')
    expect(second.body.caregiver_notified).toBe(false)
  })

  it('rejects raw health telemetry without reflecting it in the response', async () => {
    const response = await request(app).post('/api/events/health').send({
      consent_given: true,
      sharing_enabled: true,
      coarse_risk_band: 'HIGH',
      event_trigger: 'ANOMALOUS_VITALS',
      client_timestamp: 'now',
      heart_rate: 96,
    }).expect(422)
    expect(JSON.stringify(response.body)).not.toContain('96')
    expect(response.body.detail[0].type).toBe('privacy_violation')
    const rawNote = await request(app).post('/api/events/health').send({
      consent_given: true,
      sharing_enabled: true,
      coarse_risk_band: 'HIGH',
      event_trigger: 'ANOMALOUS_VITALS',
      client_timestamp: 'now',
      notes: 'SpO2: 93',
    }).expect(422)
    expect(JSON.stringify(rawNote.body)).not.toContain('93')
  })

  it('simulates notifications without sending them and writes safe decision metadata', async () => {
    const simulation = await request(app).post('/api/alerts/simulate').send({
      scenario: 'RESPIRATORY_DISTRESS_UNANSWERED',
      sharing_enabled: true,
      allow_location_on_sos: false,
      language: 'hi',
    }).expect(200)
    expect(simulation.body.steps).toHaveLength(5)
    expect(simulation.body.final_state).toBe('CAREGIVER_NOTIFIED_STANDBY')
    expect(simulation.body.disclaimer).toContain('No actual SMS')
    expect(simulation.body.steps[3].detail).toContain('no SMS')
    expect((await request(app).get('/api/decisions').expect(200)).body.decisions[0].redacted).toBe(true)
  })

  it('keeps all alert ladder scenarios simulation-only', async () => {
    const cases = [
      ['INVERSION_SPIKE_MORNING_NUDGE', 'MORNING_NUDGE_DELIVERED'],
      ['USER_OK_CONFIRMED', 'RESOLVED_SAFE'],
      ['FALL_DETECTED_SOS_CANCELLED', 'FALL_ALERT_CANCELLED_BY_USER'],
      ['SOS_EMERGENCY_DISPATCH', 'EMERGENCY_SOS_DISPATCHED'],
    ] as const
    for (const [scenario, finalState] of cases) {
      const response = await request(app).post('/api/alerts/simulate')
        .send({ scenario, sharing_enabled: true, allow_location_on_sos: false })
        .expect(200)
      expect(response.body.scenario).toBe(scenario)
      expect(response.body.final_state).toBe(finalState)
      expect(response.body.disclaimer).toContain('SIMULATION ONLY')
      expect(JSON.stringify(response.body)).not.toMatch(/SMS sent|dispatched SOS|actual call/i)
    }
  })

  it('compares both numerical scenarios and validates invalid input with 422', async () => {
    const response = await request(app).post('/api/scenarios/compare').send({ area: 'noida', hours: 72 }).expect(200)
    expect(response.body.timeline).toHaveLength(73)
    expect(response.body.peak_diff_aqi).toBeGreaterThan(0)
    await request(app).get('/api/forecast?hours=73').expect(422)
    await request(app).post('/api/alerts/simulate').send({ scenario: 'not-a-scenario' }).expect(422)
  })

  it('applies configured Vite CORS origin and returns FastAPI-compatible not-found errors', async () => {
    const corsResponse = await request(app).get('/health').set('Origin', 'http://localhost:5173').expect(200)
    expect(corsResponse.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    const deniedCorsResponse = await request(app).get('/health').set('Origin', 'https://unapproved.example').expect(200)
    expect(deniedCorsResponse.headers['access-control-allow-origin']).toBeUndefined()
    const notFound = await request(app).get('/unknown').expect(404)
    expect(notFound.body).toEqual({ detail: 'Not Found' })
  })
})

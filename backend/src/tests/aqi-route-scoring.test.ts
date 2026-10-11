import { describe, expect, it } from 'vitest'
import { scoreRouteAqi } from '../services/aqi-route-scoring.js'
import type { CpcbAqiStation } from '../services/cpcb-aqi-client.js'

function station(overrides: Partial<CpcbAqiStation> = {}): CpcbAqiStation {
  return {
    id: 'central-delhi',
    name: 'Central Delhi',
    locality: 'Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    aqi: 82,
    aqi_system: 'INDIA_CPCB',
    observed_at: new Date('2025-01-01T12:00:00.000Z').toISOString(),
    source: 'CPCB · data.gov.in',
    pollutants: {},
    ...overrides,
  }
}

describe('scoreRouteAqi', () => {
  const route: [number, number][] = [[77.2, 28.6], [77.22, 28.62]]
  const now = Date.parse('2025-01-01T12:30:00.000Z')

  it('returns a green-corridor score from recent nearby Indian CPCB observations', () => {
    expect(scoreRouteAqi([station()], route, now)).toMatchObject({
      average_aqi: 82,
      is_green_corridor: true,
      source: 'CPCB · data.gov.in',
    })
  })

  it('does not score routes without recent nearby stations', () => {
    expect(scoreRouteAqi([
      station({ latitude: 29.5 }),
      station({ id: 'old', observed_at: '2025-01-01T08:00:00.000Z' }),
    ], route, now)).toBeUndefined()
  })
})

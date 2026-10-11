import { describe, expect, it, vi } from 'vitest'
import { OpenMeteoAqiClient, OpenMeteoAqiUnavailableError } from '../services/open-meteo-aqi-client.js'

describe('OpenMeteoAqiClient', () => {
  it('returns distinct, explicitly modeled US AQI readings for a bounded map grid', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([
      {
        latitude: 28.6,
        longitude: 77.2,
        current: { time: '2026-10-11T12:00', us_aqi: 159, pm2_5: 63.3, pm10: 152.3 },
      },
      {
        latitude: 28.6,
        longitude: 77.2,
        current: { time: '2026-10-11T13:00', us_aqi: 164, pm2_5: 65, pm10: 155 },
      },
      {
        latitude: 28.7,
        longitude: 77.3,
        current: { time: '2026-10-11T12:00', us_aqi: 91 },
      },
    ]), { status: 200 }))
    const client = new OpenMeteoAqiClient(fetcher)

    const readings = await client.getReadings({
      west: 77,
      south: 28.4,
      east: 77.4,
      north: 28.8,
    })
    const requestedUrl = new URL(fetcher.mock.calls[0]![0] as string)

    expect(requestedUrl.origin + requestedUrl.pathname).toBe('https://air-quality-api.open-meteo.com/v1/air-quality')
    expect(requestedUrl.searchParams.get('current')).toBe('us_aqi,pm2_5,pm10')
    expect(requestedUrl.searchParams.get('latitude')?.split(',')).toHaveLength(25)
    expect(readings).toEqual([
      expect.objectContaining({
        latitude: 28.6,
        longitude: 77.2,
        aqi: 164,
        aqi_system: 'US_AQI',
        source: expect.stringContaining('Open-Meteo'),
        estimated: true,
        pm25: 65,
      }),
      expect.objectContaining({ latitude: 28.7, longitude: 77.3, aqi: 91, estimated: true }),
    ])
  })

  it('rejects provider failures rather than returning a successful-looking empty result', async () => {
    const client = new OpenMeteoAqiClient(vi.fn<typeof fetch>().mockResolvedValue(
      new Response('unavailable', { status: 503 }),
    ))

    await expect(client.getReadings({
      west: 77,
      south: 28.4,
      east: 77.4,
      north: 28.8,
    })).rejects.toBeInstanceOf(OpenMeteoAqiUnavailableError)
  })
})

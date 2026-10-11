import { describe, expect, it, vi } from 'vitest'
import { CpcbAqiClient } from '../services/cpcb-aqi-client.js'

const stationRecords = [
  {
    station: 'ITO',
    city: 'Delhi',
    latitude: '28.6289',
    longitude: '77.2405',
    last_update: '15-06-2026 10:00:00',
    pollutant_id: 'PM2.5',
    pollutant_avg: '30.9',
    pollutant_unit: 'ug/m3',
  },
  {
    station: 'ITO',
    city: 'Delhi',
    latitude: '28.6289',
    longitude: '77.2405',
    last_update: '15-06-2026 10:00:00',
    pollutant_id: 'PM10',
    pollutant_avg: '52',
    pollutant_unit: 'ug/m3',
  },
  {
    station: 'ITO',
    city: 'Delhi',
    latitude: '28.6289',
    longitude: '77.2405',
    last_update: '15-06-2026 10:00:00',
    pollutant_id: 'NO2',
    pollutant_avg: '41',
    pollutant_unit: 'ug/m3',
  },
]

describe('CPCB AQI client', () => {
  it('requests the configured data.gov.in resource and normalizes station pollutant records', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ records: stationRecords }), { status: 200 }))
    const client = new CpcbAqiClient('private-token', 'resource-id', fetcher)

    const stations = await client.getDelhiStations()
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]))

    expect(client.configured).toBe(true)
    expect(requestedUrl.origin).toBe('https://api.data.gov.in')
    expect(requestedUrl.pathname).toBe('/resource/resource-id')
    expect(requestedUrl.searchParams.get('api-key')).toBe('private-token')
    expect(requestedUrl.searchParams.get('filters[city]')).toBe('Delhi')
    expect(stations).toHaveLength(1)
    expect(stations[0]).toMatchObject({
      name: 'ITO',
      locality: 'Delhi',
      latitude: 28.6289,
      longitude: 77.2405,
      aqi: 52,
      aqi_system: 'INDIA_CPCB',
      pm25: 30.9,
      pm10: 52,
      estimated: true,
      observed_at: '2026-06-15T04:30:00.000Z',
      source: 'CPCB · data.gov.in',
    })
    expect(stations[0]?.pollutants).toHaveProperty('NO2', { value: 41, unit: 'ug/m3' })
  })

  it('uses an explicit Indian AQI when supplied and omits stations without sufficient readings', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      records: [
        { ...stationRecords[0], aqi: '137' },
        { ...stationRecords[0], station: 'Incomplete', aqi: undefined },
        { ...stationRecords[1], station: 'Invalid Coordinates', latitude: '91' },
      ],
    }), { status: 200 }))

    const stations = await new CpcbAqiClient('token', 'resource', fetcher).getDelhiStations()
    expect(stations).toHaveLength(1)
    expect(stations[0]?.aqi).toBe(137)
    expect(stations[0]).not.toHaveProperty('estimated')
  })

  it('does not fetch or fabricate data without a provider key', async () => {
    const fetcher = vi.fn<typeof fetch>()
    const client = new CpcbAqiClient('', 'resource', fetcher)

    expect(client.configured).toBe(false)
    await expect(client.getDelhiStations()).resolves.toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('rejects malformed payloads and reports provider failures without leaking credentials', async () => {
    const malformed = new CpcbAqiClient('private-token', 'resource', vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ invalid: true }), { status: 200 }),
    ))
    await expect(malformed.getDelhiStations()).rejects.toThrow('invalid records payload')

    const unavailable = new CpcbAqiClient('private-token', 'resource', vi.fn<typeof fetch>().mockResolvedValue(
      new Response('forbidden', { status: 403 }),
    ))
    await expect(unavailable.getDelhiStations()).rejects.toThrow('temporarily unavailable')
  })
})

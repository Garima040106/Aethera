import { describe, expect, it, vi } from 'vitest'
import { OpenAqClient } from '../services/openaq-client.js'

const noida = { lat: 28.628, lon: 77.3649, name: 'Noida Sector 62' }

describe('OpenAQ client', () => {
  it('sends the API key and returns the latest PM2.5 reading', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{
          id: 8118,
          name: 'Nearest Noida Station',
          coordinates: { latitude: 28.63, longitude: 77.36 },
          sensors: [{ id: 123, parameter: { name: 'pm25' } }],
        }],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{
          sensorsId: 123,
          value: 42,
          datetime: { utc: '2026-10-11T06:00:00Z' },
        }],
      }), { status: 200 }))

    const client = new OpenAqClient('secret-key', fetcher, true)
    await expect(client.getLatestPm25(noida)).resolves.toEqual({
      value: 42,
      observedAt: '2026-10-11T06:00:00.000Z',
      source: 'OpenAQ location 8118 (Nearest Noida Station)',
    })
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.openaq.org/v3/locations?coordinates=28.628,77.3649&radius=25000&limit=100',
      expect.objectContaining({
        headers: { 'X-API-Key': 'secret-key', Accept: 'application/json' },
      }),
    )
  })

  it('chooses the nearest station with a PM2.5 sensor', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [
          {
            id: 1,
            name: 'Far PM10 Station',
            coordinates: { latitude: 28.8, longitude: 77.5 },
            sensors: [{ id: 1, parameter: { name: 'pm10' } }],
          },
          {
            id: 2,
            name: 'Near PM2.5 Station',
            coordinates: { latitude: 28.629, longitude: 77.365 },
            sensors: [{ id: 2, parameter: { name: 'pm25' } }],
          },
        ],
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        results: [{
          sensorsId: 2,
          value: 55,
          period: { datetimeFrom: { utc: '2026-10-11T06:00:00Z' } },
        }],
      }), { status: 200 }))

    const client = new OpenAqClient('secret-key', fetcher, true)
    await expect(client.getLatestPm25(noida)).resolves.toMatchObject({
      value: 55,
      source: 'OpenAQ location 2 (Near PM2.5 Station)',
    })
    expect(fetcher).toHaveBeenLastCalledWith(
      'https://api.openaq.org/v3/locations/2/latest',
      expect.any(Object),
    )
  })

  it('returns undefined when no API key is configured', async () => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(new OpenAqClient('', fetcher, true).getLatestPm25(noida)).resolves.toBeUndefined()
    expect(fetcher).not.toHaveBeenCalled()
  })
})

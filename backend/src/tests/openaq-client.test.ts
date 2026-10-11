import { describe, expect, it, vi } from 'vitest'
import { OpenAqClient } from '../services/openaq-client.js'

describe('OpenAQ client', () => {
  it('sends the API key and returns the latest PM2.5 reading', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      results: [{
        parameter: 'pm25',
        value: 42,
        period: { datetimeFrom: { utc: '2026-10-11T06:00:00Z' } },
      }],
    }), { status: 200 }))

    const client = new OpenAqClient('secret-key', '8118', fetcher, true)
    await expect(client.getLatestPm25()).resolves.toEqual({
      value: 42,
      observedAt: '2026-10-11T06:00:00.000Z',
      source: 'OpenAQ location 8118',
    })
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.openaq.org/v3/locations/8118/latest',
      expect.objectContaining({
        headers: { 'X-API-Key': 'secret-key', Accept: 'application/json' },
      }),
    )
  })

  it('returns undefined when no API key is configured', async () => {
    const fetcher = vi.fn<typeof fetch>()
    await expect(new OpenAqClient('', '8118', fetcher, true).getLatestPm25()).resolves.toBeUndefined()
    expect(fetcher).not.toHaveBeenCalled()
  })
})

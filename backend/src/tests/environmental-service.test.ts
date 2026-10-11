import { afterEach, describe, expect, it, vi } from 'vitest'
import { EnvironmentalService } from '../services/environmental-service.js'
import { OpenAqClient } from '../services/openaq-client.js'

describe('EnvironmentalService forecast', () => {
  afterEach(() => vi.restoreAllMocks())

  it('returns the demonstration forecast when OpenAQ is unavailable', async () => {
    const openAq = new OpenAqClient('', fetch, false)
    vi.spyOn(openAq, 'getLatestPm25').mockRejectedValue(new Error('provider unavailable'))
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const forecast = await new EnvironmentalService(openAq).forecast('noida', 24)

    expect(forecast.points).toHaveLength(25)
    expect(forecast.source_provenance).toMatchObject({
      cpcb: 'No live CPCB observation was used for this forecast',
      openaq: 'No live OpenAQ observation available; deterministic demonstration input used',
    })
    expect(forecast.source_provenance.model).toContain('demonstration')
  })
})

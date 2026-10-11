import { describe, expect, it } from 'vitest'
import { pm25ToAqi, runForecast } from '../ml/coupled-surrogate.js'

describe('coupled forecast surrogate', () => {
  it('returns the inclusive 72-hour forecast with bounded numeric output', () => {
    const points = runForecast('noida', 72, true)
    expect(points).toHaveLength(73)
    expect(points[0]?.hour).toBe(0)
    expect(points.at(-1)?.hour).toBe(72)
    expect(points[0]).toMatchObject({
      timestamp: 'Now',
      aqi_category: expect.any(String),
      inversion_level: expect.stringMatching(/Weak|Moderate|Strong/),
    })
    for (const point of points) {
      expect(point.pm25_ugm3).toBeGreaterThan(0)
      expect(point.boundary_layer_height_m).toBeGreaterThan(50)
      expect(point.aqi_coupled).toBeGreaterThanOrEqual(0)
      expect(point.aqi_coupled).toBeLessThanOrEqual(500)
      expect(Object.values(point).some((value) => typeof value === 'number' && !Number.isFinite(value))).toBe(false)
    }
  })

  it('preserves the coupled feedback AQI amplification and NAQI categories', () => {
    const coupled = runForecast('noida', 72, true)
    const uncoupled = runForecast('noida', 72, false)
    expect(Math.max(...coupled.map((point) => point.aqi_coupled))).toBeGreaterThan(Math.max(...uncoupled.map((point) => point.aqi_coupled)))
    expect(pm25ToAqi(250)).toEqual([400, 'Very Poor'])
    expect(pm25ToAqi(500)).toEqual([500, 'Severe'])
  })
})

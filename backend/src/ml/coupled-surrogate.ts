import type { ForecastPoint } from '../schemas/api.js'
import { areaFor } from '../data/fixtures.js'

function roundToEven(value: number): number {
  const floor = Math.floor(value)
  const fraction = value - floor
  if (fraction < 0.5) return floor
  if (fraction > 0.5) return floor + 1
  return floor % 2 === 0 ? floor : floor + 1
}

function roundDecimal(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return roundToEven(value * factor) / factor
}

export function pm25ToAqi(pm25: number): [number, string] {
  const breakpoints: [number, number, number, number, string][] = [
    [0, 30, 0, 50, 'Good'],
    [30, 60, 51, 100, 'Satisfactory'],
    [60, 90, 101, 200, 'Moderate'],
    [90, 120, 201, 300, 'Poor'],
    [120, 250, 301, 400, 'Very Poor'],
    [250, 500, 401, 500, 'Severe'],
  ]
  const value = Math.max(0, Math.min(500, pm25))
  for (const [low, high, aqiLow, aqiHigh, category] of breakpoints) {
    if (low <= value && value <= high) {
      const aqi = aqiLow + ((aqiHigh - aqiLow) / (high - low)) * (value - low)
      return [roundToEven(aqi), category]
    }
  }
  return [500, 'Severe']
}

export function calculatePlumeInflux(hour: number): number {
  if (hour < 12) return 8
  if (hour <= 42) return 85 * Math.exp(-0.5 * ((hour - 28) / 8) ** 2)
  return Math.max(10, 45 * Math.exp(-0.06 * (hour - 42)))
}

export function runForecast(
  area = 'noida',
  hours = 72,
  enableFeedback = true,
  initialPm25 = 94,
): ForecastPoint[] {
  const geo = areaFor(area)
  const startingPm25 = Number.isFinite(initialPm25) && initialPm25 >= 0 ? initialPm25 : 94
  let pm25Coupled = startingPm25
  let pm25Uncoupled = startingPm25
  const points: ForecastPoint[] = []

  for (let hour = 0; hour <= hours; hour += 1) {
    const timeOfDay = (hour + 6) % 24
    const solar = timeOfDay >= 6 && timeOfDay <= 18
      ? Math.max(0, Math.sin(Math.PI * (timeOfDay - 6) / 12))
      : 0
    const temp = 14 + 12 * solar - (enableFeedback && pm25Coupled > 200 ? 1.5 : 0)
    const humidity = 78 - 32 * solar
    const windSpeed = 2 + 1.8 * solar
    const pblhBase = 260 + 940 * solar
    const pblh = enableFeedback
      ? Math.max(140, pblhBase * Math.max(0.55, 1 - 0.42 * Math.min(1, pm25Coupled / 340)))
      : pblhBase
    const ventilation = pblh * windSpeed
    const inversion: ForecastPoint['inversion_level'] =
      ((hour >= 18 && hour <= 42 && ventilation < 950) || ventilation < 550 || (solar === 0 && pblh < 220))
        ? 'Strong'
        : ventilation < 1200 || pblh < 450 ? 'Moderate' : 'Weak'
    const influx = calculatePlumeInflux(hour)
    const effectiveVent = Math.max(240, ventilation)
    const nextCoupled = Math.max(30, pm25Coupled + (((28 + influx) * 220 / effectiveVent) - (0.045 * pm25Coupled)) * 0.45)
    const uncoupledVent = Math.max(240, pblhBase * windSpeed)
    const nextUncoupled = Math.max(30, pm25Uncoupled + (((28 + influx) * 220 / uncoupledVent) - (0.045 * pm25Uncoupled)) * 0.45)
    const [aqiCoupled, category] = pm25ToAqi(pm25Coupled)
    const [aqiUncoupled] = pm25ToAqi(pm25Uncoupled)
    const pm10 = pm25Coupled * 1.62
    const ozone = Math.max(15, 65 * solar - pm25Coupled * 0.05)
    const nox = Math.max(20, 35 + pm25Coupled * 0.18)

    points.push({
      hour,
      timestamp: hour > 0 ? `+${hour} h` : 'Now',
      temperature_c: roundDecimal(temp, 1),
      relative_humidity_pct: roundDecimal(humidity, 1),
      wind_speed_ms: roundDecimal(windSpeed, 1),
      wind_direction_deg: 315,
      boundary_layer_height_m: roundDecimal(pblh, 1),
      pm25_ugm3: roundDecimal(pm25Coupled, 1),
      pm10_ugm3: roundDecimal(pm10, 1),
      ozone_ugm3: roundDecimal(ozone, 1),
      nox_ugm3: roundDecimal(nox, 1),
      aqi_coupled: aqiCoupled,
      aqi_category: category,
      aqi_uncoupled: aqiUncoupled,
      inversion_level: inversion,
      ventilation_coefficient_m2s: roundDecimal(ventilation, 1),
      feedback_enhancement_aqi: Math.max(0, aqiCoupled - aqiUncoupled),
      data_quality: 'valid',
    })
    pm25Coupled = nextCoupled
    pm25Uncoupled = nextUncoupled
  }

  return points
}

export function getCoordinates(area: string): { latitude: number; longitude: number } {
  const geo = areaFor(area)
  return { latitude: geo.lat, longitude: geo.lon }
}

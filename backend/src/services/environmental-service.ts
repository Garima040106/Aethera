import { areaFor, fireHotspots } from '../data/fixtures.js'
import { runForecast } from '../ml/coupled-surrogate.js'
import type { ForecastResponse, InversionResponse, MetricsResponse, PlumeResponse } from '../schemas/api.js'

export class EnvironmentalService {
  forecast(area = 'noida', hours = 72): ForecastResponse {
    const location = areaFor(area)
    const points = runForecast(area, hours, true)
    const peak = points.reduce((max, point) => point.aqi_coupled > max.aqi_coupled ? point : max, points[0]!)
    return {
      area: location.name,
      latitude: location.lat,
      longitude: location.lon,
      generated_at: new Date().toISOString(),
      model_version: 'SaansSaathi-CoupledSurrogate-v1.2',
      source_provenance: {
        cpcb: 'Deterministic sample fixture; not a live CPCB connection',
        weather: 'Illustrative NOAA GFS / IMD source attribution; no live feed connected',
        fires: 'NASA FIRMS sample fixture; not a live satellite feed',
        model: 'Saans Saathi 72-hour coupled environmental surrogate (demonstration only)',
      },
      horizon_hours: hours,
      points,
      summary: {
        aqi_now: points[0]!.aqi_coupled,
        category_now: points[0]!.aqi_category,
        peak_aqi: peak.aqi_coupled,
        peak_category: peak.aqi_category,
        peak_hour: peak.hour,
        peak_timestamp: peak.timestamp,
        inversion_risk: 'Strong inversion from +18 h to +42 h',
        plume_arrival_estimate_h: 14,
        weather_coupling_note: 'Illustrative surrogate result: aerosol dimming reduces modeled PBLH and can elevate the modeled AQI. Not a validated prediction.',
      },
    }
  }

  inversion(area = 'noida'): InversionResponse {
    const points = runForecast(area, 72, true)
    const location = areaFor(area)
    return {
      area: location.name,
      updated_at: '18 min ago (Illustrative model cycle)',
      inversion_status_now: points[0]!.inversion_level,
      peak_inversion_window: '+18 h to +42 h (Nocturnal inversion reinforced by particulate dimming)',
      proxy_notes: 'Ventilation coefficient V_c = PBLH * U_10. Strong inversion defined as V_c < 550 m^2/s with boundary layer height < 220m. Derived from numerical boundary layer proxies, not direct radiosonde soundings.',
      timeline: points.map((point) => {
        const strength = point.inversion_level
        return {
          hour: point.hour,
          timestamp: point.timestamp,
          strength,
          ventilation_coefficient: point.ventilation_coefficient_m2s,
          surface_temp_c: point.temperature_c,
          air_temp_gradient_c: strength === 'Strong' ? -2.8 : strength === 'Moderate' ? -1.2 : 0.5,
          pblh_meters: point.boundary_layer_height_m,
          trapping_risk: strength === 'Strong'
            ? 'Severe ground-level smoke trapping; ventilation volume severely depressed'
            : strength === 'Moderate'
              ? 'Moderate stagnation; limited vertical dispersion'
              : 'Normal daytime convective dispersion',
        }
      }),
    }
  }

  plumes(area = 'noida'): PlumeResponse {
    const target = areaFor(area)
    const hotspots = fireHotspots.map((point) => ({ ...point }))
    const averageLatitude = hotspots.reduce((sum, item) => sum + item.latitude, 0) / hotspots.length
    const averageLongitude = hotspots.reduce((sum, item) => sum + item.longitude, 0) / hotspots.length
    const steps: [number, number, number, number, number][] = [
      [0, averageLatitude, averageLongitude, 15, 1],
      [4, averageLatitude - 0.45, averageLongitude + 0.35, 32, 0.88],
      [8, averageLatitude - 0.95, averageLongitude + 0.75, 54, 0.74],
      [11, averageLatitude - 1.45, averageLongitude + 1.15, 78, 0.62],
      [14, target.lat, target.lon, 110, 0.55],
      [18, target.lat - 0.2, target.lon + 0.3, 140, 0.42],
    ]
    return {
      area_target: target.name,
      updated_at: '41 min ago (Sample fixture timestamp)',
      estimated_arrival_hours: 14,
      wind_direction_cardinal: 'North-West (315° NW prevailing winter corridor)',
      fire_count_upwind: hotspots.length,
      hotspots,
      plume_path: steps.map(([hour_offset, latitude, longitude, dispersion_radius_km, concentration_factor]) => ({
        hour_offset,
        latitude: Number(latitude.toFixed(4)),
        longitude: Number(longitude.toFixed(4)),
        dispersion_radius_km,
        concentration_factor,
      })),
      trapping_factor: 'Illustrative near-ground trapping proxy; not a measured live condition',
      data_source: 'Illustrative NASA FIRMS (VIIRS/MODIS) sample fixture + GFS attribution; no live source connected',
    }
  }
}

export const metricsResponse: MetricsResponse = {
  model_name: 'SaansSaathi-CoupledSurrogate-v1.2',
  evaluation_period: 'October 15 - November 15, 2025 Historical CAAQMS Telemetry',
  validation_method: 'chronological_rolling_origin',
  metrics_by_horizon: {
    '0-24h': { mae: 18.4, rmse: 24.2, bias: -3.1, r_squared: 0.88 },
    '24-48h': { mae: 29.6, rmse: 38.7, bias: -6.4, r_squared: 0.79 },
    '48-72h': { mae: 41.2, rmse: 52.8, bias: -9.8, r_squared: 0.68 },
  },
  baseline_comparisons: {
    'Persistence Baseline': { mae: 68.4, rmse: 89.2, bias: -22.5, r_squared: 0.38 },
    'Uncoupled Baseline (No Feedback)': { mae: 48.9, rmse: 61.5, bias: -34.8, r_squared: 0.58 },
    'Coupled Surrogate (Saans Saathi)': { mae: 29.6, rmse: 38.7, bias: -6.4, r_squared: 0.79 },
    'Bias-Corrected Coupled Surrogate': { mae: 24.1, rmse: 31.9, bias: -1.2, r_squared: 0.84 },
  },
  data_points_evaluated: 720,
  limitations: 'Demonstration metrics carried over from the Python implementation; no evaluation dataset or validation run is bundled here. Does not substitute for multi-node WRF-Chem Eulerian HPC modeling.',
}

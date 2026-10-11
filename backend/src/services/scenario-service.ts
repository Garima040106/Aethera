import type { ScenarioCompareInput, ScenarioCompareResponse } from '../schemas/api.js'
import { runForecast } from '../ml/coupled-surrogate.js'

export function compareScenarios(request: ScenarioCompareInput): ScenarioCompareResponse {
  const coupled = runForecast(request.area, request.hours, true)
  const uncoupled = runForecast(request.area, request.hours, false)
  let maxDiff = 0
  let maxDiffHour = 0
  const timeline = coupled.map((point, index) => {
    const baseline = uncoupled[index]!
    const difference = point.aqi_coupled - baseline.aqi_coupled
    if (difference > maxDiff) {
      maxDiff = difference
      maxDiffHour = point.hour
    }
    return {
      hour: point.hour,
      aqi_a: point.aqi_coupled,
      aqi_b: baseline.aqi_coupled,
      difference,
      pblh_a: point.boundary_layer_height_m,
      pblh_b: baseline.boundary_layer_height_m,
    }
  })
  return {
    area: request.area,
    scenario_a_name: 'Coupled With Atmospheric Feedback (Aethera / Saans Saathi)',
    scenario_b_name: 'Uncoupled Without Weather-Smoke Feedback',
    peak_diff_hour: maxDiffHour,
    peak_diff_aqi: maxDiff,
    analysis: `Illustrative coupled feedback run reaches AQI ${coupled[maxDiffHour]!.aqi_coupled} at +${maxDiffHour}h. The uncoupled baseline reaches ${uncoupled[maxDiffHour]!.aqi_coupled}; modeled difference is +${maxDiff} AQI points. These are deterministic surrogate outputs, not validated real-world predictions.`,
    timeline,
  }
}

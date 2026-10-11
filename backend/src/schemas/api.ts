import { z } from 'zod'

const riskBand = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
const eventTrigger = z.enum(['ANOMALOUS_VITALS', 'NO_REPLY_CHECKIN', 'MANUAL_CHECKIN', 'MOTION_FALL'])

export const forecastQuerySchema = z.object({
  area: z.string().default('noida'),
  hours: z.coerce.number().int().min(1).max(72).default(72),
})

export const environmentalHistoryQuerySchema = z.object({
  area: z.string().default('noida'),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

export const areaQuerySchema = z.object({
  area: z.string().default('noida'),
})

export const placeSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(160),
})

export const healthEventSchema = z.object({
  user_id: z.string().default('kamla_noida'),
  consent_given: z.boolean().default(true),
  sharing_enabled: z.boolean().default(true),
  coarse_risk_band: riskBand,
  coarse_area: z.string().default('Noida Sector 62'),
  event_trigger: eventTrigger,
  client_timestamp: z.string(),
  notes: z.string().nullable().optional(),
})

export const alertSimulationSchema = z.object({
  scenario: z.enum([
    'RESPIRATORY_DISTRESS_UNANSWERED',
    'INVERSION_SPIKE_MORNING_NUDGE',
    'USER_OK_CONFIRMED',
    'FALL_DETECTED_SOS_CANCELLED',
    'SOS_EMERGENCY_DISPATCH',
  ]),
  sharing_enabled: z.boolean().default(true),
  allow_location_on_sos: z.boolean().default(false),
  language: z.enum(['hi', 'en']).default('hi'),
})

export const scenarioCompareSchema = z.object({
  area: z.string().default('noida'),
  scenario_a: z.string().default('Coupled With Atmospheric Feedback'),
  scenario_b: z.string().default('Uncoupled Without Feedback'),
  hours: z.number().int().min(1).max(72).default(72),
})

export type HealthEventInput = z.infer<typeof healthEventSchema>
export type AlertSimulationInput = z.infer<typeof alertSimulationSchema>
export type ScenarioCompareInput = z.infer<typeof scenarioCompareSchema>

export interface ForecastPoint {
  hour: number
  timestamp: string
  temperature_c: number
  relative_humidity_pct: number
  wind_speed_ms: number
  wind_direction_deg: number
  boundary_layer_height_m: number
  pm25_ugm3: number
  pm10_ugm3: number
  ozone_ugm3: number
  nox_ugm3: number
  aqi_coupled: number
  aqi_category: string
  aqi_uncoupled: number
  inversion_level: 'Weak' | 'Moderate' | 'Strong'
  ventilation_coefficient_m2s: number
  feedback_enhancement_aqi: number
  data_quality: string
}

export interface HealthResponse {
  status: string
  app_name: string
  version: string
  environment: string
  bedrock_mode: string
  timestamp: string
}

export interface ForecastResponse {
  area: string
  latitude: number
  longitude: number
  generated_at: string
  model_version: string
  source_provenance: Record<string, string>
  horizon_hours: number
  points: ForecastPoint[]
  summary: {
    aqi_now: number
    category_now: string
    peak_aqi: number
    peak_category: string
    peak_hour: number
    peak_timestamp: string
    inversion_risk: string
    plume_arrival_estimate_h: number
    weather_coupling_note: string
  }
}

export interface InversionResponse {
  area: string
  updated_at: string
  inversion_status_now: 'Weak' | 'Moderate' | 'Strong'
  peak_inversion_window: string
  proxy_notes: string
  timeline: {
    hour: number
    timestamp: string
    strength: 'Weak' | 'Moderate' | 'Strong'
    ventilation_coefficient: number
    surface_temp_c: number
    air_temp_gradient_c: number
    pblh_meters: number
    trapping_risk: string
  }[]
}

export interface PlumeResponse {
  area_target: string
  updated_at: string
  estimated_arrival_hours: number
  wind_direction_cardinal: string
  fire_count_upwind: number
  hotspots: { id: string; latitude: number; longitude: number; brightness: number; confidence: string; region: string }[]
  plume_path: { hour_offset: number; latitude: number; longitude: number; dispersion_radius_km: number; concentration_factor: number }[]
  trapping_factor: string
  data_source: string
}

export interface HorizonMetrics {
  mae: number
  rmse: number
  bias: number
  r_squared: number
}

export interface MetricsResponse {
  model_name: string
  evaluation_period: string
  validation_method: string
  metrics_by_horizon: Record<string, HorizonMetrics>
  baseline_comparisons: Record<string, HorizonMetrics>
  data_points_evaluated: number
  limitations: string
}

export interface AgentStatusResponse {
  active_mode: 'bedrock' | 'local_deterministic'
  bedrock_available: boolean
  region: string
  configured_model: string
  agents_ready: string[]
  guardrails_enforced: boolean
  offline_capable: boolean
  bedrock_enabled?: boolean
  bedrock_status?: 'disabled' | 'enabled_unverified'
}

export interface DecisionRecord {
  id: string
  time: string
  agent: string
  title: string
  detail: string
  evidence_source: string
  risk_level: string
  redacted: boolean
}

export interface DecisionsResponse {
  decisions: DecisionRecord[]
  total_count: number
  redaction_policy: string
}

export interface HealthEventResponse {
  event_id: string
  status: 'ACCEPTED' | 'REJECTED_NO_CONSENT' | 'DEDUPLICATED' | 'ESCALATED'
  action_taken: string
  coarse_risk_band: string
  caregiver_notified: boolean
  message_to_caregiver: string | null
  audit_trace_id: string
}

export interface AlertSimulationResponse {
  simulation_id: string
  scenario: AlertSimulationInput['scenario']
  final_state: string
  steps: {
    step_number: number
    step_name: string
    status: string
    actor: string
    detail: string
    timestamp: string
  }[]
  disclaimer: string
}

export interface ScenarioCompareResponse {
  area: string
  scenario_a_name: string
  scenario_b_name: string
  peak_diff_hour: number
  peak_diff_aqi: number
  analysis: string
  timeline: { hour: number; aqi_a: number; aqi_b: number; difference: number; pblh_a: number; pblh_b: number }[]
}

export interface AlertRecord {
  eventId: string
  timestamp: string
  status: string
  ttl: number
}

export interface DecisionAuditItem {
  decisionId: string
  createdAt: string
  agent: string
  title: string
  detail: string
  evidenceSource: string
  riskLevel: string
}

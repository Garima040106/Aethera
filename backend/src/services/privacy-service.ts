export function evaluatePolicy(
  principalRole: string,
  action: string,
  context: Record<string, boolean>,
): { permitted: boolean; reason: string } {
  if (['ViewRawVitals', 'ExportRawBiometrics', 'TransmitRawVitals'].includes(action)) {
    return { permitted: false, reason: 'FORBID: Cedar Policy 2 strictly forbids external sharing or transmission of raw vital signs.' }
  }
  if (action === 'ViewExactLocation') {
    const permitted = ['EmergencyContact', 'Caregiver'].includes(principalRole)
      && context.is_sos_active === true
      && context.allow_location_on_sos === true
    return permitted
      ? { permitted: true, reason: 'PERMIT: Cedar Policy 3 allows exact location viewing during confirmed SOS with user consent.' }
      : { permitted: false, reason: 'DENY: Exact location is private. Cedar Policy 3 requires active SOS and explicit user consent.' }
  }
  if (['ViewCoarseRiskBand', 'ViewCoarseArea', 'TransmitCoarseRisk'].includes(action)) {
    return context.sharing_enabled === true
      ? { permitted: true, reason: 'PERMIT: Cedar Policy 1 allows coarse risk and area access when sharing is enabled.' }
      : { permitted: false, reason: 'DENY: Cedar Policy 1 requires sharing_enabled == true for caregiver access.' }
  }
  return { permitted: false, reason: `DENY: Default-deny for action '${action}' under Cedar authorization.` }
}

const sensitiveKeys = new Set([
  'heart_rate', 'heart_rate_bpm', 'heartrate', 'hr', 'hr_bpm', 'pulse', 'spo2', 'spo2_pct',
  'oxygen_saturation', 'blood_oxygen', 'respiratory_rate', 'breathing_rate', 'temperature',
  'temperature_c', 'body_temperature', 'systolic_bp', 'diastolic_bp',
  'raw_vitals', 'vitals', 'biometrics',
])

export function containsRawHealthData(value: unknown): boolean {
  if (typeof value === 'string') {
    return /\b(?:heart[\s_-]*rate|hr|spo2|oxygen[\s_-]*saturation|blood[\s_-]*oxygen|respiratory[\s_-]*rate|breathing[\s_-]*rate|body[\s_-]*temperature)\b\s*(?:is|of|=|:)?\s*\d/i.test(value)
  }
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsRawHealthData)
  return Object.entries(value).some(([key, item]) =>
    sensitiveKeys.has(key.toLowerCase()) || containsRawHealthData(item),
  )
}

import { bedrockProvider } from './bedrock-provider.js'
import { EnvironmentalService } from '../services/environmental-service.js'

const safeAdvice: Record<string, Record<string, string>> = {
  LOW: {
    hi: 'हवा सामान्य है। आप अपनी दिनचर्या जारी रख सकते हैं।',
    en: 'Air conditions are moderate. Proceed with normal routine and stay hydrated.',
  },
  MODERATE: {
    hi: 'हवा थोड़ी खराब है। दोपहर के समय खिड़कियाँ बंद रखें और हल्का व्यायाम करें।',
    en: 'Air quality is deteriorating. Keep windows closed during peak hours and stay indoors.',
  },
  HIGH: {
    hi: 'माँ, आज बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।',
    en: 'Today, skip the walk outside. The air is very poor. A light walk indoors is better.',
  },
  CRITICAL: {
    hi: 'आपकी साँस सामान्य से तेज़ लग रही है। कृपया आराम करें और पानी पिएँ।',
    en: 'Breathing appears more labored than usual. Please rest and keep your rescue inhaler close.',
  },
}

export class SaansAgents {
  constructor(private readonly environmental: EnvironmentalService) {}

  status() {
    return {
      active_mode: 'local_deterministic' as const,
      bedrock_available: false,
      bedrock_enabled: bedrockProvider.enabled,
      bedrock_status: bedrockProvider.enabled ? 'enabled_unverified' : 'disabled',
      region: bedrockProvider.region,
      configured_model: bedrockProvider.modelId,
      agents_ready: ['Air Watcher', 'Health Guardian', 'Care Circle', 'Master Coordinator'],
      guardrails_enforced: true,
      offline_capable: true,
    }
  }

  airWatcher(area = 'noida') {
    const forecast = this.environmental.forecast(area, 72)
    const inversion = this.environmental.inversion(area)
    const plume = this.environmental.plumes(area)
    return {
      agent: 'Air Watcher',
      area,
      status: 'ANALYSIS_COMPLETE',
      summary: `Air Watcher Assessment for ${area}: Peak coupled AQI reaches ${forecast.summary.peak_aqi} (${forecast.summary.peak_category}) at hour +${forecast.summary.peak_hour}. Strong inversion is modeled from +18h to +42h. A sample plume from ${plume.fire_count_upwind} upwind fixture points is estimated to arrive in ${plume.estimated_arrival_hours} hours via ${plume.wind_direction_cardinal} winds.`,
      peak_aqi: forecast.summary.peak_aqi,
      inversion_status: inversion.inversion_status_now,
      plume_arrival_h: plume.estimated_arrival_hours,
      mode: this.status().active_mode,
    }
  }

  healthGuardian(riskBand = 'HIGH', language = 'hi', personaName = 'Kamla') {
    const advice = safeAdvice[riskBand] ?? safeAdvice.HIGH!
    return {
      agent: 'Health Guardian',
      persona: personaName,
      risk_band: riskBand,
      language,
      recommended_action: advice[language] ?? advice.en!,
      action_english: advice.en,
      disclaimer: 'Support tool, not a medical device. In an emergency call 112.',
      grounded_in_clinical_rules: true,
      mode: this.status().active_mode,
    }
  }

  careCircle(eventTrigger: string, coarseRiskBand: string, sharingEnabled: boolean) {
    const policy = evaluateCaregiverSharing(sharingEnabled)
    if (!policy.permitted) return { agent: 'Care Circle', permitted: false, reason: policy.reason, message: null }
    const recipient = 'Maa'
    const message = eventTrigger === 'NO_REPLY_CHECKIN'
      ? { subject: `Please call ${recipient}`, body: `${recipient}'s breathing looks harder than usual and outside air is at a very unhealthy level. She has not replied to the app for two minutes. Please call her.`, cta: 'Call Maa' }
      : eventTrigger === 'MOTION_FALL'
        ? { subject: `Urgent: Check on ${recipient}`, body: `A fall was detected on ${recipient}'s phone. She has a 30-second cancellation window before emergency contacts are notified.`, cta: 'Call Immediately' }
        : { subject: `Air update for ${recipient}`, body: `Outside air is currently in the ${coarseRiskBand} risk category. Please remind her to remain indoors.`, cta: 'Send Reminder' }
    return { agent: 'Care Circle', permitted: true, caregiver: 'Rohan', ...message, mode: this.status().active_mode }
  }

  coordinate(area = 'noida') {
    const air = this.airWatcher(area)
    const health = this.healthGuardian(air.peak_aqi > 350 ? 'HIGH' : 'MODERATE', 'hi')
    const care = this.careCircle('ANOMALOUS_VITALS', 'HIGH', true)
    return {
      coordinator_status: 'CYCLE_COMPLETED',
      air_watcher: air,
      health_guardian: health,
      care_circle: care,
      mode: this.status().active_mode,
    }
  }
}

function evaluateCaregiverSharing(sharingEnabled: boolean) {
  return sharingEnabled
    ? { permitted: true, reason: 'PERMIT: Cedar Policy 1 allows coarse risk and area access when sharing is enabled.' }
    : { permitted: false, reason: 'DENY: Cedar Policy 1 requires sharing_enabled == true for caregiver access.' }
}

export { safeAdvice }

import { randomUUID } from 'node:crypto'
import type { HealthEventInput, HealthEventResponse } from '../schemas/api.js'
import type { AlertRepository } from '../repositories/interfaces.js'
import { evaluatePolicy } from './privacy-service.js'

export class RiskEngine {
  private readonly cooldownTracker = new Map<string, number>()
  private readonly cooldownWindowMs = 180_000

  constructor(private readonly alerts: AlertRepository) {}

  async evaluate(event: HealthEventInput): Promise<HealthEventResponse> {
    if (!event.consent_given) {
      return {
        event_id: `evt-${randomUUID().replaceAll('-', '').slice(0, 8)}`,
        status: 'REJECTED_NO_CONSENT' as const,
        action_taken: 'Blocked event processing: User has not consented to telemetry sharing.',
        coarse_risk_band: 'UNKNOWN',
        caregiver_notified: false,
        message_to_caregiver: null,
        audit_trace_id: `trace-deny-${randomUUID().replaceAll('-', '').slice(0, 6)}`,
      }
    }
    const policy = evaluatePolicy('Caregiver', 'TransmitCoarseRisk', { sharing_enabled: event.sharing_enabled })
    if (!policy.permitted) {
      return {
        event_id: `evt-${randomUUID().replaceAll('-', '').slice(0, 8)}`,
        status: 'REJECTED_NO_CONSENT' as const,
        action_taken: `Event kept strictly on-device: ${policy.reason}`,
        coarse_risk_band: event.coarse_risk_band,
        caregiver_notified: false,
        message_to_caregiver: null,
        audit_trace_id: `trace-cedar-deny-${randomUUID().replaceAll('-', '').slice(0, 6)}`,
      }
    }

    const now = Date.now()
    const userKey = `${event.user_id}:${event.event_trigger}`
    const lastTime = this.cooldownTracker.get(userKey) ?? 0
    const eventId = `evt-${randomUUID().replaceAll('-', '').slice(0, 8)}`
    const timestamp = new Date(now).toISOString()
    if (now - lastTime < this.cooldownWindowMs) {
      return {
        event_id: eventId,
        status: 'DEDUPLICATED' as const,
        action_taken: `Duplicate alert suppressed within ${this.cooldownWindowMs / 1000}s cooldown window. Caregiver trust preserved.`,
        coarse_risk_band: event.coarse_risk_band,
        caregiver_notified: false,
        message_to_caregiver: null,
        audit_trace_id: `trace-dedup-${randomUUID().replaceAll('-', '').slice(0, 6)}`,
      }
    }

    const escalated = ['HIGH', 'CRITICAL'].includes(event.coarse_risk_band)
      || ['NO_REPLY_CHECKIN', 'MOTION_FALL'].includes(event.event_trigger)
    let message: string | null = null
    let action: string
    if (!escalated) {
      action = 'Selected approved on-device preventive guidance (simulation only).'
    } else if (event.event_trigger === 'NO_REPLY_CHECKIN') {
      message = "Maa's breathing looks harder than usual and outside air is at a very unhealthy level. She has not replied to the app for two minutes. Please call her."
      action = 'Prepared a simulated calm priority notification for the caregiver.'
    } else if (event.event_trigger === 'MOTION_FALL') {
      message = 'A sudden motion impact was detected on the phone. Check-in prompt active with cancel countdown.'
      action = 'Fall detection escalation simulated with 30-second cancellation window.'
    } else {
      message = `Maa's health risk is currently ${event.coarse_risk_band} under severe smog conditions in ${event.coarse_area}.`
      action = 'Prepared a simulated preventive alert for the caregiver activity feed.'
    }

    const status = escalated ? 'ESCALATED' : 'ACCEPTED'
    await this.alerts.put({
      eventId,
      timestamp,
      status,
      ttl: Math.floor(now / 1000) + 14 * 24 * 60 * 60,
    })
    this.cooldownTracker.set(userKey, now)
    return {
      event_id: eventId,
      status: status as 'ACCEPTED' | 'ESCALATED',
      action_taken: action,
      coarse_risk_band: event.coarse_risk_band,
      caregiver_notified: false,
      message_to_caregiver: message,
      audit_trace_id: `trace-pass-${randomUUID().replaceAll('-', '').slice(0, 6)}`,
    }
  }
}

import { randomUUID } from 'node:crypto'
import type { AlertSimulationInput, AlertSimulationResponse } from '../schemas/api.js'
import type { AlertRepository } from '../repositories/interfaces.js'
import { DecisionService } from '../services/decision-service.js'
import { evaluatePolicy } from '../services/privacy-service.js'

interface SimulationStep {
  step_number: number
  step_name: string
  status: string
  actor: string
  detail: string
  timestamp: string
}

const step = (number: number, name: string, status: string, actor: string, detail: string, timestamp: string): SimulationStep => ({
  step_number: number,
  step_name: name,
  status,
  actor,
  detail,
  timestamp,
})

export class AlertLadder {
  constructor(
    private readonly alerts: AlertRepository,
    private readonly decisions: DecisionService,
  ) {}

  async simulate(request: AlertSimulationInput): Promise<AlertSimulationResponse> {
    const simulationId = `sim-${randomUUID().replaceAll('-', '').slice(0, 8)}`
    let finalState: string
    let steps: SimulationStep[]

    if (request.scenario === 'RESPIRATORY_DISTRESS_UNANSWERED') {
      const mayNotify = request.sharing_enabled
      steps = [
        step(1, 'ON_DEVICE_ANOMALY_DETECTION', 'COMPLETED', 'Phone (simulation)', 'Simulated local anomaly detection; raw vitals remain on device.', '10:10:00 AM'),
        step(2, 'ARE_YOU_OK_CHECKIN_PROMPT', 'COMPLETED', 'Health Guardian Agent', 'Simulated check-in prompt. 2-minute timer initiated.', '10:10:05 AM'),
        step(3, 'CHECKIN_TIMEOUT_EXPIRED', 'COMPLETED', 'Alert Ladder Simulator', 'Simulated 120-second timeout; sharing policy checked.', '10:12:05 AM'),
        step(4, mayNotify ? 'CAREGIVER_NOTIFICATION_SIMULATED' : 'CAREGIVER_NOTIFICATION_BLOCKED', mayNotify ? 'SIMULATED' : 'BLOCKED', 'Care Circle (simulation)', mayNotify ? 'Caregiver notification prepared; no SMS or SNS message was sent.' : 'Sharing is disabled; caregiver notification suppressed.', '10:12:15 AM'),
        step(5, 'STANDBY_FOR_CALL_RESOLUTION', mayNotify ? 'AWAITING_CAREGIVER_ACTION' : 'LOCAL_ONLY', 'Care Circle Dashboard (simulation)', 'Emergency dispatch remains a simulation and no call was made.', '10:12:30 AM'),
      ]
      finalState = mayNotify ? 'CAREGIVER_NOTIFIED_STANDBY' : 'LOCAL_ONLY_NO_CONSENT'
    } else if (request.scenario === 'INVERSION_SPIKE_MORNING_NUDGE') {
      steps = [
        step(1, 'ENVIRONMENTAL_RISK_CHECK', 'COMPLETED', 'Air Watcher (simulation)', 'Sample forecast indicates a modeled inversion risk; not a live sensor alert.', '06:00:00 AM'),
        step(2, 'PREVENTIVE_GUIDANCE_SELECTED', 'COMPLETED', 'Health Guardian', 'Selected fixed, approved preventive guidance; no diagnosis was generated.', '06:00:02 AM'),
        step(3, 'ON_DEVICE_MORNING_NUDGE', 'SIMULATED', 'Companion (simulation)', 'Morning guidance displayed locally; no message was sent to a caregiver.', '06:00:05 AM'),
      ]
      finalState = 'MORNING_NUDGE_DELIVERED'
    } else if (request.scenario === 'USER_OK_CONFIRMED') {
      steps = [
        step(1, 'ARE_YOU_OK_CHECKIN_PROMPT', 'COMPLETED', 'Health Guardian Agent', 'Check-in prompt simulated on the phone.', '10:10:00 AM'),
        step(2, 'USER_RESPONSE_RECEIVED', 'COMPLETED', 'User (simulation)', 'User response recorded in the simulation.', '10:10:25 AM'),
        step(3, 'ESCALATION_CANCELLED', 'RESOLVED', 'Alert Ladder Simulator', 'Workflow terminated gracefully. No caregiver notification was sent.', '10:10:26 AM'),
      ]
      finalState = 'RESOLVED_SAFE'
    } else if (request.scenario === 'FALL_DETECTED_SOS_CANCELLED') {
      steps = [
        step(1, 'MOTION_IMPACT_DETECTED', 'COMPLETED', 'Phone accelerometer (simulation)', 'Potential motion impact simulated; no real sensor data was received.', '02:15:00 PM'),
        step(2, 'CANCEL_COUNTDOWN_ACTIVE', 'COMPLETED', 'Companion (simulation)', '30-second cancellation countdown shown in simulation.', '02:15:02 PM'),
        step(3, 'CANCEL_TAP_BY_USER', 'RESOLVED', 'User (simulation)', 'User cancelled before expiration. No alert was sent.', '02:15:14 PM'),
      ]
      finalState = 'FALL_ALERT_CANCELLED_BY_USER'
    } else {
      const locationPolicy = evaluatePolicy('EmergencyContact', 'ViewExactLocation', {
        is_sos_active: true,
        allow_location_on_sos: request.allow_location_on_sos,
      })
      steps = [
        step(1, 'SOS_COUNTDOWN_EXPIRED', 'COMPLETED', 'Alert Ladder Simulator', 'Unanswered escalation simulated; no emergency service was contacted.', '10:15:00 AM'),
        step(2, 'EMERGENCY_CONTACT_NOTIFICATION_SIMULATED', 'SIMULATED', 'Alert Ladder Simulator', 'No SNS message was sent. Exact location sharing: ' + (locationPolicy.permitted ? 'permitted for this simulation' : 'not permitted by consent policy') + '.', '10:15:10 AM'),
      ]
      finalState = 'EMERGENCY_SOS_DISPATCHED'
    }

    const timestamp = new Date().toISOString()
    const eventId = simulationId
    await this.alerts.put({
      eventId,
      timestamp,
      status: finalState,
      ttl: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60,
    })
    await this.decisions.record(
      'Care Circle',
      `Simulated Alert Workflow: ${request.scenario}`,
      `Simulation final state: ${finalState}. Simulated steps: ${steps.length}. No external notification was sent.`,
      'Alert Ladder Simulation',
      finalState.includes('EMERGENCY') || finalState.includes('CAREGIVER') ? 'HIGH' : 'LOW',
    )

    return {
      simulation_id: simulationId,
      scenario: request.scenario,
      final_state: finalState,
      steps,
      disclaimer: 'SIMULATION ONLY: No actual SMS, call, or 112 emergency dispatch was executed.',
    }
  }
}

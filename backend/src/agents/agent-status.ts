import { env } from '../config/env.js'

export function getAgentStatus() {
  return {
    active_mode: 'local_deterministic' as const,
    bedrock_available: false,
    bedrock_enabled: env.enableBedrock,
    bedrock_status: env.enableBedrock ? 'enabled_unverified' : 'disabled',
    region: env.awsRegion,
    configured_model: env.bedrockModelId,
    agents_ready: ['Air Watcher', 'Health Guardian', 'Care Circle', 'Master Coordinator'],
    guardrails_enforced: true,
    offline_capable: true,
  }
}

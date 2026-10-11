import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime'
import { env } from '../config/env.js'
import { containsRawHealthData } from '../services/privacy-service.js'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentResponse {
  text: string
  mode: 'bedrock' | 'local_deterministic'
  model_id: string
  input_tokens: number
  output_tokens: number
  fallback_reason?: string
}

export class BedrockProvider {
  private readonly client: BedrockRuntimeClient | undefined
  readonly region = env.awsRegion
  readonly modelId = env.bedrockModelId

  constructor(client?: BedrockRuntimeClient) {
    this.client = env.enableBedrock ? client ?? new BedrockRuntimeClient({ region: env.awsRegion }) : undefined
  }

  get enabled(): boolean {
    return this.client !== undefined
  }

  async converse(
    systemPrompt: string,
    messages: AgentMessage[],
    options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
  ): Promise<AgentResponse> {
    if (containsRawHealthData(systemPrompt) || messages.some((message) => containsRawHealthData(message.content))) {
      return this.localFallback('Raw health telemetry is not sent to Bedrock')
    }
    if (!this.client) return this.localFallback()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000)
    const input: ConverseCommandInput = {
      modelId: this.modelId,
      system: [{
        text: `${systemPrompt}\n\nSafety constraints are mandatory: never disclose raw health telemetry, never infer or override consent, privacy, authorization, or escalation policy, and do not provide diagnosis or emergency-service claims.`,
      }],
      messages: messages.map((message) => ({
        role: message.role,
        content: [{ text: message.content }],
      })),
      inferenceConfig: {
        maxTokens: options.maxTokens ?? 500,
        temperature: options.temperature ?? 0.2,
      },
    }

    try {
      const response = await this.client.send(new ConverseCommand(input), { abortSignal: controller.signal })
      const text = response.output?.message?.content
        ?.map((item) => item.text)
        .find((candidate): candidate is string => typeof candidate === 'string' && candidate.trim().length > 0)
      if (!text) return this.localFallback('Bedrock returned no usable text response')
      return {
        text,
        mode: 'bedrock',
        model_id: this.modelId,
        input_tokens: response.usage?.inputTokens ?? 0,
        output_tokens: response.usage?.outputTokens ?? 0,
      }
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'Unknown Bedrock error'
      return this.localFallback(`Bedrock request failed (${reason})`)
    } finally {
      clearTimeout(timeout)
    }
  }

  private localFallback(fallbackReason = 'ENABLE_BEDROCK is false'): AgentResponse {
    return {
      text: 'Deterministic local mode is active. Follow approved environmental-health guidance; this is not medical advice.',
      mode: 'local_deterministic',
      model_id: 'rules-engine-v1.0',
      fallback_reason: fallbackReason,
      input_tokens: 0,
      output_tokens: 0,
    }
  }
}

export const bedrockProvider = new BedrockProvider()

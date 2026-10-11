import { afterEach, describe, expect, it, vi } from 'vitest'
import { BedrockProvider } from '../agents/bedrock-provider.js'

describe('Bedrock provider', () => {
  afterEach(() => vi.restoreAllMocks())

  it('uses deterministic local mode when Bedrock is disabled', async () => {
    const provider = new BedrockProvider()
    const result = await provider.converse('safe system prompt', [{ role: 'user', content: 'hello' }])
    expect(result.mode).toBe('local_deterministic')
    expect(result.model_id).toBe('rules-engine-v1.0')
    expect(result.fallback_reason).toBe('ENABLE_BEDROCK is false')
  })

  it('returns validated mocked Converse text and usage when enabled', async () => {
    const provider = new BedrockProvider()
    Object.defineProperty(provider, 'client', { value: { send: vi.fn().mockResolvedValue({
      output: { message: { content: [{ text: 'Grounded response' }] } },
      usage: { inputTokens: 12, outputTokens: 8 },
    }) } })
    const result = await provider.converse('safe system prompt', [{ role: 'user', content: 'hello' }])
    expect(result).toMatchObject({ mode: 'bedrock', text: 'Grounded response', input_tokens: 12, output_tokens: 8 })
  })

  it('does not forward raw health telemetry to the configured provider', async () => {
    const provider = new BedrockProvider()
    const send = vi.fn()
    Object.defineProperty(provider, 'client', { value: { send } })
    const result = await provider.converse('safe system prompt', [{ role: 'user', content: 'Heart rate: 96, SpO2: 93' }])
    expect(send).not.toHaveBeenCalled()
    expect(result.mode).toBe('local_deterministic')
    expect(result.text).not.toContain('96')

    const promptResult = await provider.converse('Heart rate: 96 must remain private', [{ role: 'user', content: 'hello' }])
    expect(send).not.toHaveBeenCalled()
    expect(promptResult.mode).toBe('local_deterministic')
  })

  it('falls back safely when Converse fails or returns no text', async () => {
    const provider = new BedrockProvider()
    Object.defineProperty(provider, 'client', { value: { send: vi.fn().mockRejectedValue(new Error('ThrottlingException')) } })
    const failed = await provider.converse('safe system prompt', [{ role: 'user', content: 'hello' }])
    expect(failed.mode).toBe('local_deterministic')
    expect(failed.fallback_reason).toContain('Bedrock request failed')

    Object.defineProperty(provider, 'client', { value: { send: vi.fn().mockResolvedValue({ output: { message: { content: [] } } }) } })
    const invalid = await provider.converse('safe system prompt', [])
    expect(invalid.mode).toBe('local_deterministic')
  })

  it('aborts timed-out Converse requests and uses deterministic fallback', async () => {
    const provider = new BedrockProvider()
    Object.defineProperty(provider, 'client', { value: { send: vi.fn((_command, options) =>
      new Promise((_resolve, reject) => {
        options.abortSignal.addEventListener('abort', () => reject(new Error('Request aborted')))
      }),
    ) } })
    const result = await provider.converse('safe system prompt', [{ role: 'user', content: 'hello' }], { timeoutMs: 5 })
    expect(result.mode).toBe('local_deterministic')
    expect(result.fallback_reason).toContain('Bedrock request failed')
  })
})

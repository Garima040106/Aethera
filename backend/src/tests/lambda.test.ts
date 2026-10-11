import { describe, expect, it } from 'vitest'
import { createApplication } from '../app.js'
import { handler } from '../lambda.js'

describe('Lambda-ready application factory', () => {
  it('initializes the same Express routes without opening a local listener', async () => {
    expect(handler).toBeTypeOf('function')
    const app = createApplication()
    const response = await (await import('supertest')).default(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.status).toBe('healthy')
  })
})

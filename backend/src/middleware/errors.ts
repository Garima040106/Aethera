import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { PersistenceError } from '../aws/dynamodb-repositories.js'
import { LocationSearchUnavailableError } from '../services/location-search-service.js'
import { CpcbAqiUnavailableError } from '../services/cpcb-aqi-client.js'
import { LocationRoutesUnavailableError } from '../services/location-routes-service.js'
import { OpenMeteoAqiUnavailableError } from '../services/open-meteo-aqi-client.js'

export class RequestValidationError extends Error {
  constructor(readonly issues: { loc: (string | number)[]; msg: string; type: string }[]) {
    super('Request validation failed')
    this.name = 'RequestValidationError'
  }
}

export function parseRequest<T>(parse: () => T, location: 'body' | 'query'): T {
  try {
    return parse()
  } catch (error) {
    if (error instanceof ZodError) {
      throw new RequestValidationError(error.issues.map((issue) => ({
        loc: [location, ...issue.path],
        msg: issue.message,
        type: issue.code,
      })))
    }
    throw error
  }
}

export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof RequestValidationError) {
    res.status(422).json({ detail: error.issues })
    return
  }
  if (error instanceof ZodError) {
    res.status(422).json({
      detail: error.issues.map((issue) => ({
        loc: ['body', ...issue.path],
        msg: issue.message,
        type: issue.code,
      })),
    })
    return
  }
  if (error instanceof PersistenceError) {
    res.status(503).json({ detail: error.message })
    return
  }
  if (error instanceof LocationSearchUnavailableError) {
    res.status(503).json({ detail: error.message })
    return
  }
  if (error instanceof CpcbAqiUnavailableError) {
    res.status(503).json({ detail: error.message })
    return
  }
  if (error instanceof LocationRoutesUnavailableError) {
    res.status(503).json({ detail: error.message })
    return
  }
  if (error instanceof OpenMeteoAqiUnavailableError) {
    res.status(503).json({ detail: error.message })
    return
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ detail: 'Malformed JSON request body' })
    return
  }
  console.error(`Unhandled request error: ${error instanceof Error ? error.name : 'UnknownError'}`)
  res.status(500).json({ detail: 'Internal Server Error' })
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ detail: 'Not Found' })
}

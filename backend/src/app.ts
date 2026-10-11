import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { createApiRouter, type RouteDependencies } from './routes/api.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'

export function createApplication(dependencies: RouteDependencies = {}) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  app.use(express.json({ limit: '32kb' }))
  app.use(createApiRouter(dependencies))
  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}

export const app = createApplication()

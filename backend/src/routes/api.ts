import { Router } from 'express'
import { env } from '../config/env.js'
import { containsRawHealthData } from '../services/privacy-service.js'
import { EnvironmentalService, metricsResponse } from '../services/environmental-service.js'
import { RiskEngine } from '../services/risk-engine.js'
import { DecisionService } from '../services/decision-service.js'
import { AlertLadder } from '../workflows/alert-ladder.js'
import { getAgentStatus } from '../agents/agent-status.js'
import { compareScenarios } from '../services/scenario-service.js'
import { alertSimulationSchema, areaQuerySchema, forecastQuerySchema, healthEventSchema, scenarioCompareSchema } from '../schemas/api.js'
import { asyncHandler, parseRequest } from '../middleware/errors.js'
import { createRepositories, type RepositorySet } from '../aws/repositories.js'

export interface RouteDependencies {
  repositories?: RepositorySet
  environmental?: EnvironmentalService
}

export function createApiRouter(dependencies: RouteDependencies = {}): Router {
  const router = Router()
  const repositories = dependencies.repositories ?? createRepositories()
  const environmental = dependencies.environmental ?? new EnvironmentalService()
  const riskEngine = new RiskEngine(repositories.alerts)
  const decisions = new DecisionService(repositories.decisions)
  const alertLadder = new AlertLadder(repositories.alerts, decisions)

  router.get('/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app_name: env.appName,
      version: env.appVersion,
      environment: env.nodeEnv,
      bedrock_mode: env.enableBedrock ? 'bedrock_enabled_unverified' : 'local_deterministic_fallback',
      timestamp: new Date().toISOString(),
    })
  })

  router.get('/api/forecast', (req, res, next) => {
    try {
      const query = parseRequest(() => forecastQuerySchema.parse(req.query), 'query')
      res.json(environmental.forecast(query.area, query.hours))
    } catch (error) {
      next(error)
    }
  })

  router.get('/api/inversion', (req, res, next) => {
    try {
      const query = parseRequest(() => areaQuerySchema.parse(req.query), 'query')
      res.json(environmental.inversion(query.area))
    } catch (error) {
      next(error)
    }
  })

  router.get('/api/plumes', (req, res, next) => {
    try {
      const query = parseRequest(() => areaQuerySchema.parse(req.query), 'query')
      res.json(environmental.plumes(query.area))
    } catch (error) {
      next(error)
    }
  })

  router.get('/api/metrics', (_req, res) => res.json(metricsResponse))

  router.get('/api/agents/status', (_req, res) => res.json(getAgentStatus()))

  router.get('/api/decisions', asyncHandler(async (_req, res) => {
    res.json(await decisions.list())
  }))

  router.post('/api/events/health', asyncHandler(async (req, res) => {
    if (containsRawHealthData(req.body)) {
      res.status(422).json({
        detail: [{
          loc: ['body'],
          msg: 'Raw health telemetry is not accepted; only a coarse risk band and area may be submitted.',
          type: 'privacy_violation',
        }],
      })
      return
    }
    const event = parseRequest(() => healthEventSchema.parse(req.body), 'body')
    res.json(await riskEngine.evaluate(event))
  }))

  router.post('/api/alerts/simulate', asyncHandler(async (req, res) => {
    const request = parseRequest(() => alertSimulationSchema.parse(req.body), 'body')
    res.json(await alertLadder.simulate(request))
  }))

  router.post('/api/scenarios/compare', (req, res, next) => {
    try {
      const request = parseRequest(() => scenarioCompareSchema.parse(req.body), 'body')
      res.json(compareScenarios(request))
    } catch (error) {
      next(error)
    }
  })

  return router
}

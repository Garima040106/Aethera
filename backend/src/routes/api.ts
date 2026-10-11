import { Router } from 'express'
import { env } from '../config/env.js'
import { containsRawHealthData } from '../services/privacy-service.js'
import { EnvironmentalService, metricsResponse } from '../services/environmental-service.js'
import { RiskEngine } from '../services/risk-engine.js'
import { DecisionService } from '../services/decision-service.js'
import { AlertLadder } from '../workflows/alert-ladder.js'
import { getAgentStatus } from '../agents/agent-status.js'
import { compareScenarios } from '../services/scenario-service.js'
import { alertSimulationSchema, areaQuerySchema, environmentalHistoryQuerySchema, forecastQuerySchema, healthEventSchema, placeSearchQuerySchema, scenarioCompareSchema } from '../schemas/api.js'
import { asyncHandler, parseRequest } from '../middleware/errors.js'
import { createRepositories, type RepositorySet } from '../aws/repositories.js'
import { LocationSearchService } from '../services/location-search-service.js'
import type { LocationSearchProvider } from '../services/location-search-service.js'
import { CpcbAqiClient } from '../services/cpcb-aqi-client.js'
import type { CpcbAqiProvider } from '../services/cpcb-aqi-client.js'

export interface RouteDependencies {
  repositories?: RepositorySet
  environmental?: EnvironmentalService
  locationSearch?: LocationSearchProvider
  cpcbAqi?: CpcbAqiProvider
}

export function createApiRouter(dependencies: RouteDependencies = {}): Router {
  const router = Router()
  const repositories = dependencies.repositories ?? createRepositories()
  const environmental = dependencies.environmental ?? new EnvironmentalService()
  const locationSearch = dependencies.locationSearch ?? new LocationSearchService()
  const cpcbAqi = dependencies.cpcbAqi ?? new CpcbAqiClient()
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

  router.get('/health/dynamodb', asyncHandler(async (_req, res) => {
    if (repositories.mode !== 'dynamodb' || !repositories.checkConnectivity) {
      res.status(503).json({
        status: 'disabled',
        database: 'dynamodb',
        detail: 'DynamoDB persistence is not enabled.',
      })
      return
    }
    await repositories.checkConnectivity()
    res.json({
      status: 'healthy',
      database: 'dynamodb',
      region: env.awsRegion,
      table: env.dynamoDBTable,
      checked_at: new Date().toISOString(),
    })
  }))

  router.get('/api/location/search', asyncHandler(async (req, res) => {
    const query = parseRequest(() => placeSearchQuerySchema.parse(req.query), 'query')
    if (!locationSearch.configured) {
      res.status(503).json({ detail: 'Amazon Location place search is not configured.' })
      return
    }
    res.json({ results: await locationSearch.search(query.q) })
  }))

  router.get('/api/aqi/stations', asyncHandler(async (_req, res) => {
    if (!cpcbAqi.configured) {
      res.json({
        status: 'unavailable',
        updated_at: null,
        source: null,
        stations: [],
        detail: 'CPCB live station data is not configured. Set DATA_GOV_IN_API_KEY in the backend environment.',
      })
      return
    }
    const stations = await cpcbAqi.getDelhiStations()
    const latest = stations.reduce<string | null>((value, station) =>
      value === null || Date.parse(station.observed_at) > Date.parse(value) ? station.observed_at : value, null)
    const stale = latest !== null && Date.now() - Date.parse(latest) > 2 * 60 * 60 * 1000
    res.json({
      status: stations.length === 0 ? 'unavailable' : stale ? 'stale' : 'available',
      updated_at: latest,
      source: stations.length > 0 ? stations[0]!.source : 'CPCB · data.gov.in',
      stations,
      ...(stations.length === 0
        ? { detail: 'The CPCB feed returned no Delhi stations with coordinates and enough valid pollutant readings to calculate an Indian AQI.' }
        : {}),
    })
  }))

  router.get('/api/forecast', asyncHandler(async (req, res) => {
    const query = parseRequest(() => forecastQuerySchema.parse(req.query), 'query')
    const forecast = await environmental.forecast(query.area, query.hours)
    await repositories.environmental.putForecast(query.area, forecast)
    res.json(forecast)
  }))

  router.get('/api/environmental-data', asyncHandler(async (req, res) => {
    const query = parseRequest(() => environmentalHistoryQuerySchema.parse(req.query), 'query')
    res.json({
      area: query.area,
      forecasts: await repositories.environmental.listRecentForecasts(query.area, query.limit),
    })
  }))

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

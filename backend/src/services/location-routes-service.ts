import { CalculateRoutesCommand, GeoRoutesClient } from '@aws-sdk/client-geo-routes'
import { env } from '../config/env.js'

export type Coordinate = [number, number]

export interface LocationRoute {
  summary?: {
    Distance?: number | undefined
    Duration?: number | undefined
  }
  legs?: Array<{
    geometry?: {
      LineString?: Coordinate[]
    }
    summary?: {
      Overview?: {
        Distance?: number
        Duration?: number
      }
    }
  }>
}

export interface LocationRoutesProvider {
  calculate(origin: Coordinate, destination: Coordinate): Promise<LocationRoute[]>
}

export class LocationRoutesUnavailableError extends Error {
  constructor() {
    super('Amazon Location route calculation is temporarily unavailable.')
    this.name = 'LocationRoutesUnavailableError'
  }
}

export class LocationRoutesService implements LocationRoutesProvider {
  private readonly client = new GeoRoutesClient({ region: env.awsRegion })

  async calculate(origin: Coordinate, destination: Coordinate): Promise<LocationRoute[]> {
    try {
      const response = await this.client.send(new CalculateRoutesCommand({
        Origin: origin,
        Destination: destination,
        TravelMode: 'Car',
        OptimizeRoutingFor: 'FastestRoute',
        MaxAlternatives: 2,
        DepartNow: true,
        LegGeometryFormat: 'Simple',
        LegAdditionalFeatures: ['Summary'],
        InstructionsMeasurementSystem: 'Metric',
      }))
      const routes = response.Routes ?? []
      if (routes.length === 0) throw new LocationRoutesUnavailableError()

      return routes.map((route) => ({
        ...(route.Summary ? { summary: route.Summary } : {}),
        ...(route.Legs
          ? {
            legs: route.Legs.map((leg) => {
              const line = leg.Geometry?.LineString?.flatMap((point) => {
                const [longitude, latitude] = point
                return (
                  typeof longitude === 'number'
                  && Number.isFinite(longitude)
                  && longitude >= -180
                  && longitude <= 180
                  && typeof latitude === 'number'
                  && Number.isFinite(latitude)
                  && latitude >= -90
                  && latitude <= 90
                ) ? [[longitude, latitude] as Coordinate] : []
              })
              return {
                ...(line && line.length > 1 ? { geometry: { LineString: line } } : {}),
              }
            }),
          }
          : {}),
      }))
    } catch (error) {
      if (error instanceof LocationRoutesUnavailableError) throw error
      console.error(JSON.stringify({
        level: 'error',
        service: 'amazon-location',
        operation: 'CalculateRoutes',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }))
      throw new LocationRoutesUnavailableError()
    }
  }
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { CalculateRoutesCommand, GeoRoutesClient } from '@aws-sdk/client-geo-routes'
import { mockClient } from 'aws-sdk-client-mock'
import { LocationRoutesService, LocationRoutesUnavailableError } from '../services/location-routes-service.js'

const geoRoutesMock = mockClient(GeoRoutesClient)

describe('Amazon Location routes SDK service', () => {
  afterEach(() => {
    geoRoutesMock.reset()
    vi.restoreAllMocks()
  })

  it('calls CalculateRoutes through the SDK and returns the route planner contract', async () => {
    geoRoutesMock.on(CalculateRoutesCommand).resolves({
      Routes: [{
        Summary: { Distance: 4200, Duration: 900 },
        Legs: [{
          Geometry: { LineString: [[77.2, 28.6], [77.3, 28.7]] },
        }],
      }],
    })

    const routes = await new LocationRoutesService().calculate([77.2, 28.6], [77.3, 28.7])
    const input = geoRoutesMock.commandCalls(CalculateRoutesCommand)[0]?.args[0].input

    expect(input).toMatchObject({
      Origin: [77.2, 28.6],
      Destination: [77.3, 28.7],
      TravelMode: 'Car',
      OptimizeRoutingFor: 'FastestRoute',
      MaxAlternatives: 2,
      DepartNow: true,
      LegGeometryFormat: 'Simple',
    })
    expect(input?.Key).toBeUndefined()
    expect(routes).toEqual([{
      summary: { Distance: 4200, Duration: 900 },
      legs: [{ geometry: { LineString: [[77.2, 28.6], [77.3, 28.7]] } }],
    }])
  })

  it('surfaces empty results and sanitizes SDK failures', async () => {
    geoRoutesMock.on(CalculateRoutesCommand).resolves({ Routes: [] })
    await expect(new LocationRoutesService().calculate([77.2, 28.6], [77.3, 28.7]))
      .rejects.toBeInstanceOf(LocationRoutesUnavailableError)

    geoRoutesMock.on(CalculateRoutesCommand).rejects(new Error('sensitive request detail'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await expect(new LocationRoutesService().calculate([77.2, 28.6], [77.3, 28.7]))
      .rejects.toThrow('temporarily unavailable')
    expect(log).toHaveBeenCalledWith(expect.not.stringContaining('sensitive request detail'))
  })
})

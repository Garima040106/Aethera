import { GeoPlacesClient, SearchTextCommand } from '@aws-sdk/client-geo-places'
import { env } from '../config/env.js'

export interface PlaceSearchResult {
  id: string
  label: string
  address: string
  longitude: number
  latitude: number
}

export interface LocationSearchProvider {
  readonly configured: boolean
  search(query: string): Promise<PlaceSearchResult[]>
}

export class LocationSearchUnavailableError extends Error {
  constructor() {
    super('Amazon Location place search is temporarily unavailable.')
    this.name = 'LocationSearchUnavailableError'
  }
}

export class LocationSearchService {
  private readonly client = new GeoPlacesClient({ region: env.awsRegion })

  get configured(): boolean {
    return true
  }

  async search(query: string): Promise<PlaceSearchResult[]> {
    try {
      const response = await this.client.send(new SearchTextCommand({
        QueryText: query,
        BiasPosition: [77.209, 28.6139],
        Filter: { IncludeCountries: ['IND'] },
        MaxResults: 6,
        IntendedUse: 'SingleUse',
        Language: 'en',
      }))

      return (response.ResultItems ?? []).flatMap((item) => {
        const position = item.Position
        const longitude = position?.[0]
        const latitude = position?.[1]
        if (
          typeof longitude !== 'number'
          || !Number.isFinite(longitude)
          || longitude < -180
          || longitude > 180
          || typeof latitude !== 'number'
          || !Number.isFinite(latitude)
          || latitude < -90
          || latitude > 90
        ) {
          return []
        }
        return [{
          id: item.PlaceId ?? `${longitude},${latitude}`,
          label: item.Title ?? item.Address?.Label ?? 'Unnamed place',
          address: item.Address?.Label ?? '',
          longitude,
          latitude,
        }]
      })
    } catch (error) {
      console.error(JSON.stringify({
        level: 'error',
        service: 'amazon-location',
        operation: 'SearchText',
        errorName: error instanceof Error ? error.name : 'UnknownError',
      }))
      throw new LocationSearchUnavailableError()
    }
  }
}

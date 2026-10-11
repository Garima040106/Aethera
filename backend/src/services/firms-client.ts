import { env } from '../config/env.js'
import { fireHotspots } from '../data/fixtures.js'
import type { PlumeResponse } from '../schemas/api.js'

export type FireHotspot = PlumeResponse['hotspots'][number]

export interface FirmsHotspotResponse {
  source: string
  hotspots: FireHotspot[]
  isFixture: boolean
  dataSource: string
}

export class FirmsClient {
  private cachedHotspots: FireHotspot[] = fireHotspots.map((point) => ({ ...point }))
  private isFixture = true

  constructor(
    private readonly mapKey = env.nasaFirmsMapKey,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  get configured(): boolean {
    return Boolean(this.mapKey && this.mapKey.trim().length > 0)
  }

  getUpwindHotspots(): FirmsHotspotResponse {
    if (!this.configured) {
      return {
        source: 'NASA FIRMS sample fixture; not a live satellite feed',
        hotspots: this.cachedHotspots,
        isFixture: true,
        dataSource: 'Illustrative NASA FIRMS (VIIRS/MODIS) sample fixture + GFS attribution; no live source connected',
      }
    }

    return {
      source: this.isFixture
        ? 'NASA FIRMS sample fixture; live fetch not executed'
        : 'NASA FIRMS Near Real-Time (VIIRS S-NPP)',
      hotspots: this.cachedHotspots,
      isFixture: this.isFixture,
      dataSource: this.isFixture
        ? 'Illustrative NASA FIRMS (VIIRS/MODIS) sample fixture + GFS attribution; no live source connected'
        : 'Live NASA FIRMS active fire satellite detections',
    }
  }

  async fetchLatestHotspots(): Promise<FirmsHotspotResponse> {
    if (!this.configured) {
      return this.getUpwindHotspots()
    }

    const bbox = '74,28,78,32'
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(this.mapKey!)}/VIIRS_SNPP_NRT/${bbox}/1`
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5_000)
      const res = await this.fetcher(url, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`)

      const text = await res.text()
      if (text.toLowerCase().includes('invalid') || text.trim().length === 0) {
        throw new Error('Invalid NASA FIRMS MAP_KEY')
      }

      const lines = text.trim().split('\n')
      if (lines.length > 1) {
        const header = lines[0]!.split(',')
        const latIdx = header.indexOf('latitude')
        const lonIdx = header.indexOf('longitude')
        const brightIdx = header.indexOf('bright_ti4')
        const confIdx = header.indexOf('confidence')
        const parsedHotspots: FireHotspot[] = []

        for (let i = 1; i < lines.length && parsedHotspots.length < 50; i += 1) {
          const parts = lines[i]!.split(',')
          const lat = parseFloat(parts[latIdx] || '')
          const lon = parseFloat(parts[lonIdx] || '')
          const brightness = parseFloat(parts[brightIdx] || '330')
          const confidence = parts[confIdx] || 'nominal'
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            parsedHotspots.push({
              id: `FIRMS-LIVE-${i}`,
              latitude: lat,
              longitude: lon,
              brightness: Number.isFinite(brightness) ? brightness : 330,
              confidence: confidence === 'h' ? 'high' : confidence === 'l' ? 'low' : 'nominal',
              region: 'Punjab/Haryana Upwind Corridor',
            })
          }
        }
        if (parsedHotspots.length > 0) {
          this.cachedHotspots = parsedHotspots
          this.isFixture = false
        }
      }
    } catch {
      // Retain existing cached fixtures on failure
    }
    return this.getUpwindHotspots()
  }
}

export interface Area {
  lat: number
  lon: number
  name: string
}

export const areasGeo: Record<string, Area> = {
  noida: { lat: 28.628, lon: 77.3649, name: 'Noida Sector 62' },
  anand_vihar: { lat: 28.6469, lon: 77.316, name: 'Anand Vihar, Delhi' },
  punjabi_bagh: { lat: 28.674, lon: 77.131, name: 'Punjabi Bagh, Delhi' },
  gurugram: { lat: 28.4595, lon: 77.0266, name: 'Gurugram Sector 51' },
  central_delhi: { lat: 28.6139, lon: 77.209, name: 'Central Delhi' },
}

export const fireHotspots = [
  { id: 'FIRMS-PB-01', latitude: 30.901, longitude: 75.8573, brightness: 342.5, confidence: 'high', region: 'Ludhiana, Punjab' },
  { id: 'FIRMS-PB-02', latitude: 30.34, longitude: 76.38, brightness: 358.1, confidence: 'nominal', region: 'Patiala, Punjab' },
  { id: 'FIRMS-PB-03', latitude: 31.1471, longitude: 75.3412, brightness: 331, confidence: 'high', region: 'Moga, Punjab' },
  { id: 'FIRMS-HR-01', latitude: 29.9695, longitude: 76.8783, brightness: 329.8, confidence: 'high', region: 'Kurukshetra, Haryana' },
  { id: 'FIRMS-HR-02', latitude: 29.6857, longitude: 76.9905, brightness: 344.2, confidence: 'nominal', region: 'Karnal, Haryana' },
  { id: 'FIRMS-PB-04', latitude: 30.211, longitude: 74.9455, brightness: 365.4, confidence: 'high', region: 'Bathinda, Punjab' },
  { id: 'FIRMS-HR-03', latitude: 29.5349, longitude: 76.031, brightness: 338, confidence: 'nominal', region: 'Jind, Haryana' },
]

export const historicalDecisions = [
  {
    id: 'dec-001',
    time: '22:00',
    agent: 'Air Watcher',
    title: 'Raised Delhi NCR risk to High.',
    detail: 'A strong inversion is forecast from +18 h and 7 sample fire clusters are shown upwind in Punjab/Haryana.',
    evidence_source: 'Coupled Surrogate Model + NASA FIRMS sample fixture',
    risk_level: 'HIGH',
    redacted: true,
  },
  {
    id: 'dec-002',
    time: '05:30',
    agent: 'Health Guardian',
    title: "Chose 'stay in, light walk indoors' for Kamla.",
    detail: 'Preventive advice selected using the approved deterministic guidance library.',
    evidence_source: 'Approved Advice Rulebook v1.2',
    risk_level: 'MODERATE',
    redacted: true,
  },
  {
    id: 'dec-003',
    time: '06:00',
    agent: 'Care Circle',
    title: 'Sent Hindi morning guidance to Kamla.',
    detail: 'Hindi preferred language. Consent status was checked before caregiver sharing.',
    evidence_source: 'Cedar Policy Engine Consent Grant',
    risk_level: 'LOW',
    redacted: true,
  },
  {
    id: 'dec-004',
    time: '10:12',
    agent: 'Health Guardian',
    title: "Triggered 'Are you ok?' check-in.",
    detail: 'On-device anomaly detection requested a check-in. Raw health telemetry remained on device.',
    evidence_source: 'On-Device Anomaly Detector (simulated)',
    risk_level: 'HIGH',
    redacted: true,
  },
  {
    id: 'dec-005',
    time: '10:14',
    agent: 'Care Circle',
    title: 'Prepared caregiver notification.',
    detail: 'A coarse risk category was shared only after consent and sharing policy checks.',
    evidence_source: 'Alert Ladder Simulation',
    risk_level: 'HIGH',
    redacted: true,
  },
]

export const normalizeArea = (area: string): string => area.toLowerCase().replaceAll(' ', '_')
export const areaFor = (area: string): Area => areasGeo[normalizeArea(area)] ?? areasGeo.noida!

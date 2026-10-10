# Saans Saathi: System Architecture

## 1. System Overview

Saans Saathi is a privacy-first, full-stack environmental health companion designed for Delhi NCR. It predicts air pollution spikes by coupling meteorology and smoke plume transport over a 72-hour forecast horizon, monitors on-device health vitals without leaking raw biomedical data, and uses AI agents to orchestrate family caregiver escalations.

```
+---------------------------------------------------------------------------------------------------+
|                                      CLIENT LAYER (Browser / PWA)                                 |
|                                                                                                   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|   | Dashboard Page        |     | Companion Page (Kamla) |     | Caregiver Page (Rohan)       |   |
|   | - 72h Coupled Chart   |     | - Hindi/EN Guidance    |     | - Calm Actionable Cards      |   |
|   | - Inversion Strength  |     | - On-Device Risk AI    |     | - One-Tap Calling            |   |
|   | - Smoke Plume Map     |     | - "Are you ok?" Check  |     | - Cedar Consent Transparency |   |
|   | - Decision Log        |     | - Local Vitals (HR/O2) |     | - Escalation Timeline        |   |
|   +-----------------------+     +------------------------+     +------------------------------+   |
|                                                                                                   |
|               Offline Cache (ServiceWorker / IndexedDB / LocalStorage)                            |
+-------------------------------------------------+-------------------------------------------------+
                                                  | REST / JSON (Coarse Risk & Forecast Queries)
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                 BACKEND API LAYER (FastAPI :8000)                                 |
|                                                                                                   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
|   | Forecast & Inversion   |  | Multi-Agent Intelligence |  | Deterministic Privacy & Safety  |   |
|   | - 72h Coupled Stepper  |  | - Air Watcher Agent      |  | - Consent Verification          |   |
|   | - Ventilation Proxy    |  | - Health Guardian Agent  |  | - Vitals Coarse Quantization    |   |
|   | - Forward Plume Advect |  | - Care Circle Agent      |  | - Deduplication & Cooldown      |   |
|   | - ML Bias Correction   |  | - Coordinator Agent      |  | - Idempotent Alert Ladder       |   |
|   +------------------------+  +--------------------------+  +---------------------------------+   |
+----------------------------------------+------------------------------------+---------------------+
                                         |                                    |
                                         v                                    v
+------------------------------------------------+   +----------------------------------------------+
|             ENVIRONMENTAL DATA SOURCES         |   |                 AWS CLOUD LAYER              |
|                                                |   | (Deployable via CDK / Local Fallback Mode)   |
| - CPCB / OpenAQ (Station AQI & PM2.5/PM10/O3)  |   | - Amazon Bedrock (Foundation Models)         |
| - NASA FIRMS (Active stubble burning fires)    |   | - AWS Step Functions (Alert Ladder Orchestr.)|
| - NOAA GFS / IMD (Wind, Temp, Boundary Layer)  |   | - Amazon DynamoDB (Alerts & Decision Audit)  |
| - Deterministic Local Replay Fixtures          |   | - Amazon SNS (SMS / Email to Caregiver)      |
+------------------------------------------------+   +----------------------------------------------+
```

---

## 2. Subsystem Details

### 2.1 Environmental Coupled Forecasting Engine (`app/ml/` & `app/services/forecast.py`)
- **Coupling Mechanism:** Real-world Delhi NCR atmospheric physics exhibits strong two-way feedback. Stubble burning smoke particulate (PM2.5/PM10) reflects solar radiation, causing surface cooling and reinforcing nocturnal thermal inversion. Inversion collapses the Planetary Boundary Layer Height (PBLH) and suppresses horizontal wind ventilation ($V_c = \text{PBLH} \times U_{10}$), trapping more pollutants.
- **Surrogate Stepper:** Rather than claiming an impossible 24-hour WRF-Chem HPC run, we compute an honest, hourly 72-step coupled surrogate:
  $$\Delta C_{t+1} = \frac{E_{\text{local}} + T_{\text{plume}}(t)}{PBLH(t) \cdot U(t)} - k_{\text{dep}} C(t)$$
  $$PBLH_{t+1} = PBLH_{\text{base}}(t) \cdot \exp(-\alpha \cdot C(t))$$
- **Plume Advection:** Forward Euler Lagrangian parcel advection from upwind Punjab/Haryana fire clusters:
  $$x_{t+1} = x_t + u(x_t, y_t, t) \cdot \Delta t$$
  $$y_{t+1} = y_t + v(x_t, y_t, t) \cdot \Delta t$$
  with dispersion radius growing as $\sigma_r(t) = \sqrt{2 K t}$.
- **Baseline Comparison:** Persistence baseline ($C_{t+k} = C_t$) and uncoupled meteorological forecast baseline ($PBLH = PBLH_{\text{base}}$ without smoke feedback).

### 2.2 Privacy-Preserving Health Engine (`app/services/risk_engine.py`)
- **Principle of Minimality:** Raw vital signs (heart rate in bpm, SpO2 in %, body temperature in °C) remain on the user's device.
- **Coarse Risk Categorization:** Only quantized risk bands (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`) and coarse geographic zone (`Noida Sector 62`, `Central Delhi`) are ever transmitted.
- **Deterministic Rules Engine:** The LLM does NOT make diagnostic or threshold decisions. Strict rules evaluate:
  - Respiratory distress: $\text{SpO2} < 92\%$ OR ($\text{SpO2} < 94\%$ AND $\text{HR} > 95$).
  - Environmental exposure: Outdoor AQI > 300 with active inversion.
  - Heat stress: Ambient wet-bulb temperature or heat index $> 38^\circ\text{C}$.

### 2.3 Multi-Agent Architecture (`app/agents/`)
- Four specialized agents coordinated by a Master Coordinator:
  1. **Air Watcher:** Analyzes 72h forecast curves, inversion onset, and plume transit times.
  2. **Health Guardian:** Combines environmental risk with user profile and selects pre-approved safe preventive advice (e.g., "Walk indoors", "Use HEPA filtration", "Keep rescue inhaler close").
  3. **Care Circle:** Evaluates unanswered check-ins, constructs calm empathetic notifications for the caregiver in Hindi or English, and triggers escalation.
  4. **Coordinator:** Executes bounded tool calls, synthesizes traceable explanations, and logs decisions with citations.
- **Provider Interface:** Automatically routes to **Amazon Bedrock** (Claude 3.5 Sonnet / Haiku) when AWS credentials exist, or switches seamlessly to the deterministic **Local Agent Provider** when running without credentials.

### 2.4 Cloud Infrastructure (`infra/`)
- AWS CDK in TypeScript/Python managing:
  - S3 bucket for environmental data cache.
  - DynamoDB tables for alerts and decision records.
  - Step Functions state machine implementing the 5-stage alert ladder.
  - Lambda execution roles and SNS topic for caregiver dispatch.

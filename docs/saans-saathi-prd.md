# Saans Saathi: PRD and Implementation Plan

Hackathon: Environmental Hacks (Bharat Builds Tour, stop 2), WeMakeDevs x AWS
Track: **Air**
Team: Team Prometheus
Status: Baselined October 2026.

---

## 0. Read this first (honest flags)

1. **Hackathon Context:** Focused MVP for Delhi NCR.
2. **We cannot run WRF-Chem in this window.** It needs a heavy HPC cluster setup. We build a "coupled surrogate": two models that feed each other hour by hour (weather affects pollution, pollution affects weather). We state this plainly in the demo. Real WRF-Chem on AWS is listed as future work.
3. **The health AI is a demo, not a medical device.** The on-device model is trained on public and synthetic data and is not clinically validated. We never claim accuracy numbers we have not measured.
4. **Real wearables are simulated in MVP.** The MVP uses a sensor simulator plus the phone's motion sensor for fall detection.
5. **Verify every data feed honestly** (recording update frequencies, units, provenance, and proxies).

---

## 1. Pitch, problem and solution (short)

**Pitch:** Every winter, someone's mother in Delhi NCR breathes bad air alone. Saans Saathi (Saans = breath, Saathi = companion) warns her before the bad hours arrive, watches her body on her phone, and tells her family when she needs them.

**Problem statement:**
In Delhi NCR, smoke from stubble burning gets trapped near the ground by atmospheric inversion. That smoke then changes the local weather, which traps even more smoke. Normal AQI apps treat weather and pollution as separate things, so their forecasts miss the spikes. Even a correct forecast does not help the people most at risk: elderly people, people with asthma or heart conditions, outdoor workers. They do not know what to do, their health data is not watched, and their families live far away. Health apps also send private data to the cloud and fail when the network goes down, which happens during disasters.

**Solution:**
Saans Saathi joins two things:
1. A **72-hour coupled air and weather forecast for Delhi NCR** that tracks inversion strength and predicts where stubble-burning smoke will travel and when it will arrive.
2. A **privacy-first personal health companion** that runs AI on the phone, turns the forecast into a simple personal risk, and uses **AI agents** to decide who to talk to and what to say: the user first, then the family caregiver, then emergency contacts.

The emotional core: the app talks like family, not like a dashboard. The caregiver gets a calm, clear message in Hindi or English, not a red chart.

---

## 2. Track

**Air.** Stubble burning, inversion, coupled weather-air interactions, and protecting vulnerable populations.

---

## 3. Persona and emotional core

**Primary user: "Maa" (persona name Kamla, 68).** Asthma, lives alone in Noida. Has a basic Android phone. Speaks Hindi.
**Second user: her son (Rohan), in Bengaluru.** Cannot be there. Gets one calm message when it matters, not 30 alerts.

**The story for the demo:**
- Day 1 evening: fires spike upwind. The agent sees an inversion forming overnight.
- 6 AM next day: Kamla's phone says (in Hindi): "Maa, aaj subah bahar mat jaiye. Hawa bahut kharab hai. Ghar ke andar halka sa tehel lijiye." (Today, please skip the outside walk. The air is very bad. A light walk indoors is better.)
- 10 AM: her breathing rate rises and SpO2 dips (from the simulator). The app asks "Kya aap theek hain?" (Are you ok?). She does not answer.
- The Care Circle agent messages Rohan: "Maa's breathing looks harder than usual and outside air is at a very unhealthy level. She has not replied to the app. Please call her." One tap to call.
- If no one responds, SOS goes to the emergency contact with location (only if she allowed it).

Emotional principles:
- Language that sounds like family, not a hospital.
- Rohan gets few, meaningful messages. Fewer alerts means more trust.
- The user always has a countdown to cancel a false alarm before SOS fires.
- The user controls who sees what.

---

## 4. PRD Specifications

### Goals
1. Give a 72-hour AQI forecast for Delhi NCR that accounts for the weather and pollution feedback loop.
2. Show inversion strength and predict stubble-burning smoke travel.
3. Turn it into a personal, on-device health risk for vulnerable people.
4. Use agents to decide the right action and the right person to tell.
5. Work offline and keep health data on the phone.
6. Be deployed on AWS with a public URL / runnable locally with full integrity.

### Non-goals
- Real WRF-Chem runs.
- Clinical accuracy claims or medical diagnosis.
- Real hospital or ambulance dispatch.
- Native app store binary releases.

### Features

- **M1: Data ingestion:** Ingest AQI (CPCB/OpenAQ), fire points (NASA FIRMS), weather (IMD/GFS).
- **M2: Inversion index:** Ventilation index & stability proxy (Weak / Moderate / Strong).
- **M3: Coupled forecast (72h):** Weather state <-> pollution evolution two-way coupling.
- **M4: Plume tracker:** Forward parcel advection with forecast winds and boundary layer scaling.
- **M5: Web dashboard:** Interactive 72h coupled vs uncoupled chart, inversion gauge, plume map, data sources with freshness, agent decision log.
- **M6: Phone app (PWA/Companion):** Offline-first, Hindi & English, cached forecast.
- **M7: On-device health AI:** Vitals baseline, anomaly detection (HR, SpO2, temperature, respiratory distress).
- **M8: Fall detection:** Motion threshold + confirm window.
- **M9: Risk scores:** Heat, respiratory, cardiovascular (0 to 100).
- **M10: Agent layer:** 4 agents: Air Watcher, Health Guardian, Care Circle, Coordinator.
- **M11: Alert ladder + SOS:** User nudge -> "Are you ok?" -> Caregiver message -> SOS countdown.
- **M12: Privacy:** Raw health stays on device; only coarse risk band & coarse area shared with consent. Cedar policies enforced.

# Saans Saathi: 3-Minute Hackathon Demo Script

Track: **Air** | Bharat Builds Tour, WeMakeDevs x AWS | Team: **Prometheus**

---

## Act 1: The Persona & The Problem (0:00 – 0:25)
- **Visual:** Landing Page (`http://localhost:5173/`).
- **Speaker:**
  > "Every winter, someone's mother in Delhi NCR breathes toxic air alone.
  > Meet Kamla, 68, who has asthma and lives alone in Noida. Her son, Rohan, works in Bengaluru.
  > Current AQI apps treat weather and smoke separately, completely missing dangerous spikes.
  > Even a correct forecast doesn't help Kamla if nobody is watching her health and her son is 2,000 kilometers away.
  > This is Saans Saathi."

---

## Act 2: Coupled 72-Hour Forecast & Plume Tracking (0:25 – 1:05)
- **Visual:** Open Dashboard (`http://localhost:5173/dashboard`).
- **Actions:**
  1. Switch district from Noida to Anand Vihar.
  2. Hover over the dual-line AQI chart.
  3. Point out the Strong Inversion window (+18h to +42h) and the Plume Map.
- **Speaker:**
  > "On our live dashboard, Aethera couples weather and smoke dynamics.
  > Stubble smoke dims sunlight, cooling the ground and strengthening nocturnal inversion, which collapses the boundary layer down to 140 meters.
  > Notice the difference: our coupled surrogate predicts a severe peak AQI of 436 at plus-30 hours, whereas standard uncoupled forecasts predict only 320, missing the emergency spike.
  > Seven active fires upwind will push plumes into NCR in approximately 14 hours.
  > Every card displays its exact source and freshness timestamp."

---

## Act 3: On-Device Companion & Hindi Speech (1:05 – 1:50)
- **Visual:** Open Companion Page (`http://localhost:5173/companion`).
- **Actions:**
  1. Click the "सुनें" (Listen) button to trigger Hindi voice readout.
  2. Toggle between Hindi ("हिं") and English ("EN").
  3. Toggle Wearable Anomaly Simulator from "Normal Baseline" to "Respiratory Distress".
  4. Observe the "क्या आप ठीक हैं?" check-in and 2-minute countdown timer.
- **Speaker:**
  > "On Kamla's phone, Saans Saathi speaks like family, not like a medical monitor.
  > At 6 AM, her phone advises her in Hindi to skip the morning walk and exercise indoors.
  > All vital signs—heart rate, SpO2, temperature—are analyzed strictly on the phone.
  > When our on-device model detects an anomaly (SpO2 dipping to 93% with rapid breathing), it prompts: 'क्या आप ठीक हैं?'.
  > Notice the countdown timer: if Kamla does not reply within two minutes, our escalation workflow begins."

---

## Act 4: Multi-Agent Escalation & Caregiver Action (1:50 – 2:30)
- **Visual:** Open Caregiver Page (`http://localhost:5173/caregiver`).
- **Actions:**
  1. Click "I could not reach her" / "Simulate Unanswered Check-in".
  2. Review the live Step Functions execution trace.
  3. Review the Cedar Sharing Policy matrix.
- **Speaker:**
  > "When Kamla doesn't reply, our Care Circle agent alerts Rohan in Bengaluru.
  > He doesn't get 30 panic alerts—he gets one calm, actionable message: 'Maa's breathing looks harder than usual and outside air is severe. Please call her.'
  > With one tap, he calls her.
  > Under open-source Cedar policies, Rohan sees only her coarse risk band and district. Raw biometrics remain strictly on her device.
  > If nobody reaches her, emergency contacts are alerted, with a 30-second cancellation countdown on Kamla's phone to prevent false alarms."

---

## Act 5: AWS Architecture & Scientific Integrity (2:30 – 3:00)
- **Visual:** Dashboard Decision Audit Log (`/dashboard#decisions`) + Architecture Diagram.
- **Speaker:**
  > "Under the hood, Saans Saathi is powered by AWS CDK: Step Functions runs the alert ladder, DynamoDB records decision audits, and Amazon Bedrock powers our Strands agents, with seamless offline local fallback.
  > We are honest about our limits: our model is an atmospheric coupled surrogate, not a multi-node WRF-Chem HPC run, and is a supportive companion, not a clinical diagnostic device.
  > Saans Saathi sees the bad air coming, protects the people breathing it, and calls family when it matters."

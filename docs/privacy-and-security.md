# Saans Saathi: Privacy-by-Design & Security Specifications

## 1. Core Privacy Architecture

Saans Saathi is architected around the strict principle of data minimality and zero raw biometric leakage:

```
+-------------------------------------------------------------------------------+
|                            ON-DEVICE BOUNDARY (Client)                         |
|                                                                               |
|   Raw Biometric Telemetry:                                                    |
|   - Heart Rate: 96 bpm                                                        |
|   - SpO2: 93%                                                                 |
|   - Skin Temperature: 36.9 °C                                                 |
|   - Accelerometer Impact Data                                                 |
|                                                                               |
|   ===> Evaluated on-device by rules & TensorFlow.js                           |
|   ===> NEVER transmitted to backend or Bedrock foundation models              |
+-------------------------------------------------------------------------------+
                                        |
               Quantization & Consent Filter (Cedar Policy Engine)
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                        TRANSMITTED CLOUD PAYLOAD (FastAPI / AWS)              |
|                                                                               |
|   - User ID: kamla_noida (Pseudonymized)                                      |
|   - Coarse Risk Band: HIGH                                                    |
|   - Coarse Area: Noida Sector 62 (No exact GPS coordinates)                   |
|   - Trigger Type: ANOMALOUS_VITALS                                            |
|   - Consent Flag: true                                                        |
+-------------------------------------------------------------------------------+
```

---

## 2. Formal Cedar Policy Implementation

Authorization and sharing permissions are evaluated using Amazon Verified Permissions and the open-source Cedar policy specification (`app/core/cedar_policy.py`):

### Cedar Policy 1: Coarse Sharing Under Explicit Consent
```cedar
permit (
    principal in Role::"Caregiver",
    action in [Action::"ViewCoarseRiskBand", Action::"ViewCoarseArea"],
    resource in UserData::"HealthProfile"
)
when {
    context.sharing_enabled == true
};
```

### Cedar Policy 2: Strict Universal Prohibition on Raw Telemetry
```cedar
forbid (
    principal,
    action in [Action::"ViewRawVitals", Action::"ExportRawBiometrics", Action::"TransmitRawVitals"],
    resource
);
```

### Cedar Policy 3: Emergency Location Only on Confirmed SOS
```cedar
permit (
    principal in Role::"EmergencyContact",
    action == Action::"ViewExactLocation",
    resource in UserData::"Location"
)
when {
    context.is_sos_active == true &&
    context.allow_location_on_sos == true
};
```

---

## 3. Security Safeguards & Threat Model

1. **Backend Validation:** Consent flags and sharing permissions are validated on the FastAPI backend independently of frontend state. Unconsented events return `HTTP 200 REJECTED_NO_CONSENT`.
2. **Alert Deduplication & Cooldown:** A 3-minute sliding cooldown window prevents notification flooding. Caregivers receive at most one calm priority alert per escalation cycle.
3. **No Secret Exposure:** Secrets and credentials are managed strictly via environment variables. Zero credentials are committed to version control.
4. **CORS Hardening:** Configurable origins restricted to authorized local/production domains.
5. **SOS Cancellation Grace Period:** Any automated fall or distress detection provides a minimum 30-second user-accessible countdown before contacting emergency parties.

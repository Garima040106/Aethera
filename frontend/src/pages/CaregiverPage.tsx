import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { api } from "../services/api";
import type { AlertSimulateResponse } from "../services/api";

function AetheraIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1A73E8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}

const sharingItems = [
  { label: "Risk level", value: "Shared (HIGH)", shared: true },
  { label: "General area", value: "Shared (Noida Sector 62)", shared: true },
  { label: "Heart rate and oxygen", value: "Stays on her phone", shared: false },
  { label: "Exact location", value: "Only if she sends an SOS", shared: false },
];

export default function CaregiverPage() {
  const { t } = useTranslation();
  const [simulationResult, setSimulationResult] = useState<
    AlertSimulateResponse | null
  >(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);

  const handleCallMaa = () => {
    setCallStatus(t('caregiver.connectingCall'));
  };

  const handleRunSimulation = async (scenario: string) => {
    setIsSimulating(true);
    try {
      const res = await api.simulateAlert({
        scenario,
        sharing_enabled: true,
        allow_location_on_sos: false,
        language: "hi",
      });
      setSimulationResult(res);
    } catch (err) {
      window.alert(
        `Simulation notice: ${err instanceof Error ? err.message : "Offline mode"}`
      );
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <main className="caregiver-page">
      <div className="caregiver-intro">
        <span className="eyebrow">{t('caregiver.eyebrow')}</span>
        <h1>{t('caregiver.headline')}</h1>
        <p>
          {t('caregiver.description')}
        </p>

        {/* Step Functions Workflow Simulator Panel */}
        <div
          style={{
            marginTop: "24px",
            padding: "18px",
            background: "#FFFFFF",
            border: "1px solid #DADCE0",
            borderRadius: "8px",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: "15px",
              marginBottom: "8px",
              color: "#202124",
            }}
          >
            AWS Step Functions Alert Ladder Simulator:
          </strong>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "13px",
              color: "#5F6368",
            }}
          >
            Test the deterministic escalation ladder connecting on-device
            detection, Bedrock agents, and SNS advanced-user notifications:
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={isSimulating}
              onClick={() =>
                handleRunSimulation("RESPIRATORY_DISTRESS_UNANSWERED")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#1A73E8",
                color: "#FFF",
                border: "none",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Simulate Unanswered Check-in (Ladder 1-5)
            </button>
            <button
              type="button"
              disabled={isSimulating}
              onClick={() => handleRunSimulation("USER_OK_CONFIRMED")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#F1F3F4",
                color: "#3C4043",
                border: "1px solid #DADCE0",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Simulate User OK (Cancelled)
            </button>
            <button
              type="button"
              disabled={isSimulating}
              onClick={() =>
                handleRunSimulation("FALL_DETECTED_SOS_CANCELLED")}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                background: "#F1F3F4",
                color: "#3C4043",
                border: "1px solid #DADCE0",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Simulate Fall Detected
            </button>
          </div>
        </div>

        {/* Step Functions Execution Trace */}
        {simulationResult && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "#F8F9FA",
              border: "1px solid #DADCE0",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <strong
                style={{ fontSize: "14px", color: "#202124" }}
              >
                Workflow Trace ({simulationResult.simulation_id})
              </strong>
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "monospace",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "#E6F4EA",
                  color: "#137333",
                  fontWeight: 600,
                }}
              >
                {simulationResult.final_state}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {simulationResult.steps.map((step) => (
                <div
                  key={step.step_number}
                  style={{
                    padding: "8px 12px",
                    background: "#FFFFFF",
                    borderRadius: "6px",
                    border: "1px solid #E8EAED",
                    fontSize: "13px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "#1A73E8",
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      Step {step.step_number}: {step.step_name}
                    </span>
                    <span
                      style={{
                        color: "#5F6368",
                        fontSize: "11px",
                      }}
                    >
                      {step.timestamp}
                    </span>
                  </div>
                  <p
                    style={{ margin: "4px 0 0", color: "#3C4043" }}
                  >
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: "11px",
                color: "#5F6368",
                fontStyle: "italic",
              }}
            >
              {simulationResult.disclaimer}
            </p>
          </div>
        )}

        <p className="caregiver-disclaimer">
          Cedar Privacy Policy Enforced: Rohan can only see Kamla’s coarse
          risk band and district. Raw vital signs (HR, SpO2) and exact GPS
          coordinates are forbidden by Cedar policy unless an SOS event is
          confirmed.
        </p>
      </div>

      <section
        className="caregiver-phone"
        aria-label="Advanced User phone preview"
      >
        <header className="caregiver-phone-header">
          <div className="caregiver-brand">
            <AetheraIcon />
            <strong>Aethera</strong>
          </div>
          <span>Care circle</span>
        </header>

        <div className="caregiver-phone-content">
          <section
            className="caregiver-card caregiver-alert"
          >
            <div className="caregiver-alert-meta">
              <strong>Please call Maa</strong>
              <span>10:14 AM · Priority</span>
            </div>
            <h2>Maa's breathing looks harder than usual.</h2>
            <p>
              The air outside is at a very unhealthy level (AQI 380+), and she
              has not replied to the on-device check-in for two minutes.
            </p>
          </section>

          {callStatus && (
            <div
              style={{
                padding: "10px 14px",
                background: "#E6F4EA",
                color: "#137333",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {callStatus}
            </div>
          )}

          <div className="caregiver-actions">
            <button
              className="caregiver-call-button"
              type="button"
              onClick={handleCallMaa}
            >
              <PhoneIcon />
              Call Maa
            </button>
            <button
              className="caregiver-secondary-button"
              type="button"
              onClick={() =>
                handleRunSimulation("RESPIRATORY_DISTRESS_UNANSWERED")}
            >
              I could not reach her
            </button>
          </div>

          <section
            className="caregiver-card caregiver-sharing"
          >
            <h3>What Maa shares with you</h3>
            {sharingItems.map((item) => (
              <div
                className="caregiver-sharing-row"
                key={item.label}
              >
                <span>{item.label}</span>
                <span
                  className={
                    item.shared
                      ? "sharing-status shared"
                      : "sharing-status private"
                  }
                >
                  {item.value}
                </span>
              </div>
            ))}
          </section>

          <section
            className="caregiver-card caregiver-escalation"
          >
            <h3>If nobody reaches her</h3>
            <p>
              The next step is her emergency contact with location. Maa has a
              30-second cancellation countdown to prevent false alarms.
            </p>
          </section>

          <p className="caregiver-emergency-note">
            Support tool, not a medical device. In an emergency call 112.
          </p>
        </div>
      </section>
    </main>
  );
}

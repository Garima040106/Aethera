import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'
import type { HealthEventResponse } from '../services/api'

function AetheraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A73E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function CompanionPage() {
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = useState<'hi' | 'en'>(() =>
    i18n.language.startsWith('hi') ? 'hi' : 'en',
  )
  const [anomalyMode, setAnomalyMode] = useState<'distress' | 'baseline'>('distress')
  const [secondsRemaining, setSecondsRemaining] = useState(108)
  const [lastEventResult, setLastEventResult] = useState<HealthEventResponse | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)


  // Countdown timer for check-in response
  useEffect(() => {
    if (anomalyMode !== 'distress') return
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [anomalyMode])

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const rem = secs % 60
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`
  }

  // Text to speech using Web Speech API with Hindi / English voice
  const handleListen = () => {
    if (!window.speechSynthesis) {
      window.alert('Web Speech API is not supported in this browser. Regional deployment uses Amazon Polly.')
      return
    }

    window.speechSynthesis.cancel()
    const textToSpeak =
      language === 'hi'
        ? 'कमला जी, आज सुबह बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।'
        : 'Skip the walk outside today. The air is very poor. A light walk indoors is better.'

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US'
    utterance.rate = 0.95

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  const handleResponseOk = async () => {
    try {
      const res = await api.submitHealthEvent({
        consent_given: true,
        sharing_enabled: true,
        coarse_risk_band: 'LOW',
        coarse_area: 'Noida Sector 62',
        event_trigger: 'MANUAL_CHECKIN',
        client_timestamp: new Date().toLocaleTimeString(),
      })
      setLastEventResult(res)
      setAnomalyMode('baseline')
    } catch {
      window.alert('Offline check-in saved locally on device.')
    }
  }

  const handleResponseHelp = async () => {
    try {
      const res = await api.submitHealthEvent({
        consent_given: true,
        sharing_enabled: true,
        coarse_risk_band: 'HIGH',
        coarse_area: 'Noida Sector 62',
        event_trigger: 'ANOMALOUS_VITALS',
        client_timestamp: new Date().toLocaleTimeString(),
      })
      setLastEventResult(res)
    } catch {
      window.alert('Alert queued for dispatch when network reconnects.')
    }
  }

  // Risk items based on simulation mode
  const isDistress = anomalyMode === 'distress'
  const riskItems = [
    {
      labelHi: 'गर्मी',
      labelEn: 'Heat',
      value: isDistress ? 24 : 18,
      levelHi: 'कम',
      levelEn: 'Low',
      color: 'green',
    },
    {
      labelHi: 'साँस',
      labelEn: 'Breathing',
      value: isDistress ? 78 : 32,
      levelHi: isDistress ? 'ज़्यादा' : 'सामान्य',
      levelEn: isDistress ? 'High' : 'Normal',
      color: isDistress ? 'red' : 'green',
    },
    {
      labelHi: 'दिल',
      labelEn: 'Heart',
      value: isDistress ? 46 : 28,
      levelHi: isDistress ? 'मध्यम' : 'सामान्य',
      levelEn: isDistress ? 'Medium' : 'Normal',
      color: isDistress ? 'amber' : 'green',
    },
  ]

  return (
    <main className="companion-page">
      <div className="companion-intro">
        <span className="eyebrow">{t('companion.eyebrow')}</span>
        <h1>{t('companion.headline')}</h1>
        <p>
          A preview of Kamla’s phone experience: Hindi-first family guidance, simple check-ins, personal risk
          indicators, and offline privacy safeguards.
        </p>

        {/* Anomaly simulation toggle */}
        <div style={{ marginTop: '20px', padding: '16px', background: '#FFFFFF', border: '1px solid #DADCE0', borderRadius: '8px' }}>
          <strong style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#202124' }}>
            {t('companion.simulator.title')}
          </strong>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setAnomalyMode('distress')
                setSecondsRemaining(108)
                setLastEventResult(null)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: anomalyMode === 'distress' ? '#C5221F' : '#DADCE0',
                background: anomalyMode === 'distress' ? '#FCE8E6' : '#FFF',
                color: anomalyMode === 'distress' ? '#C5221F' : '#3C4043',
                fontWeight: anomalyMode === 'distress' ? 600 : 400,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Simulate Respiratory Distress (HR 96, SpO2 93%)
            </button>
            <button
              type="button"
              onClick={() => {
                setAnomalyMode('baseline')
                setLastEventResult(null)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: anomalyMode === 'baseline' ? '#137333' : '#DADCE0',
                background: anomalyMode === 'baseline' ? '#E6F4EA' : '#FFF',
                color: anomalyMode === 'baseline' ? '#137333' : '#3C4043',
                fontWeight: anomalyMode === 'baseline' ? 600 : 400,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Normal Baseline (HR 72, SpO2 98%)
            </button>
          </div>
        </div>

        {lastEventResult && (
          <div style={{ marginTop: '16px', padding: '14px 18px', background: '#E8F0FE', borderRadius: '8px', border: '1px solid #C2E7FF' }}>
            <strong style={{ color: '#1A73E8', display: 'block', fontSize: '14px' }}>
              Action Result: {lastEventResult.status}
            </strong>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3C4043' }}>
              {lastEventResult.action_taken}
            </p>
            {lastEventResult.message_to_caregiver && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#5F6368', fontStyle: 'italic' }}>
                Dispatched to Rohan: “{lastEventResult.message_to_caregiver}”
              </p>
            )}
          </div>
        )}

        <p className="companion-disclaimer">
          Privacy guarantee: Raw heart rate and SpO2 numbers stay on this phone. Only coarse risk bands (e.g. HIGH) are
          shared with Advanced User Rohan under explicit consent rules.
        </p>
      </div>

      <div className="phone-frame">
        <header className="phone-header">
          <div className="phone-brand">
            <AetheraIcon /> <strong>Aethera</strong>
          </div>
          <div className="phone-header-actions">
            <span className="offline-badge">Works offline</span>
            <div className="language-switch" aria-label="Language switch">
              <span
                className={language === 'hi' ? 'language-active' : ''}
                onClick={() => setLanguage('hi')}
                style={{ cursor: 'pointer' }}
              >
                हिं
              </span>
              <span
                className={language === 'en' ? 'language-active' : ''}
                onClick={() => setLanguage('en')}
                style={{ cursor: 'pointer' }}
              >
                EN
              </span>
            </div>
          </div>
        </header>

        <div className="phone-content">
          <section className="phone-card phone-alert">
            <div className="phone-card-meta">
              <span>{language === 'hi' ? 'आज सुबह 6:00 बजे' : 'Today 6:00 AM'}</span>
              <span className="phone-sample">Live</span>
            </div>
            {language === 'hi' ? (
              <>
                <p className="phone-alert-hindi" lang="hi">
                  कमला जी, आज सुबह बाहर टहलने न जाएँ। हवा बहुत खराब है। घर के अंदर हल्का टहल लें।
                </p>
                <p className="phone-translation">
                  Skip the walk outside. The air is very bad. A light walk indoors is better.
                </p>
              </>
            ) : (
              <>
                <p className="phone-alert-hindi" style={{ fontSize: '16px', lineHeight: 1.5 }}>
                  Kamla ji, please skip your morning walk outside today. The air is severe. A gentle walk indoors is much
                  safer.
                </p>
                <p className="phone-translation">
                  माँ, आज सुबह बाहर टहलने न जाएँ। घर के अंदर हल्का टहल लें।
                </p>
              </>
            )}
            <button className="phone-listen" type="button" onClick={handleListen}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
              {isSpeaking ? (language === 'hi' ? 'बोल रहे हैं...' : 'Speaking...') : language === 'hi' ? 'सुनें' : 'Listen'}
            </button>
          </section>

          {anomalyMode === 'distress' ? (
            <section className="phone-card phone-checkin">
              <div>
                <h2 lang="hi">{language === 'hi' ? 'क्या आप ठीक हैं?' : 'Are you ok?'}</h2>
                <p>
                  {language === 'hi'
                    ? 'आपकी साँस सामान्य से तेज़ लग रही है।'
                    : 'Your breathing looks harder than usual.'}
                </p>
              </div>
              <button className="phone-response phone-response-ok" type="button" onClick={handleResponseOk}>
                {language === 'hi' ? 'मैं ठीक हूँ' : 'I am okay'}
              </button>
              <button className="phone-response phone-response-help" type="button" onClick={handleResponseHelp}>
                {language === 'hi' ? 'मदद चाहिए' : 'Need help'}
              </button>
              <p className="phone-followup" lang="hi">
                {language === 'hi'
                  ? `अगर आप जवाब नहीं देंगी, तो ${formatTimer(secondsRemaining)} में रोहन को बताया जाएगा।`
                  : `If no reply in ${formatTimer(secondsRemaining)}, Rohan will be notified.`}
              </p>
            </section>
          ) : (
            <section className="phone-card" style={{ background: '#E6F4EA', border: '1px solid #CEEAD6' }}>
              <strong style={{ color: '#137333', fontSize: '15px' }}>
                {language === 'hi' ? 'सब ठीक है' : 'All clear'}
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#3C4043' }}>
                {language === 'hi'
                  ? 'आपकी सेहत के सभी संकेत सामान्य हैं।'
                  : 'Vitals are steady within normal baseline range.'}
              </p>
            </section>
          )}

          <section className="phone-card phone-risk">
            <div className="phone-risk-heading">
              <strong lang="hi">{language === 'hi' ? 'आज का जोखिम' : "Today's risk"}</strong>
              <span>
                {isDistress ? 'HR 96 · SpO2 93% · 36.9 °C' : 'HR 72 · SpO2 98% · 36.6 °C'}
              </span>
            </div>
            {riskItems.map((risk) => (
              <div className="phone-risk-item" key={risk.labelHi}>
                <div className="phone-risk-label">
                  <span lang="hi">{language === 'hi' ? risk.labelHi : risk.labelEn}</span>
                  <span>
                    {risk.value} · {language === 'hi' ? risk.levelHi : risk.levelEn}
                  </span>
                </div>
                <div
                  className="phone-risk-track"
                  role="progressbar"
                  aria-label={`${risk.labelEn} risk`}
                  aria-valuenow={risk.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span className={`phone-risk-fill risk-fill-${risk.color}`} style={{ width: `${risk.value}%` }} />
                </div>
              </div>
            ))}
          </section>

          <div className="phone-privacy">
            <LockIcon />
            <span lang="hi">
              {language === 'hi'
                ? 'आपकी सेहत की जानकारी इसी फ़ोन पर रहती है।'
                : 'Raw health telemetry stays securely on this device.'}
            </span>
          </div>
        </div>

        <nav className="phone-bottom-nav" aria-label="Phone app preview navigation">
          <div className="phone-tab phone-tab-active">
            <span>⌂</span>Home
          </div>
          <div className="phone-tab">
            <span>⌁</span>Trends
          </div>
          <div className="phone-tab">
            <span>♡</span>Family
          </div>
          <div className="phone-tab">
            <span>☷</span>Settings
          </div>
        </nav>
      </div>
    </main>
  )
}

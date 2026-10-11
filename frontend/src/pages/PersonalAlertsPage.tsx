import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function PersonalAlertsPage() {
  const [childAlert, setChildAlert] = useState(false)
  const trustedContacts = [
    { name: 'Rohan Sharma', relation: 'Son', contact: 'Available for alerts' },
    { name: 'Priya Sharma', relation: 'Daughter', contact: 'Available for alerts' },
    { name: 'Amit Verma', relation: 'Neighbour', contact: 'Available for alerts' },
  ]

  return (
    <main className="personal-page">
      <div className="personal-page-content">
        <Link to="/dashboard" className="personal-back-link">← Back to my dashboard</Link>
        <p className="elder-eyebrow">Alerts and trusted people</p>
        <h1>Stay connected</h1>
        <p className="personal-page-intro">This is where messages from your family and air-quality alerts will appear.</p>
        <section className="personal-contacts-card" aria-labelledby="trusted-contacts-heading">
          <p className="elder-eyebrow">My alert circle</p>
          <h2 id="trusted-contacts-heading">People who can help</h2>
          <div className="personal-contact-list">
            {trustedContacts.map((contact) => (
              <div className="personal-contact" key={contact.name}>
                <span className="personal-contact-avatar">{contact.name.charAt(0)}</span>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{contact.relation} · {contact.contact}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="personal-alert-card" aria-live="polite">
          <span className="personal-alert-icon">!</span>
          <div>
            <p className="elder-eyebrow">Example family alert</p>
            <h2>{childAlert ? 'Your child sent you an alert' : 'No new family alerts'}</h2>
            <p>{childAlert ? 'Rohan noticed that the air is poor near you. Please stay indoors and call him if you need help.' : 'When a child or trusted family member sends an alert, it will show here clearly.'}</p>
            {childAlert && <time>Just now · From Rohan</time>}
          </div>
        </section>
        <button type="button" className="personal-primary-button" onClick={() => setChildAlert(true)}>
          Show example child alert
        </button>
        <Link to="/dashboard" className="personal-secondary-link">Return to current AQI</Link>
      </div>
    </main>
  )
}

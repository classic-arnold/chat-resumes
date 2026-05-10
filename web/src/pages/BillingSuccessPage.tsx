import { Link } from 'react-router-dom'

import { ButtonLink } from '../components/ui/Button'

export const BillingSuccessPage = () => (
  <div className="center-page">
    <main className="center-page-main">
    <div className="center-page-card">
      <div className="ui-pill ui-pill-active" style={{ marginBottom: '1rem' }}>
        Subscribed
      </div>
      <h1 className="center-page-title">You're in.</h1>
      <p className="center-page-body">
        Your public recruiter link is now active. Open the dashboard to copy it
        and start training your AI.
      </p>
      <ButtonLink href="/dashboard" variant="primary">
        Open dashboard →
      </ButtonLink>
      <Link className="center-page-link" to="/chat">
        or jump straight into chat
      </Link>
    </div>
    </main>
  </div>
)

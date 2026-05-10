import { Link } from 'react-router-dom'

import { ButtonLink } from '../components/ui/Button'

export const BillingCancelPage = () => (
  <div className="center-page">
    <main className="center-page-main">
    <div className="center-page-card">
      <div className="ui-pill ui-pill-neutral" style={{ marginBottom: '1rem' }}>
        Checkout canceled
      </div>
      <h1 className="center-page-title">No charge.</h1>
      <p className="center-page-body">
        Your account is still here. Subscribe whenever you're ready to activate
        your public recruiter link.
      </p>
      <ButtonLink href="/pricing" variant="primary">
        Back to pricing
      </ButtonLink>
      <Link className="center-page-link" to="/dashboard">
        or open the dashboard
      </Link>
    </div>
    </main>
  </div>
)

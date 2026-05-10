import { Link } from 'react-router-dom'

export const BillingSuccessPage = () => (
  <div className="billing-feedback-page">
    <nav className="site-nav">
      <Link className="logo" to="/dashboard">
        <div className="logo-icon">💬</div>
        Chat<span>Resumes</span>
      </Link>
      <div className="nav-actions">
        <Link className="btn-nav-solid" to="/dashboard">
          Go To Dashboard →
        </Link>
      </div>
    </nav>

    <main className="billing-feedback-main">
      <div className="billing-feedback-card">
        <div className="section-tag">Billing</div>
        <h1 className="billing-feedback-title">Checkout complete.</h1>
        <p className="billing-feedback-body">
          Stripe sent you back successfully. Your billing state will show up in the
          dashboard as soon as the webhook sync lands.
        </p>
        <div className="billing-feedback-actions">
          <Link className="btn-primary-blue" to="/dashboard">
            Open Dashboard
          </Link>
          <Link className="btn-outline-blue" to="/chat">
            Continue Training Your AI
          </Link>
        </div>
      </div>
    </main>
  </div>
)
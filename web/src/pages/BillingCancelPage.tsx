import { Link } from 'react-router-dom'

export const BillingCancelPage = () => (
  <div className="billing-feedback-page">
    <nav className="site-nav">
      <Link className="logo" to="/pricing">
        <div className="logo-icon">💬</div>
        Chat<span>Resumes</span>
      </Link>
      <div className="nav-actions">
        <Link className="btn-nav-ghost" to="/dashboard">
          Dashboard
        </Link>
      </div>
    </nav>

    <main className="billing-feedback-main">
      <div className="billing-feedback-card billing-feedback-card-soft">
        <div className="section-tag">Billing</div>
        <h1 className="billing-feedback-title">Checkout canceled.</h1>
        <p className="billing-feedback-body">
          No subscription was started. You can go back to pricing when you are ready
          or keep exploring the dashboard and private chat setup.
        </p>
        <div className="billing-feedback-actions">
          <Link className="btn-primary-blue" to="/pricing">
            Return To Pricing
          </Link>
          <Link className="btn-outline-blue" to="/dashboard">
            Back To Dashboard
          </Link>
        </div>
      </div>
    </main>
  </div>
)
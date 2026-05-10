import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createCheckout } from '../lib/billing'

const FEATURES = [
  'Private AI training chat (STAR stories)',
  'Public recruiter AI link, always-on',
  'Document uploads (PDF, DOCX, TXT)',
  'Recruiter activity dashboard',
]

export const PricingPage = () => {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const startCheckout = async () => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate('/signup')
      return
    }
    setError(null)
    setIsStarting(true)
    try {
      const { checkoutUrl } = await createCheckout(getToken, {
        cancelUrl: `${window.location.origin}/billing/cancel`,
        successUrl: `${window.location.origin}/billing/success`,
      })
      window.location.assign(checkoutUrl)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start checkout.')
      setIsStarting(false)
    }
  }

  const ctaLabel = !isLoaded
    ? 'Loading…'
    : isStarting
      ? 'Starting…'
      : isSignedIn
        ? 'Subscribe — $19/mo'
        : 'Create account & subscribe'

  return (
    <div className="pricing-page">
      <nav className="site-nav">
        <Link className="logo" to="/">
          <div className="logo-icon">💬</div>
          Chat<span>Resumes</span>
        </Link>
        <div className="nav-actions">
          <Link className="btn-nav-ghost" to={isSignedIn ? '/dashboard' : '/login'}>
            {isSignedIn ? 'Dashboard' : 'Log in'}
          </Link>
        </div>
      </nav>

      <main className="pricing-main pricing-main-simple">
        <section className="pricing-hero pricing-hero-simple">
          <div className="pricing-copy pricing-copy-centered">
            <h1 className="pricing-headline">
              <span>One plan.</span>
              <br />
              <em>Get recruiters talking</em>
              <br />
              <span>to your AI.</span>
            </h1>
            <p className="pricing-subtitle pricing-subtitle-tight">
              $19/month. Cancel anytime.
            </p>

            <div className="pricing-cta-stack">
              <button
                className="btn-primary-blue pricing-cta-primary"
                disabled={isStarting || !isLoaded}
                onClick={startCheckout}
                type="button"
              >
                {ctaLabel}
              </button>
              {error ? <div className="pricing-inline-error">{error}</div> : null}
            </div>

            <ul className="pricing-feature-line">
              {FEATURES.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

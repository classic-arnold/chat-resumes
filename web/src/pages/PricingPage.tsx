import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { createCheckout } from '../lib/billing'

const launchPlan = {
  cadence: '/month',
  label: 'ChatResumes Pro',
  price: '$19',
}

const includedItems = [
  'Private AI interview chat that turns vague answers into structured STAR stories',
  'A public recruiter AI link grounded on your approved profile and stories',
  'Candidate dashboard with recruiter traffic, chat activity, and profile completeness',
  'One candidate seat with ongoing updates to your recruiter-facing AI profile',
]

const outcomeCards = [
  {
    body: 'Your AI keeps collecting and sharpening your best stories until they are usable, specific, and recruiter-ready.',
    eyebrow: 'For You',
    title: 'Structured STAR capture, not another static form',
  },
  {
    body: 'Recruiters get a public link where they can ask targeted questions and get grounded answers about your work, impact, and goals.',
    eyebrow: 'For Recruiters',
    title: 'A recruiter-facing AI profile that works while you are offline',
  },
  {
    body: 'You see whether the link is being opened, whether chats are starting, and whether your profile still needs stronger material.',
    eyebrow: 'For Decisions',
    title: 'Minimal analytics focused on whether the product is doing its job',
  },
]

const launchSequence = [
  'Create your account',
  'Complete checkout',
  'Train your AI in private chat',
  'Share your public recruiter link',
]

export const PricingPage = () => {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)

  const handleStartCheckout = async () => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn) {
      navigate('/signup')
      return
    }

    setCheckoutError(null)
    setIsStartingCheckout(true)

    try {
      const { checkoutUrl } = await createCheckout(getToken, {
        cancelUrl: `${window.location.origin}/billing/cancel`,
        successUrl: `${window.location.origin}/billing/success`,
      })

      window.location.assign(checkoutUrl)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'Unable to start checkout.')
      setIsStartingCheckout(false)
    }
  }

  const primaryCtaLabel = !isLoaded
    ? 'Loading…'
    : isSignedIn
      ? isStartingCheckout
        ? 'Starting Checkout…'
        : 'Start My Subscription ↗'
      : 'Create Account To Subscribe ↗'

  return (
    <div className="pricing-page">
      <nav className="site-nav">
        <Link className="logo" to="/">
          <div className="logo-icon">💬</div>
          Chat<span>Resumes</span>
        </Link>
        <div className="nav-links">
          <Link className="nav-link" to="/">
            Landing
          </Link>
          <Link className="nav-link" to="/signup">
            Signup
          </Link>
        </div>
        <div className="nav-actions">
          <Link className="btn-nav-ghost" to={isSignedIn ? '/dashboard' : '/login'}>
            {isSignedIn ? 'Dashboard' : 'Log In'}
          </Link>
          <button
            className="btn-nav-solid"
            disabled={isStartingCheckout || !isLoaded}
            onClick={handleStartCheckout}
            type="button"
          >
            {isSignedIn ? 'Start Subscription →' : 'Create Account →'}
          </button>
        </div>
      </nav>

      <main className="pricing-main">
        <section className="pricing-hero">
          <div className="pricing-copy">
            <div className="section-tag">Pricing</div>
            <h1 className="pricing-headline">
              One plan.
              <br />
              One job.
              <br />
              Get recruiters talking to your AI.
            </h1>
            <p className="pricing-subtitle">
              ChatResumes is a paid candidate product from day one. You subscribe,
              train your AI through private chat, publish a recruiter-ready link,
              and track whether it is actually being used.
            </p>

            <div className="pricing-chip-row">
              <div className="pricing-chip">Private STAR-story intake</div>
              <div className="pricing-chip">Public recruiter AI route</div>
              <div className="pricing-chip">Minimal analytics dashboard</div>
            </div>

            <div className="pricing-cta-row">
              <button
                className="btn-primary-blue"
                disabled={isStartingCheckout || !isLoaded}
                onClick={handleStartCheckout}
                type="button"
              >
                {primaryCtaLabel}
              </button>
              <Link className="btn-outline-blue" to={isSignedIn ? '/dashboard' : '/login'}>
                {isSignedIn ? 'Open my dashboard' : 'I already have an account'}
              </Link>
            </div>

            {checkoutError ? <div className="pricing-inline-error">{checkoutError}</div> : null}

            <div className="pricing-sequence">
              {launchSequence.map((step, index) => (
                <div className="pricing-sequence-step" key={step}>
                  <span className="pricing-sequence-number">0{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="pricing-card-shell">
            <div className="pricing-card-highlight">Launch Plan</div>
            <div className="pricing-card-name">{launchPlan.label}</div>
            <div className="pricing-card-price">
              {launchPlan.price} <span>{launchPlan.cadence}</span>
            </div>
            <p className="pricing-card-copy">
              Built for one candidate to create a recruiter-facing AI profile,
              keep it trained, and measure whether it is getting real traction.
            </p>

            <div className="pricing-feature-list">
              {includedItems.map((item) => (
                <div className="pricing-feature" key={item}>
                  {item}
                </div>
              ))}
            </div>

            <button className="pricing-card-cta" onClick={handleStartCheckout} type="button">
              {isSignedIn ? 'Continue To Checkout' : 'Create Account First'}
            </button>
            <p className="pricing-card-note">
              Single paid plan for launch. No free tier, no recruiter accounts,
              and no extra modules outside the candidate flow.
            </p>
          </aside>
        </section>

        <section className="pricing-proof-grid">
          {outcomeCards.map((card) => (
            <article className="pricing-proof-card" key={card.title}>
              <div className="pricing-proof-eyebrow">{card.eyebrow}</div>
              <h2 className="pricing-proof-title">{card.title}</h2>
              <p className="pricing-proof-body">{card.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
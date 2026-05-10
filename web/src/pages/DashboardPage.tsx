import { UserButton, useAuth, useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { createPortalSession, fetchBillingStatus, type BillingStatus } from '../lib/billing'

const activityItems = [
  {
    icon: '💬',
    kind: 'chat',
    summary: 'Chatted for 6 min · asked about leadership & salary',
    time: '2h ago',
    title: 'Sarah M. · TechCorp Recruiting',
  },
  {
    icon: '👁',
    kind: 'view',
    summary: 'Viewed your link · 3 min session',
    time: 'Yesterday',
    title: 'Anonymous Recruiter',
  },
  {
    icon: '💬',
    kind: 'chat',
    summary: 'Chatted for 11 min · very engaged',
    time: '2 days ago',
    title: 'David K. · StartupXYZ',
  },
  {
    icon: '👁',
    kind: 'view',
    summary: 'Viewed your link · 8 min session',
    time: '3 days ago',
    title: 'Priya S. · Google',
  },
]

const miniStats = [
  { label: 'Link Views This Week', value: '12' },
  { label: 'Chat Sessions', value: '4' },
  { label: 'Avg. Chat Duration', value: '6.2m' },
]

const checklistItems = [
  { done: true, icon: '✅', label: 'Created your account' },
  { done: true, icon: '✅', label: 'Claimed your ChatResumes link' },
  {
    done: false,
    icon: '📄',
    label: 'Upload your resume & answer 5 questions',
  },
  {
    done: false,
    icon: '🔗',
    label: 'Add your link to your resume header',
  },
]

export const DashboardPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const displayName = user?.fullName ?? user?.firstName ?? 'Candidate'
  const emailAddress = user?.primaryEmailAddress?.emailAddress ?? 'Signed in'
  const firstName = user?.firstName ?? displayName
  const initials =
    user?.firstName?.[0]?.toUpperCase() ?? user?.lastName?.[0]?.toUpperCase() ?? 'C'
  const [billing, setBilling] = useState<{
    data: BillingStatus | null
    error: string | null
    isLoading: boolean
    isOpeningPortal: boolean
  }>({
    data: null,
    error: null,
    isLoading: true,
    isOpeningPortal: false,
  })

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return
    }

    let isCancelled = false

    const loadBilling = async () => {
      setBilling((current) => ({ ...current, error: null, isLoading: true }))

      try {
        const data = await fetchBillingStatus(getToken)

        if (isCancelled) {
          return
        }

        setBilling({
          data,
          error: null,
          isLoading: false,
          isOpeningPortal: false,
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setBilling({
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load billing status.',
          isLoading: false,
          isOpeningPortal: false,
        })
      }
    }

    void loadBilling()

    return () => {
      isCancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  const handleManageBilling = async () => {
    setBilling((current) => ({ ...current, error: null, isOpeningPortal: true }))

    try {
      const { portalUrl } = await createPortalSession(getToken, `${window.location.origin}/dashboard`)

      window.location.assign(portalUrl)
    } catch (error) {
      setBilling((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to open the billing portal.',
        isOpeningPortal: false,
      }))
    }
  }

  const billingStatusLabel = billing.data?.status?.replace('_', ' ') ?? 'not started'
  const billingPeriodCopy = billing.data?.currentPeriodEnd
    ? `Renews through ${new Date(billing.data.currentPeriodEnd).toLocaleDateString()}`
    : 'No active billing period yet.'

  return (
    <div className="dashboard-page">
      <nav className="dash-nav">
        <Link className="logo" to="/">
          <div className="logo-icon">💬</div>
          Chat<span>Resumes</span>
        </Link>
        <div className="dash-user">
          <div>
            <div className="dash-name">{displayName}</div>
            <div className="dash-email">{emailAddress}</div>
          </div>
          <div className="dash-user-actions">
            <div className="dash-avatar">{initials}</div>
            <UserButton />
          </div>
        </div>
      </nav>

      <div className="dash-content">
        <div className="dash-welcome">
          <h2>Good morning, {firstName} 👋</h2>
          <p>Your AI resume is live and has been viewed 12 times this week.</p>
        </div>

        <div className="dash-card dash-billing-card">
          <div className="dash-card-title">
            Billing Status
            <span className={`dash-billing-pill${billing.data?.hasActiveSubscription ? ' active' : ''}`}>
              {billing.isLoading ? 'Loading' : billingStatusLabel}
            </span>
          </div>
          <div className="dash-billing-row">
            <div>
              <div className="dash-billing-copy">
                {billing.data?.hasActiveSubscription
                  ? 'Your launch plan is active.'
                  : 'Complete checkout to activate your plan and unlock your candidate workspace.'}
              </div>
              <div className="dash-billing-meta">{billingPeriodCopy}</div>
              {billing.error ? <div className="dash-billing-error">{billing.error}</div> : null}
            </div>
            <div className="dash-billing-actions">
              {billing.data?.canManageBilling ? (
                <button
                  className="btn-share"
                  disabled={billing.isOpeningPortal}
                  onClick={handleManageBilling}
                  type="button"
                >
                  {billing.isOpeningPortal ? 'Opening…' : 'Manage Billing'}
                </button>
              ) : (
                <Link className="btn-share" to="/pricing">
                  Complete Checkout
                </Link>
              )}
              <Link className="btn-share btn-share-dark" to="/pricing">
                View Pricing
              </Link>
            </div>
          </div>
        </div>

        <div className="dash-url-card">
          <div>
            <div className="dash-url-label">Your ChatResumes Link</div>
            <div className="dash-url-value">
              <span>chatresumes.io/</span>
              jordan-hayes
            </div>
          </div>
          <div className="dash-url-actions">
            <button className="btn-copy" disabled type="button">
              📋 Copy Link
            </button>
            <button className="btn-share" disabled type="button">
              ↗ Share
            </button>
            <Link className="btn-share btn-share-dark" to="/chat">
              ✏️ Continue Training
            </Link>
          </div>
        </div>

        <div className="dash-grid">
          <div className="dash-card">
            <div className="dash-card-title">
              Recent Recruiter Activity <span className="dash-badge">This Week</span>
            </div>
            {activityItems.map((item) => (
              <div className="activity-item" key={`${item.title}-${item.time}`}>
                <div className={`activity-icon ${item.kind}`}>{item.icon}</div>
                <div>
                  <div className="activity-who">{item.title}</div>
                  <div className="activity-what">{item.summary}</div>
                </div>
                <div className="activity-when">{item.time}</div>
              </div>
            ))}
          </div>

          <div className="dash-card">
            <div className="dash-card-title">Your Stats</div>
            {miniStats.map((stat) => (
              <div className="stat-mini" key={stat.label}>
                <div className="stat-mini-num">{stat.value}</div>
                <div className="stat-mini-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-title">
            Complete Your Setup <span className="dash-badge">2 of 4 done</span>
          </div>
          <div className="setup-checklist">
            {checklistItems.map((item) => (
              <div className={`checklist-item${item.done ? ' done' : ''}`} key={item.label}>
                <span className="check-icon">{item.icon}</span>
                <span className={`check-label${item.done ? ' done-text' : ''}`}>
                  {item.label}
                </span>
                {item.done ? null : <span className="check-arrow">→</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
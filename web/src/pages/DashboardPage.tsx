import { UserButton, useAuth, useUser } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { createPortalSession } from '../lib/billing'
import { fetchDashboard, type DashboardSummary } from '../lib/dashboard'

const formatRelativeTime = (isoString: string) => {
  const deltaMs = Date.now() - new Date(isoString).getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (deltaMs < hour) {
    return `${Math.max(1, Math.round(deltaMs / minute))}m ago`
  }

  if (deltaMs < day) {
    return `${Math.max(1, Math.round(deltaMs / hour))}h ago`
  }

  return `${Math.max(1, Math.round(deltaMs / day))}d ago`
}

export const DashboardPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const displayName = user?.fullName ?? user?.firstName ?? 'Candidate'
  const emailAddress = user?.primaryEmailAddress?.emailAddress ?? 'Signed in'
  const firstName = user?.firstName ?? displayName
  const initials =
    user?.firstName?.[0]?.toUpperCase() ?? user?.lastName?.[0]?.toUpperCase() ?? 'C'
  const [dashboard, setDashboard] = useState<{
    copyState: 'copied' | 'failed' | 'idle'
    data: DashboardSummary | null
    error: string | null
    isLoading: boolean
    isOpeningPortal: boolean
  }>({
    copyState: 'idle',
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

    const loadDashboard = async () => {
      setDashboard((current) => ({ ...current, error: null, isLoading: true }))

      try {
        const data = await fetchDashboard(getToken)

        if (isCancelled) {
          return
        }

        setDashboard({
          copyState: 'idle',
          data,
          error: null,
          isLoading: false,
          isOpeningPortal: false,
        })
      } catch (error) {
        if (isCancelled) {
          return
        }

        setDashboard({
          copyState: 'idle',
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load the candidate dashboard.',
          isLoading: false,
          isOpeningPortal: false,
        })
      }
    }

    void loadDashboard()

    return () => {
      isCancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  const handleManageBilling = async () => {
    setDashboard((current) => ({ ...current, error: null, isOpeningPortal: true }))

    try {
      const { portalUrl } = await createPortalSession(getToken, `${window.location.origin}/dashboard`)

      window.location.assign(portalUrl)
    } catch (error) {
      setDashboard((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to open the billing portal.',
        isOpeningPortal: false,
      }))
    }
  }

  const handleCopyLink = async () => {
    const publicUrl = dashboard.data?.profile.publicUrl

    if (!publicUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(publicUrl)
      setDashboard((current) => ({ ...current, copyState: 'copied' }))
    } catch {
      setDashboard((current) => ({ ...current, copyState: 'failed' }))
    }
  }

  const billingStatusLabel = dashboard.data?.billing.status?.replace('_', ' ') ?? 'not started'
  const billingPeriodCopy = dashboard.data?.billing.currentPeriodEnd
    ? `Renews through ${new Date(dashboard.data.billing.currentPeriodEnd).toLocaleDateString()}`
    : 'No active billing period yet.'
  const shortPublicPath = dashboard.data?.profile.publicUrl
    ? new URL(dashboard.data.profile.publicUrl).pathname.replace(/^\//, '')
    : 'loading'
  const miniStats = [
    {
      label: 'Link Views This Week',
      value: String(dashboard.data?.metrics.viewsThisWeek ?? 0),
    },
    {
      label: 'Recruiter Chat Sessions',
      value: String(dashboard.data?.metrics.chatSessions ?? 0),
    },
    {
      label: 'Avg. Chat Duration',
      value: `${dashboard.data?.metrics.averageChatDurationMinutes ?? 0}m`,
    },
    {
      label: 'Approved Stories',
      value: String(dashboard.data?.metrics.approvedStoriesCount ?? 0),
    },
  ]
  const checklistItems = dashboard.data?.profile.completeness.items ?? []

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
          <p>
            {dashboard.data
              ? `Your public AI link has ${dashboard.data.metrics.viewsThisWeek} views this week and ${dashboard.data.metrics.chatSessions} recruiter chat sessions so far.`
              : 'Loading your billing, public link, and recruiter activity metrics.'}
          </p>
        </div>

        <div className="dash-card dash-billing-card">
          <div className="dash-card-title">
            Billing Status
            <span className={`dash-billing-pill${dashboard.data?.billing.hasActiveSubscription ? ' active' : ''}`}>
              {dashboard.isLoading ? 'Loading' : billingStatusLabel}
            </span>
          </div>
          <div className="dash-billing-row">
            <div>
              <div className="dash-billing-copy">
                {dashboard.data?.billing.hasActiveSubscription
                  ? 'Your launch plan is active.'
                  : 'Complete checkout to activate your plan and unlock your candidate workspace.'}
              </div>
              <div className="dash-billing-meta">{billingPeriodCopy}</div>
              {dashboard.error ? <div className="dash-billing-error">{dashboard.error}</div> : null}
            </div>
            <div className="dash-billing-actions">
              {dashboard.data?.billing.canManageBilling ? (
                <button
                  className="btn-share"
                  disabled={dashboard.isOpeningPortal}
                  onClick={handleManageBilling}
                  type="button"
                >
                  {dashboard.isOpeningPortal ? 'Opening…' : 'Manage Billing'}
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
            <div className="dash-url-value">{shortPublicPath}</div>
          </div>
          <div className="dash-url-actions">
            <button className="btn-copy" onClick={handleCopyLink} type="button">
              {dashboard.copyState === 'copied'
                ? 'Copied Link'
                : dashboard.copyState === 'failed'
                  ? 'Copy Failed'
                  : '📋 Copy Link'}
            </button>
            {dashboard.data?.profile.publicUrl ? (
              <a className="btn-share" href={dashboard.data.profile.publicUrl} rel="noreferrer" target="_blank">
                ↗ Open Public Link
              </a>
            ) : (
              <button className="btn-share" disabled type="button">
                ↗ Open Public Link
              </button>
            )}
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
            {dashboard.data?.activity.length ? (
              dashboard.data.activity.map((item) => (
                <div className="activity-item" key={item.id}>
                  <div className={`activity-icon ${item.type}`}>{item.type === 'chat' ? '💬' : '👁'}</div>
                  <div>
                    <div className="activity-who">{item.title}</div>
                    <div className="activity-what">{item.summary}</div>
                  </div>
                  <div className="activity-when">{formatRelativeTime(item.occurredAt)}</div>
                </div>
              ))
            ) : (
              <div className="dash-empty-state">
                Public traffic and recruiter chats will show up here once someone opens your link.
              </div>
            )}
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
            Profile Completeness{' '}
            <span className="dash-badge">
              {dashboard.data?.profile.completeness.completed ?? 0} of{' '}
              {dashboard.data?.profile.completeness.total ?? 0} done
            </span>
          </div>
          <div className="setup-checklist">
            {checklistItems.length ? (
              checklistItems.map((item) => (
                <div className={`checklist-item${item.done ? ' done' : ''}`} key={item.key}>
                  <span className="check-icon">{item.done ? '✅' : '📄'}</span>
                  <span className={`check-label${item.done ? ' done-text' : ''}`}>{item.label}</span>
                  {item.done ? null : <span className="check-arrow">→</span>}
                </div>
              ))
            ) : (
              <div className="dash-empty-state">Loading your completeness checklist…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
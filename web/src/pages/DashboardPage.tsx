import { useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { AppShell } from '../components/ui/AppShell'
import { Button, ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Stat } from '../components/ui/Stat'
import { QuizModal } from '../components/QuizModal'
import { createPortalSession } from '../lib/billing'
import { fetchDashboard, type DashboardSummary } from '../lib/dashboard'
import {
  deleteDocument,
  listDocuments,
  uploadDocument,
  type DocumentSummary,
} from '../lib/documents'

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

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const documentStatusPill = (status: DocumentSummary['status']) => {
  if (status === 'ready') return <span className="ui-pill ui-pill-active">Ready</span>
  if (status === 'failed') return <span className="ui-pill ui-pill-danger">Failed</span>
  return <span className="ui-pill ui-pill-neutral">Processing</span>
}

const DocumentsCard = () => {
  const { getToken } = useAuth()
  const [documents, setDocuments] = useState<DocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { documents: list } = await listDocuments(getToken)
        if (cancelled) return
        setDocuments(list)
        setError(null)
      } catch (caught) {
        if (cancelled) return
        setError(caught instanceof Error ? caught.message : 'Unable to load documents.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [getToken, reloadKey])

  const refresh = () => setReloadKey((current) => current + 1)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        await uploadDocument(file, getToken)
      }
      refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    setError(null)
    try {
      await deleteDocument(documentId, getToken)
      refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Delete failed.')
    }
  }

  return (
    <Card>
      <SectionHeader
        eyebrow="Train your AI"
        title="Documents"
        description="Drop a PDF resume, DOCX, or text file. We extract the text and feed it to your AI."
      />
      <div
        aria-label="Upload documents"
        className={`dropzone${isDragging ? ' dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragLeave={(event) => {
          event.preventDefault()
          setIsDragging(false)
        }}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void handleFiles(event.dataTransfer.files)
        }}
        role="button"
        tabIndex={0}
      >
        <div className="dropzone-title">
          {isUploading ? 'Uploading…' : 'Drop files here or click to browse'}
        </div>
        <div className="dropzone-hint">PDF · DOCX · TXT · MD · up to 10 MB</div>
        <input
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          multiple
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
      </div>
      {error ? <div className="ui-error-text" style={{ marginTop: '0.6rem' }}>{error}</div> : null}
      <div className="doc-list">
        {isLoading ? (
          <div className="ui-status-text">Loading documents…</div>
        ) : documents.length === 0 ? (
          <EmptyState icon="📄" text="No documents yet." subtext="Your first upload trains your AI." />
        ) : (
          documents.map((document) => (
            <div className="doc-item" key={document.id}>
              <div className="doc-item-info">
                <div className="doc-item-name" title={document.originalName}>
                  {document.originalName}
                </div>
                <div className="doc-item-meta">
                  {formatBytes(document.sizeBytes)}
                  {document.error ? ` · ${document.error}` : ''}
                </div>
              </div>
              <div className="ui-row">
                {documentStatusPill(document.status)}
                <Button
                  onClick={() => void handleDelete(document.id)}
                  size="sm"
                  variant="danger"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}

const ShareLinkCard = ({
  data,
  onCopy,
  copyState,
}: {
  copyState: 'copied' | 'failed' | 'idle'
  data: DashboardSummary | null
  onCopy: () => void
}) => {
  const publicUrl = data?.profile.publicUrl ?? ''
  const isActive = Boolean(data?.publicLinkActive)
  const statusPill = isActive ? (
    <span className="ui-pill ui-pill-active">Active</span>
  ) : (
    <span className="ui-pill ui-pill-inactive">Inactive</span>
  )

  return (
    <Card padding="lg">
      <SectionHeader
        action={statusPill}
        eyebrow="Recruiter share link"
        title="Your public AI link"
        description={
          isActive
            ? 'Send this to recruiters. Works while you sleep.'
            : 'Subscribe to activate. Your link stays the same once active.'
        }
      />
      <div className="ui-row" style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
        <input
          aria-label="Public link"
          className="ui-input ui-input-readonly"
          readOnly
          value={publicUrl || 'Loading…'}
        />
      </div>
      <div className="ui-row" style={{ gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
        {isActive ? (
          <>
            <Button onClick={onCopy} variant="primary">
              {copyState === 'copied'
                ? 'Copied'
                : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy link'}
            </Button>
            {publicUrl ? (
              <ButtonLink href={publicUrl} rel="noreferrer" target="_blank" variant="secondary">
                Open
              </ButtonLink>
            ) : null}
          </>
        ) : (
          <ButtonLink href="/pricing" variant="primary">
            Activate link — Subscribe
          </ButtonLink>
        )}
      </div>
    </Card>
  )
}

export const DashboardPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [reloadKey, setReloadKey] = useState(0)
  const [isQuizOpen, setIsQuizOpen] = useState(false)
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
    if (!isLoaded || !isSignedIn) return
    let isCancelled = false

    const load = async () => {
      try {
        const data = await fetchDashboard(getToken)
        if (isCancelled) return
        setDashboard((current) => ({
          ...current,
          data,
          error: null,
          isLoading: false,
        }))
      } catch (error) {
        if (isCancelled) return
        setDashboard((current) => ({
          ...current,
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load dashboard.',
          isLoading: false,
        }))
      }
    }

    void load()
    return () => {
      isCancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, reloadKey])

  const handleCopy = async () => {
    const url = dashboard.data?.profile.publicUrl
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setDashboard((current) => ({ ...current, copyState: 'copied' }))
    } catch {
      setDashboard((current) => ({ ...current, copyState: 'failed' }))
    }
  }

  const handleManageBilling = async () => {
    setDashboard((current) => ({ ...current, isOpeningPortal: true }))
    try {
      const { portalUrl } = await createPortalSession(
        getToken,
        `${window.location.origin}/dashboard`,
      )
      window.location.assign(portalUrl)
    } catch (error) {
      setDashboard((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Unable to open billing portal.',
        isOpeningPortal: false,
      }))
    }
  }

  const metrics = dashboard.data?.metrics
  const activity = dashboard.data?.activity ?? []
  const billing = dashboard.data?.billing
  const isSubscribed = Boolean(billing?.hasActiveSubscription)

  return (
    <AppShell
      action={
        billing?.canManageBilling ? (
          <Button
            disabled={dashboard.isOpeningPortal}
            onClick={() => void handleManageBilling()}
            size="sm"
            variant="ghost"
          >
            {dashboard.isOpeningPortal ? 'Opening…' : 'Billing'}
          </Button>
        ) : !isSubscribed ? (
          <Link className="ui-btn ui-btn-primary ui-btn-sm" to="/pricing">
            Subscribe
          </Link>
        ) : null
      }
    >
      <ShareLinkCard
        copyState={dashboard.copyState}
        data={dashboard.data}
        onCopy={() => void handleCopy()}
      />

      {dashboard.error ? <div className="ui-error-text">{dashboard.error}</div> : null}

      <div className="ui-grid-2-wide">
        <DocumentsCard />
        <Card>
          <SectionHeader
            eyebrow="Train your AI"
            title="Intake quiz"
            description="Answer the 5 questions recruiters always want to know. Your AI uses these to ground every reply."
            action={
              <span className="ui-pill ui-pill-neutral">
                {dashboard.data?.profile.quizAnsweredCount ?? 0} / {dashboard.data?.profile.quizTotal ?? 5} answered
              </span>
            }
          />
          <Button block onClick={() => setIsQuizOpen(true)} variant="primary">
            {(dashboard.data?.profile.quizAnsweredCount ?? 0) > 0 ? 'Continue quiz' : 'Open quiz'}
          </Button>
        </Card>
        <Card>
          <SectionHeader
            eyebrow="Or train via chat"
            title="Talk to your AI"
            description="Coach your AI through conversation. Each turn refines a STAR story you can approve."
          />
          <Link className="ui-btn ui-btn-secondary ui-btn-block" to="/chat">
            Open chat →
          </Link>
        </Card>
      </div>

      <Card>
        <SectionHeader eyebrow="Insights" title="At a glance" />
        <div className="ui-stat-grid">
          <Stat label="Link views (7d)" value={metrics?.viewsThisWeek ?? 0} />
          <Stat label="Recruiter chats" value={metrics?.chatSessions ?? 0} />
          <Stat
            label="Avg chat (min)"
            value={metrics?.averageChatDurationMinutes ?? 0}
          />
          <Stat label="Approved stories" value={metrics?.approvedStoriesCount ?? 0} />
        </div>
      </Card>

      <Card>
        <SectionHeader eyebrow="Activity" title="Recent recruiter activity" />
        {activity.length === 0 ? (
          <EmptyState
            icon="👁"
            text="Nothing yet."
            subtext={
              isSubscribed
                ? 'Recruiter visits and chats will appear here.'
                : 'Activate your link to start collecting recruiter activity.'
            }
          />
        ) : (
          <div className="activity-list">
            {activity.map((item) => (
              <div className="activity-row" key={item.id}>
                <span className="activity-row-icon">{item.type === 'chat' ? '💬' : '👁'}</span>
                <div className="activity-row-body">
                  <div className="activity-row-title">{item.title}</div>
                  <div className="activity-row-summary">{item.summary}</div>
                </div>
                <div className="activity-row-time">{formatRelativeTime(item.occurredAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onSaved={() => setReloadKey((current) => current + 1)}
      />
    </AppShell>
  )
}

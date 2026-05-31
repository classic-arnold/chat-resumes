import { useAuth } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Copy,
  ExternalLink,
  FileText,
  Trash2,
  UploadCloud,
  MessageSquare,
  Clock,
  Sparkles,
  BookOpen,
  Eye,
  AlertCircle,
  FileCode,
  TrendingUp,
  Link2
} from 'lucide-react'

import { AppShell } from '../components/ui/AppShell'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
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

const getFileIcon = (fileName: string) => {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.pdf')) {
    return <FileText className="text-rose-500 w-[18px] h-[18px]" />
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    return <FileText className="text-blue-500 w-[18px] h-[18px]" />
  }
  if (lower.endsWith('.md') || lower.endsWith('.txt')) {
    return <FileCode className="text-slate-500 w-[18px] h-[18px]" />
  }
  return <FileText className="text-slate-400 w-[18px] h-[18px]" />
}

const documentStatusPill = (status: DocumentSummary['status']) => {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-[0.35rem] rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-emerald-50 text-emerald-700 border border-emerald-100/80">
        <span className="w-[6px] h-[6px] rounded-full bg-emerald-500 animate-pulse" />
        Ready
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-[0.35rem] rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-rose-50 text-rose-700 border border-rose-100">
        <span className="w-[6px] h-[6px] rounded-full bg-rose-500" />
        Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-[0.35rem] rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
      <span className="w-[6px] h-[6px] rounded-full bg-[#5B54F7] animate-ping" />
      Processing
    </span>
  )
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
    <Card className="flex flex-col gap-[1.25rem] border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px]">
      <SectionHeader
        eyebrow="Train your AI"
        title="Documents"
        description="Drop a PDF resume, DOCX, or text file. We extract the text and feed it to your AI."
      />

      {/* Premium Upload Dropzone */}
      <div
        aria-label="Upload documents"
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-[14px] py-[2.5rem] px-[1.5rem] text-center cursor-pointer transition-all duration-300 ${isDragging
          ? 'bg-indigo-50/60 border-[#5B54F7] scale-[1.01] shadow-[0_4px_20px_rgba(91,84,247,0.1)]'
          : 'border-slate-200 hover:border-[#5B54F7] hover:bg-slate-50/50'
          }`}
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
        <div className="w-[44px] h-[44px] rounded-full bg-slate-50 flex items-center justify-center mb-[0.75rem] border border-slate-100 transition-colors group-hover:bg-indigo-50">
          <UploadCloud className="w-[20px] h-[20px] text-[#5B54F7]" />
        </div>
        <div className="text-[0.85rem] text-[#0f1f4b] font-semibold tracking-tight">
          {isUploading ? 'Uploading documents...' : 'Drop files here or click to browse'}
        </div>
        <div className="text-[0.72rem] text-slate-500 mt-[0.25rem]">
          Supports PDF · DOCX · TXT · MD (up to 10 MB)
        </div>
        <input
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
          className="hidden"
          multiple
          onChange={(event) => {
            void handleFiles(event.target.files)
            event.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
      </div>

      {error ? (
        <div className="flex items-center gap-[0.5rem] text-[0.78rem] text-rose-600 bg-rose-50 border border-rose-100 rounded-[8px] p-[0.75rem_1rem]">
          <AlertCircle className="w-[16px] h-[16px] flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Documents List */}
      <div className="flex flex-col gap-[0.75rem]">
        {isLoading ? (
          <div className="text-center text-[0.8rem] text-slate-500 py-[2.5rem] px-[1rem] flex flex-col items-center justify-center gap-[0.5rem]">
            <span className="w-[20px] h-[20px] rounded-full border-2 border-indigo-100 border-t-[#5B54F7] animate-spin" />
            <span>Loading your trained documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState icon="📄" text="No documents uploaded yet." subtext="Upload your resume or portfolio documents to train your personal AI recruiter agent." />
        ) : (
          <div className="flex flex-col gap-[0.5rem]">
            {documents.map((document) => (
              <div
                className="flex items-center justify-between gap-[0.75rem] py-[0.75rem] px-[1rem] bg-white border border-slate-100 rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-slate-200 transition-all"
                key={document.id}
              >
                <div className="flex items-center gap-[0.75rem] min-w-0 flex-1">
                  <div className="w-[36px] h-[36px] rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(document.originalName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.82rem] font-bold text-[#0f1f4b] truncate" title={document.originalName}>
                      {document.originalName}
                    </div>
                    <div className="text-[0.72rem] text-slate-500 mt-[0.15rem] flex items-center gap-[0.5rem]">
                      <span>{formatBytes(document.sizeBytes)}</span>
                      {document.error ? (
                        <>
                          <span className="w-[3px] h-[3px] rounded-full bg-slate-300" />
                          <span className="text-rose-600">{document.error}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-[0.75rem]">
                  {documentStatusPill(document.status)}
                  <button
                    onClick={() => void handleDelete(document.id)}
                    className="p-[0.5rem] text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full border-none transition-all cursor-pointer"
                    title="Delete document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
    <span className="inline-flex items-center gap-[0.35rem] rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
      <span className="w-[6px] h-[6px] rounded-full bg-emerald-500 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-[0.35rem] rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-slate-50 text-slate-600 border border-slate-100">
      <span className="w-[6px] h-[6px] rounded-full bg-slate-400" />
      Inactive
    </span>
  )

  return (
    <Card className="relative overflow-hidden border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px] p-[1.5rem] md:p-[2rem]">
      {/* Visual top highlight */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#5B54F7] to-blue-bright" />

      <SectionHeader
        action={statusPill}
        eyebrow="Recruiter share link"
        title="Your public AI link"
        description={
          isActive
            ? 'Send this to recruiters. It interacts and screens candidates 24/7.'
            : 'Activate your subscription to go live. Your custom link stays reserved.'
        }
      />

      {/* Modern link input widget */}
      <div className="flex flex-col md:flex-row items-stretch gap-[0.75rem] mt-[1rem]">
        <div className="flex-1 flex items-center gap-[0.55rem] py-[0.65rem] px-[1rem] border border-slate-200 rounded-[12px] bg-slate-50/50 hover:border-slate-300 transition-colors">
          <Link2 className="w-[16px] h-[16px] text-slate-400 flex-shrink-0" />
          <input
            aria-label="Public link"
            className="w-full font-inter text-[0.85rem] text-[#0f1f4b] bg-transparent border-none outline-none select-all font-semibold"
            readOnly
            value={publicUrl || 'Loading Link...'}
          />
        </div>

        <div className="flex items-stretch gap-[0.5rem] flex-shrink-0">
          {isActive ? (
            <>
              <button
                onClick={onCopy}
                className="inline-flex items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.65rem] bg-[#5B54F7] hover:bg-[#4a43e6] text-white text-[0.82rem] font-bold rounded-[12px] transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(91,84,247,0.15)] active:scale-[0.98]"
              >
                <Copy size={15} />
                {copyState === 'copied'
                  ? 'Copied!'
                  : copyState === 'failed'
                    ? 'Copy failed'
                    : 'Copy Link'}
              </button>
              {publicUrl ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-[0.5rem] px-[1.25rem] py-[0.65rem] bg-slate-100 hover:bg-slate-200 text-[#0f1f4b] text-[0.82rem] font-semibold rounded-[12px] transition-all no-underline cursor-pointer border-none"
                >
                  <ExternalLink size={15} />
                  Open
                </a>
              ) : null}
            </>
          ) : (
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-[0.5rem] px-[1.5rem] py-[0.65rem] bg-[#5B54F7] hover:bg-[#4a43e6] text-white text-[0.82rem] font-bold rounded-[12px] transition-all no-underline cursor-pointer border-none shadow-[0_4px_12px_rgba(91,84,247,0.15)] active:scale-[0.98]"
            >
              Activate link — Subscribe
            </Link>
          )}
        </div>
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
          <button
            disabled={dashboard.isOpeningPortal}
            onClick={() => void handleManageBilling()}
            className="inline-flex items-center justify-center gap-[0.45rem] border border-slate-200 rounded-[8px] py-[0.45rem] px-[0.9rem] font-inter font-bold text-[0.78rem] tracking-[0.01em] cursor-pointer transition-all bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {dashboard.isOpeningPortal ? 'Opening…' : 'Billing'}
          </button>
        ) : !isSubscribed ? (
          <Link
            className="inline-flex items-center justify-center gap-[0.45rem] border-none rounded-[8px] py-[0.45rem] px-[1rem] font-inter font-bold text-[0.78rem] tracking-[0.01em] cursor-pointer transition-all bg-[#5B54F7] text-white hover:bg-[#4a43e6] no-underline whitespace-nowrap shadow-[0_4px_12px_rgba(91,84,247,0.2)]"
            to="/pricing"
          >
            Subscribe
          </Link>
        ) : null
      }
    >
      <div className="font-sans flex flex-col gap-[1.5rem]">

        <ShareLinkCard
          copyState={dashboard.copyState}
          data={dashboard.data}
          onCopy={() => void handleCopy()}
        />

        {dashboard.error ? (
          <div className="flex items-center gap-[0.5rem] text-[0.78rem] text-rose-600 bg-rose-50 border border-rose-100 rounded-[12px] p-[1rem]">
            <AlertCircle className="w-[18px] h-[18px] flex-shrink-0" />
            <span>{dashboard.error}</span>
          </div>
        ) : null}

        {/* Training Area Split Columns */}
        <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-[1.5rem] items-start">
          <DocumentsCard />

          <div className="flex flex-col gap-[1.5rem]">
            {/* Intake Quiz Panel */}
            <Card className="flex flex-col gap-[1.25rem] border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px] p-[1.5rem]">
              <div className="flex items-start justify-between gap-[0.5rem]">
                <div className="w-[36px] h-[36px] rounded-full bg-indigo-50 border border-indigo-100/50 flex items-center justify-center flex-shrink-0 text-[#5B54F7]">
                  <BookOpen size={18} />
                </div>
                <span className="inline-flex items-center justify-center rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-bold tracking-[0.04em] uppercase bg-slate-50 text-slate-600 border border-slate-100">
                  {dashboard.data?.profile.quizAnsweredCount ?? 0} / {dashboard.data?.profile.quizTotal ?? 5} answered
                </span>
              </div>
              <div>
                <h3 className="font-inter font-bold text-[0.98rem] text-[#0f1f4b] m-0 tracking-tight">Intake Quiz</h3>
                <p className="text-[0.78rem] text-slate-500 mt-[0.35rem] leading-[1.5] m-0">
                  Answer the key questions recruiters ask. Your AI uses these facts to ground every response.
                </p>
              </div>
              <button
                onClick={() => setIsQuizOpen(true)}
                className="w-full bg-[#5B54F7] hover:bg-[#4a43e6] text-white py-[0.75rem] px-[1.25rem] rounded-[12px] text-[0.82rem] font-bold flex items-center justify-center gap-[0.5rem] transition-all cursor-pointer border-none shadow-[0_4px_12px_rgba(91,84,247,0.15)] active:scale-[0.98]"
              >
                {(dashboard.data?.profile.quizAnsweredCount ?? 0) > 0 ? 'Continue quiz' : 'Open quiz'}
              </button>
            </Card>

            {/* Talk to AI Studio Panel */}
            <Card className="flex flex-col gap-[1.25rem] border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px] p-[1.5rem]">
              <div className="w-[36px] h-[36px] rounded-full bg-blue-50 border border-blue-100/50 flex items-center justify-center flex-shrink-0 text-blue-600">
                <MessageSquare size={18} />
              </div>
              <div>
                <h3 className="font-inter font-bold text-[0.98rem] text-[#0f1f4b] m-0 tracking-tight">Talk to your AI</h3>
                <p className="text-[0.78rem] text-slate-500 mt-[0.35rem] leading-[1.5] m-0">
                  Coach your AI agent via conversation. Each exchange helps write and refine key career accomplishments.
                </p>
              </div>
              <Link
                to="/chat"
                className="w-full bg-slate-50 hover:bg-slate-100 text-[#5B54F7] py-[0.75rem] px-[1.25rem] rounded-[12px] text-[0.82rem] font-bold flex items-center justify-center gap-[0.5rem] transition-all no-underline cursor-pointer border border-indigo-50 active:scale-[0.98]"
              >
                Open AI Studio →
              </Link>
            </Card>
          </div>
        </div>

        {/* Insights Analytics */}
        <Card className="border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px] p-[1.5rem]">
          <div className="flex items-center gap-[0.5rem] mb-[1.25rem]">
            <TrendingUp className="w-[18px] h-[18px] text-[#5B54F7]" />
            <h3 className="font-inter font-bold text-[1rem] text-[#0f1f4b] m-0 tracking-tight">At a Glance</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1rem] md:gap-[1.5rem]">

            {/* Views Metric */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[12px] p-[1rem] flex flex-col gap-[0.5rem]">
              <div className="flex items-center gap-[0.5rem]">
                <div className="w-[28px] h-[28px] rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye size={14} />
                </div>
                <span className="text-[0.72rem] font-semibold text-slate-500 uppercase tracking-[0.05em]">Views (7d)</span>
              </div>
              <div className="text-[1.8rem] font-extrabold text-[#0f1f4b] leading-tight tracking-tight mt-[0.25rem]">
                {metrics?.viewsThisWeek ?? 0}
              </div>
            </div>

            {/* Chats Metric */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[12px] p-[1rem] flex flex-col gap-[0.5rem]">
              <div className="flex items-center gap-[0.5rem]">
                <div className="w-[28px] h-[28px] rounded-full bg-indigo-50 text-[#5B54F7] flex items-center justify-center">
                  <MessageSquare size={14} />
                </div>
                <span className="text-[0.72rem] font-semibold text-slate-500 uppercase tracking-[0.05em]">Chats</span>
              </div>
              <div className="text-[1.8rem] font-extrabold text-[#0f1f4b] leading-tight tracking-tight mt-[0.25rem]">
                {metrics?.chatSessions ?? 0}
              </div>
            </div>

            {/* Duration Metric */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[12px] p-[1rem] flex flex-col gap-[0.5rem]">
              <div className="flex items-center gap-[0.5rem]">
                <div className="w-[28px] h-[28px] rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Clock size={14} />
                </div>
                <span className="text-[0.72rem] font-semibold text-slate-500 uppercase tracking-[0.05em]">Avg Chat</span>
              </div>
              <div className="text-[1.8rem] font-extrabold text-[#0f1f4b] leading-tight tracking-tight mt-[0.25rem] flex items-baseline">
                {metrics?.averageChatDurationMinutes ?? 0}
                <span className="text-[0.8rem] text-slate-400 font-normal ml-[0.15rem]">min</span>
              </div>
            </div>

            {/* Stories Metric */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-[12px] p-[1rem] flex flex-col gap-[0.5rem]">
              <div className="flex items-center gap-[0.5rem]">
                <div className="w-[28px] h-[28px] rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Sparkles size={14} />
                </div>
                <span className="text-[0.72rem] font-semibold text-slate-500 uppercase tracking-[0.05em]">Stories</span>
              </div>
              <div className="text-[1.8rem] font-extrabold text-[#0f1f4b] leading-tight tracking-tight mt-[0.25rem]">
                {metrics?.approvedStoriesCount ?? 0}
              </div>
            </div>

          </div>
        </Card>

        {/* Recruiter Activity Log */}
        <Card className="border border-slate-100 shadow-[0_12px_36px_rgba(15,31,75,0.04)] bg-white rounded-[16px] p-[1.5rem]">
          <div className="flex items-center gap-[0.5rem] mb-[1.25rem]">
            <Eye className="w-[18px] h-[18px] text-[#5B54F7]" />
            <h3 className="font-inter font-bold text-[1rem] text-[#0f1f4b] m-0 tracking-tight">Recent Activity</h3>
          </div>

          {activity.length === 0 ? (
            <EmptyState
              icon="👁"
              text="No interactions recorded yet."
              subtext={
                isSubscribed
                  ? 'Recruiter visits, views, and chat sessions will populate here in real-time.'
                  : 'Activate your link to go live and begin tracking recruiter engagements.'
              }
            />
          ) : (
            <div className="flex flex-col">
              {activity.map((item, idx) => (
                <div
                  className="flex items-center gap-[0.75rem] py-[0.95rem] border-b border-slate-100 last:border-b-0 hover:bg-slate-50/30 px-[0.5rem] -mx-[0.5rem] rounded-[8px] transition-colors"
                  key={item.id || idx}
                >
                  <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'chat'
                    ? 'bg-indigo-50 text-[#5B54F7]'
                    : 'bg-blue-50 text-blue-600'
                    }`}>
                    {item.type === 'chat' ? <MessageSquare size={14} /> : <Eye size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.82rem] font-bold text-[#0f1f4b]">{item.title}</div>
                    <div className="text-[0.78rem] text-slate-500 mt-[0.1rem] truncate">{item.summary}</div>
                  </div>
                  <div className="text-[0.74rem] text-slate-400 font-semibold whitespace-nowrap ml-[0.5rem]">
                    {formatRelativeTime(item.occurredAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onSaved={() => setReloadKey((current) => current + 1)}
      />
    </AppShell>
  )
}

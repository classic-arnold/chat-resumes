import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Socket } from 'socket.io-client'

import { Button } from '../components/ui/Button'
import {
  connectRecruiterSocket,
  fetchPublicProfile,
  type ChatMessage,
  type PublicProfileResponse,
  type RecruiterChatState,
} from '../lib/chat'
import '../styles/recruiter-chat.css'

const RECRUITER_PROMPTS = [
  'Strongest leadership example?',
  'What roles are you targeting?',
  'Most measurable business impact?',
  'Give me a 30-second summary.',
]

const isRecruiterMessage = (message: ChatMessage) => message.role === 'recruiter'

const toInitialState = (profile: PublicProfileResponse): RecruiterChatState => ({
  ...profile,
  messages: [],
  sessionId: null,
})

export const PublicRecruiterChatPage = () => {
  const { slug } = useParams()
  const socketRef = useRef<Socket | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [composer, setComposer] = useState('')
  const [state, setState] = useState<{
    data: RecruiterChatState | null
    error: string | null
    isConnected: boolean
    isLoading: boolean
    isReplying: boolean
  }>({
    data: null,
    error: null,
    isConnected: false,
    isLoading: true,
    isReplying: false,
  })

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [state.data?.messages.length, state.isReplying])

  useEffect(() => {
    if (!slug) {
      setState({
        data: null,
        error: 'Missing profile slug.',
        isConnected: false,
        isLoading: false,
        isReplying: false,
      })
      return
    }

    let cancelled = false
    const visitorKey = `chat-resumes:visitor:${slug}`

    const teardown = () => {
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
      socketRef.current = null
    }

    const load = async () => {
      try {
        const stored = window.localStorage.getItem(visitorKey)
        const profile = await fetchPublicProfile(slug, stored)
        if (cancelled) return

        window.localStorage.setItem(visitorKey, profile.visitorToken)
        setState((current) => ({
          ...current,
          data: toInitialState(profile),
          error: null,
          isLoading: false,
        }))

        if (profile.availability !== 'ready') return

        const socket = connectRecruiterSocket({ slug, visitorToken: profile.visitorToken })
        if (cancelled) {
          socket.disconnect()
          return
        }
        socketRef.current = socket
        socket.on('connect', () =>
          setState((current) => ({ ...current, error: null, isConnected: true })),
        )
        socket.on('disconnect', () =>
          setState((current) => ({ ...current, isConnected: false })),
        )
        socket.on('recruiter:session', (next: RecruiterChatState) => {
          window.localStorage.setItem(visitorKey, next.visitorToken)
          setState((current) => ({
            ...current,
            data: next,
            error: null,
            isConnected: true,
            isLoading: false,
            isReplying: false,
          }))
        })
        socket.on('recruiter:error', (payload: { message: string }) => {
          setState((current) => ({
            ...current,
            error: payload.message,
            isReplying: false,
          }))
        })
        socket.on('connect_error', (error: Error) => {
          setState((current) => ({
            ...current,
            error: error.message || 'Unable to connect.',
            isConnected: false,
            isReplying: false,
          }))
        })
      } catch (error) {
        if (cancelled) return
        setState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Unable to load.',
          isLoading: false,
        }))
      }
    }

    void load()
    return () => {
      cancelled = true
      teardown()
    }
  }, [slug])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || state.isReplying) return
    const socket = socketRef.current
    if (!socket || !socket.connected) {
      setState((current) => ({
        ...current,
        error: 'Disconnected. Refresh and try again.',
      }))
      return
    }
    socket.emit('recruiter:message', { content: trimmed })
    setComposer('')
    setState((current) => ({ ...current, error: null, isReplying: true }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    send(composer)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send(composer)
    }
  }

  const profile = state.data?.profile
  const availability = state.data?.availability

  if (!state.isLoading && state.data && availability !== 'ready') {
    return (
      <div className="center-page">
        <main className="center-page-main">
          <div className="center-page-card">
            <div className="ui-pill ui-pill-inactive" style={{ marginBottom: '1rem' }}>
              Profile unavailable
            </div>
            <h1 className="center-page-title">
              {profile?.displayName ?? 'This profile'} isn't available right now.
            </h1>
            <p className="center-page-body">
              {state.data?.fallbackMessage ?? 'Please check back later.'}
            </p>
            <Link className="center-page-link" to="/">
              ChatResumes home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="rc-page-shell">
      <header className="rc-header">
        <Link className="rc-brand" to="/">
          ChatResumes
        </Link>
        <div className="rc-header-status">
          <div className="rc-live-pill">
            <span className="rc-live-dot" />
            Live Now
          </div>
          <div className="rc-header-profile">
            <span className="rc-header-name">{profile?.displayName ?? 'Candidate AI'}</span>
            <span className="rc-header-label">AI Resume</span>
          </div>
        </div>
      </header>

      <div className="rc-layout">
        <main className="rc-main-col">
          <div className="rc-thread">
            <div className="rc-starter-pill">
              CONVERSATION STARTED WITH {profile?.displayName?.toUpperCase() ?? 'CANDIDATE'}'S AI VOICE
            </div>

            {state.error ? (
              <div className="rc-status-text" style={{ color: '#ef4444' }}>
                {state.error}
              </div>
            ) : null}
            {state.isLoading ? (
              <div className="rc-status-text">Loading…</div>
            ) : state.data && state.data.messages.length === 0 ? (
              <div className="rc-status-text">
                Ask anything. Answers come only from approved profile content.
              </div>
            ) : (
              state.data?.messages.map((message) => {
                const isRecruiter = isRecruiterMessage(message)
                return (
                  <div key={message.id} className="rc-message-group">
                    <div className={`rc-msg-label ${isRecruiter ? 'recruiter' : 'ai'}`}>
                      {isRecruiter ? (
                        'Recruiter'
                      ) : (
                        <>
                          {profile?.displayName ?? 'Candidate AI'} — AI
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </>
                      )}
                    </div>
                    <div className={isRecruiter ? 'rc-msg-bubble-recruiter' : 'rc-msg-bubble-ai'}>
                      {message.content}
                    </div>
                  </div>
                )
              })
            )}
            {state.isReplying ? (
              <div className="rc-message-group">
                <div className="rc-msg-label ai">
                  {profile?.displayName ?? 'Candidate AI'} — AI
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="rc-msg-bubble-ai" style={{ opacity: 0.85 }}>
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <div className="rc-prompts-row">
            {RECRUITER_PROMPTS.map((prompt) => (
              <button
                className="rc-prompt-chip"
                disabled={state.isReplying || availability !== 'ready'}
                key={prompt}
                onClick={() => send(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="rc-composer-container">
            <form className="rc-composer-pill" onSubmit={handleSubmit}>
              <textarea
                className="rc-composer-input"
                aria-label="Ask the candidate AI"
                disabled={availability !== 'ready' || state.isLoading || state.isReplying}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${profile?.displayName ?? 'Jordan'} anything...`}
                rows={1}
                value={composer}
              />
              <button
                className="rc-send-btn"
                disabled={
                  availability !== 'ready' ||
                  state.isLoading ||
                  state.isReplying ||
                  !composer.trim()
                }
                type="submit"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div className="rc-composer-disclaimer">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              AI generated response based on verified career history
            </div>
          </div>
        </main>

        <aside className="rc-sidebar-col">
          {/* Profile Card */}
          <div className="rc-profile-card">
            <div className="rc-avatar-container">
              <div className="rc-avatar-outer-ring">
                <img
                  className="rc-avatar-img"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                  alt={profile?.displayName ?? 'Candidate avatar'}
                />
              </div>
            </div>
            <h2 className="rc-profile-name">{profile?.displayName ?? 'Candidate AI'}</h2>
            <p className="rc-profile-headline">{profile?.headline ?? 'Software Engineer'}</p>

            <span className="rc-expertise-title">Key Expertise</span>
            <div className="rc-tags-container">
              {profile?.targetRoles && profile.targetRoles.length > 0 ? (
                profile.targetRoles.map((role, idx) => (
                  <span key={idx} className="rc-tag-chip">
                    {role}
                  </span>
                ))
              ) : (
                <>
                  <span className="rc-tag-chip">Next.js</span>
                  <span className="rc-tag-chip">Rust</span>
                  <span className="rc-tag-chip">Cloud Infra</span>
                </>
              )}
            </div>

            <div className="rc-buttons-container">
              <button className="rc-action-btn-outline">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Resume
              </button>
              <button className="rc-action-btn-solid">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Schedule Interview
              </button>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="rc-insights-card">
            <div className="rc-insights-header">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h3 className="rc-insights-title">AI Insights</h3>
            </div>
            <p className="rc-insights-body">
              {profile?.displayName ?? 'Jordan'} is currently in high demand with{' '}
              <strong>4 active interview cycles</strong>. His expertise in{' '}
              {profile?.targetRoles?.[0] || 'Vercel\'s Edge architecture'} is a rare{' '}
              <strong>0.1% skill match</strong> for your open Lead role.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

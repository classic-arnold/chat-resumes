import { useAuth } from '@clerk/react'
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Socket } from 'socket.io-client'

import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { isClerkConfigured } from '../auth/clerk'
import {
  approveCandidateStory,
  connectCandidateSocket,
  fetchCandidateChatState,
  type CandidateChatState,
  type ChatMessage,
} from '../lib/chat'
import '../styles/candidate-chat.css'

const QUICK_PROMPTS = [
  'Turn my last role into a STAR story',
  'Push me on the result',
  'What recruiter follow-up would you ask?',
  'Help me position my next role',
]

const isUserMessage = (message: ChatMessage) => message.role === 'candidate'

export const ChatPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [composer, setComposer] = useState('')
  const [state, setState] = useState<{
    approvingId: string | null
    data: CandidateChatState | null
    error: string | null
    isConnected: boolean
    isLoading: boolean
    isReplying: boolean
  }>({
    approvingId: null,
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
    if (!isClerkConfigured || !isLoaded || !isSignedIn) return
    let cancelled = false

    const teardown = () => {
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
      socketRef.current = null
    }

    const load = async () => {
      try {
        const initial = await fetchCandidateChatState(getToken)
        if (cancelled) return
        setState((current) => ({ ...current, data: initial, error: null, isLoading: false }))

        const socket = await connectCandidateSocket({ getToken })
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
        socket.on('candidate:session', (next: CandidateChatState) => {
          setState((current) => ({
            ...current,
            approvingId: null,
            data: next,
            error: null,
            isConnected: true,
            isLoading: false,
            isReplying: false,
          }))
        })
        socket.on('candidate:error', (payload: { message: string }) => {
          setState((current) => ({
            ...current,
            approvingId: null,
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
          error: error instanceof Error ? error.message : 'Unable to load chat.',
          isLoading: false,
        }))
      }
    }

    void load()
    return () => {
      cancelled = true
      teardown()
    }
  }, [getToken, isLoaded, isSignedIn])

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
    socket.emit('candidate:message', { content: trimmed })
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

  const handleApprove = async (storyId: string) => {
    setState((current) => ({ ...current, approvingId: storyId, error: null }))
    try {
      const next = await approveCandidateStory(getToken, storyId)
      setState((current) => ({ ...current, approvingId: null, data: next }))
    } catch (error) {
      setState((current) => ({
        ...current,
        approvingId: null,
        error: error instanceof Error ? error.message : 'Approve failed.',
      }))
    }
  }

  const stories = state.data?.stories ?? []
  const drafts = stories.filter((story) => story.status === 'draft')
  const approved = stories.filter((story) => story.status === 'approved')

  return (
    <div className="cc-page-shell">
      <header className="cc-header">
        <Link className="cc-brand" to="/dashboard">
          ChatResumes
          <div className="cc-studio-pill">AI Training Studio ⚡</div>
        </Link>
        <div className="cc-header-actions">
          <Link className="cc-back-link" to="/dashboard">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <div className="cc-layout">
        <aside className="cc-sidebar">
          <div className="cc-sidebar-section">
            <div className="cc-section-title">
              Draft Stories
              <span className="cc-section-count">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="cc-status-text">No drafts yet. Chat with the AI to extract one!</div>
            ) : (
              drafts.map((story) => (
                <div className="cc-story-card" key={story.id}>
                  <div className="cc-story-title">{story.title}</div>
                  <div className="cc-story-meta">{story.result || 'Needs a measurable result.'}</div>
                  <button
                    className="cc-approve-btn"
                    disabled={state.approvingId === story.id}
                    onClick={() => void handleApprove(story.id)}
                  >
                    {state.approvingId === story.id ? 'Approving…' : 'Approve Story'}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cc-sidebar-section">
            <div className="cc-section-title">
              Approved Stories
              <span className="cc-section-count">{approved.length}</span>
            </div>
            {approved.length === 0 ? (
              <div className="cc-status-text">
                None approved yet. Approved stories appear on your public link.
              </div>
            ) : (
              approved.map((story) => (
                <div className="cc-story-card cc-story-card-approved" key={story.id}>
                  <div className="cc-story-title">{story.title}</div>
                  <div className="cc-story-meta">{story.result}</div>
                  <div className="cc-approved-badge">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Live on Profile
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="cc-main">
          <div className="cc-thread">
            <div className="cc-starter-pill">
              TRAIN YOUR AI VOICE BY DESCRIBING YOUR REAL CAREER WINS
            </div>

            {state.error ? (
              <div className="cc-status-text" style={{ color: '#ef4444' }}>
                {state.error}
              </div>
            ) : null}

            {state.isLoading && !state.data ? (
              <div className="cc-status-text">Loading chat studio…</div>
            ) : state.data && state.data.messages.length === 0 ? (
              <EmptyState
                icon="💬"
                text="Start with one strong example."
                subtext="Describe a real win — what was at risk, what you did, what changed."
              />
            ) : (
              state.data?.messages.map((message) => {
                const isUser = isUserMessage(message)
                return (
                  <div key={message.id} className={`cc-msg-group ${isUser ? 'user' : 'ai'}`}>
                    <div className={`cc-msg-label ${isUser ? 'user' : 'ai'}`}>
                      {isUser ? (
                        'You (Candidate)'
                      ) : (
                        <>
                          AI Voice Coach
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
                    <div className={isUser ? 'cc-bubble-user' : 'cc-bubble-ai'}>
                      {message.content}
                    </div>
                  </div>
                )
              })
            )}

            {state.isReplying ? (
              <div className="cc-msg-group ai">
                <div className="cc-msg-label ai">
                  AI Voice Coach
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
                <div className="cc-bubble-ai" style={{ opacity: 0.85 }}>
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <div className="cc-prompts-row">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                className="cc-prompt-chip"
                disabled={state.isReplying}
                key={prompt}
                onClick={() => send(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="cc-composer-container">
            <form className="cc-composer-pill" onSubmit={handleSubmit}>
              <textarea
                className="cc-composer-input"
                aria-label="Message"
                disabled={state.isLoading || state.isReplying}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell the AI what happened at your role…"
                rows={1}
                value={composer}
              />
              <button
                className="cc-send-btn"
                disabled={state.isLoading || state.isReplying || !composer.trim()}
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
            <div className="cc-composer-disclaimer">
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
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your AI ground rules: only approved stories appear on recruiter links.
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

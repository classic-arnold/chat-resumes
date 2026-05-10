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
    <div className="app-shell">
      <header className="app-nav public-chat-header">
        <Link className="app-nav-brand" to="/">
          <span className="app-nav-brand-mark" aria-hidden />
          ChatResumes
        </Link>
        <div className="public-chat-profile">
          <div className="public-chat-profile-name">
            {profile?.displayName ?? 'Candidate AI'}
          </div>
          {profile?.headline ? (
            <div className="public-chat-profile-meta">{profile.headline}</div>
          ) : null}
        </div>
        <Link className="ui-btn ui-btn-ghost ui-btn-sm" to="/signup">
          Create yours
        </Link>
      </header>

      <div className="chat-layout">
        <aside className="chat-side">
          <div className="chat-side-section">
            <div className="chat-side-section-title">About</div>
            <div className="ui-status-text">
              {profile?.summary ?? 'Approved answers only.'}
            </div>
          </div>
          <div className="chat-side-section">
            <div className="chat-side-section-title">
              Approved stories ({state.data?.approvedStories.length ?? 0})
            </div>
            {(state.data?.approvedStories ?? []).length === 0 ? (
              <div className="ui-status-text">None yet.</div>
            ) : (
              state.data?.approvedStories.map((story) => (
                <div className="chat-side-story" key={story.id}>
                  <div className="chat-side-story-title">{story.title}</div>
                  <div className="chat-side-story-meta">{story.result}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="chat-main">
          <div className="chat-thread">
            {state.error ? <div className="ui-error-text">{state.error}</div> : null}
            {state.isLoading ? (
              <div className="ui-status-text">Loading…</div>
            ) : state.data && state.data.messages.length === 0 ? (
              <div className="ui-status-text">
                Ask anything. Answers come only from approved profile content.
              </div>
            ) : (
              state.data?.messages.map((message) => (
                <div
                  className={`chat-bubble ${isRecruiterMessage(message) ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                  key={message.id}
                >
                  {message.content}
                </div>
              ))
            )}
            {state.isReplying ? <div className="ui-status-text">Thinking…</div> : null}
            <div ref={threadEndRef} />
          </div>

          <div className="chat-prompts">
            {RECRUITER_PROMPTS.map((prompt) => (
              <button
                className="chat-prompt-chip"
                disabled={state.isReplying || availability !== 'ready'}
                key={prompt}
                onClick={() => send(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              aria-label="Ask the candidate AI"
              disabled={availability !== 'ready' || state.isLoading || state.isReplying}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about experience, impact, target roles…"
              rows={1}
              value={composer}
            />
            <Button
              disabled={
                availability !== 'ready' ||
                state.isLoading ||
                state.isReplying ||
                !composer.trim()
              }
              type="submit"
              variant="primary"
            >
              {state.isReplying ? 'Sending…' : 'Send'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  )
}

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
    <div className="app-shell">
      <header className="app-nav">
        <Link className="app-nav-brand" to="/dashboard">
          <span className="app-nav-brand-mark" aria-hidden />
          ChatResumes
        </Link>
        <div className="app-nav-actions">
          <Link className="ui-btn ui-btn-ghost ui-btn-sm" to="/dashboard">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-side">
          <div className="chat-side-section">
            <div className="chat-side-section-title">Drafts ({drafts.length})</div>
            {drafts.length === 0 ? (
              <div className="ui-status-text">No drafts yet.</div>
            ) : (
              drafts.map((story) => (
                <div className="chat-side-story" key={story.id}>
                  <div className="chat-side-story-title">{story.title}</div>
                  <div className="chat-side-story-meta">
                    {story.result || 'Needs a measurable result.'}
                  </div>
                  <Button
                    disabled={state.approvingId === story.id}
                    onClick={() => void handleApprove(story.id)}
                    size="sm"
                    variant="primary"
                  >
                    {state.approvingId === story.id ? 'Approving…' : 'Approve'}
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="chat-side-section">
            <div className="chat-side-section-title">Approved ({approved.length})</div>
            {approved.length === 0 ? (
              <div className="ui-status-text">None approved yet.</div>
            ) : (
              approved.map((story) => (
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
            {state.isLoading && !state.data ? (
              <div className="ui-status-text">Loading…</div>
            ) : state.data && state.data.messages.length === 0 ? (
              <EmptyState
                icon="💬"
                text="Start with one strong example."
                subtext="Describe a real win — what was at risk, what you did, what changed."
              />
            ) : (
              state.data?.messages.map((message) => (
                <div
                  className={`chat-bubble ${isUserMessage(message) ? 'chat-bubble-user' : 'chat-bubble-ai'}`}
                  key={message.id}
                >
                  {message.content}
                </div>
              ))
            )}
            {state.isReplying ? <div className="ui-status-text">AI is thinking…</div> : null}
            <div ref={threadEndRef} />
          </div>

          <div className="chat-prompts">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                className="chat-prompt-chip"
                disabled={state.isReplying}
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
              aria-label="Message"
              disabled={state.isLoading || state.isReplying}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell the AI what happened…"
              rows={1}
              value={composer}
            />
            <Button
              disabled={state.isLoading || state.isReplying || !composer.trim()}
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

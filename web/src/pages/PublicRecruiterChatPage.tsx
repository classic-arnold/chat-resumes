import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Socket } from 'socket.io-client'

import {
  connectRecruiterSocket,
  fetchPublicProfile,
  type ChatMessage,
  type PublicProfileResponse,
  type RecruiterChatState,
} from '../lib/chat'

type QuickPrompt = {
  label: string
  question: string
}

const recruiterPrompts: QuickPrompt[] = [
  {
    label: 'Leadership example',
    question: 'What is the strongest approved leadership example?',
  },
  {
    label: 'Target role',
    question: 'What kinds of roles is this candidate targeting next?',
  },
  {
    label: 'Business impact',
    question: 'Tell me about the most measurable business impact in the approved stories.',
  },
  {
    label: 'Summary',
    question: 'Give me the short recruiter summary for this candidate.',
  },
]

const getAuthor = (message: ChatMessage) => {
  if (message.role === 'recruiter') {
    return 'Recruiter'
  }

  return 'Public AI Profile'
}

const toInitialRecruiterState = (profile: PublicProfileResponse): RecruiterChatState => {
  return {
    ...profile,
    messages: [],
    sessionId: null,
  }
}

export const PublicRecruiterChatPage = () => {
  const { slug } = useParams()
  const socketRef = useRef<Socket | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [composerValue, setComposerValue] = useState('')
  const [chatState, setChatState] = useState<{
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
  }, [chatState.data?.messages.length, chatState.isReplying])

  useEffect(() => {
    if (!slug) {
      setChatState({
        data: null,
        error: 'This public AI profile is missing a slug.',
        isConnected: false,
        isLoading: false,
        isReplying: false,
      })
      return
    }

    let isDisposed = false
    const visitorStorageKey = `chat-resumes:visitor:${slug}`

    const teardownSocket = () => {
      socketRef.current?.removeAllListeners()
      socketRef.current?.disconnect()
      socketRef.current = null
    }

    const loadPublicChat = async () => {
      setChatState((current) => ({
        ...current,
        error: null,
        isLoading: true,
      }))

      try {
        const storedVisitorToken = window.localStorage.getItem(visitorStorageKey)
        const profile = await fetchPublicProfile(slug, storedVisitorToken)

        if (isDisposed) {
          return
        }

        window.localStorage.setItem(visitorStorageKey, profile.visitorToken)
        setChatState((current) => ({
          ...current,
          data: toInitialRecruiterState(profile),
          error: null,
          isLoading: false,
        }))

        if (profile.availability !== 'ready') {
          return
        }

        const socket = connectRecruiterSocket({
          slug,
          visitorToken: profile.visitorToken,
        })

        if (isDisposed) {
          socket.disconnect()
          return
        }

        socketRef.current = socket
        socket.on('connect', () => {
          setChatState((current) => ({
            ...current,
            error: null,
            isConnected: true,
          }))
        })
        socket.on('disconnect', () => {
          setChatState((current) => ({
            ...current,
            isConnected: false,
          }))
        })
        socket.on('recruiter:session', (state: RecruiterChatState) => {
          window.localStorage.setItem(visitorStorageKey, state.visitorToken)
          setChatState((current) => ({
            ...current,
            data: state,
            error: null,
            isConnected: true,
            isLoading: false,
            isReplying: false,
          }))
        })
        socket.on('recruiter:error', (payload: { message: string }) => {
          setChatState((current) => ({
            ...current,
            error: payload.message,
            isLoading: false,
            isReplying: false,
          }))
        })
        socket.on('connect_error', (error: Error) => {
          setChatState((current) => ({
            ...current,
            error: error.message || 'Unable to connect to the public recruiter chat.',
            isConnected: false,
            isLoading: false,
            isReplying: false,
          }))
        })
      } catch (error) {
        if (isDisposed) {
          return
        }

        setChatState((current) => ({
          ...current,
          error: error instanceof Error ? error.message : 'Unable to load the public recruiter chat.',
          isLoading: false,
        }))
      }
    }

    void loadPublicChat()

    return () => {
      isDisposed = true
      teardownSocket()
    }
  }, [slug])

  const sendQuestion = (question: string) => {
    const trimmedQuestion = question.trim()
    const socket = socketRef.current

    if (!trimmedQuestion || chatState.isReplying) {
      return
    }

    if (!socket || !socket.connected) {
      setChatState((current) => ({
        ...current,
        error: 'The recruiter chat is not connected yet. Refresh the page and try again.',
      }))
      return
    }

    socket.emit('recruiter:message', {
      content: trimmedQuestion,
    })
    setComposerValue('')
    setChatState((current) => ({
      ...current,
      error: null,
      isReplying: true,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendQuestion(composerValue)
  }

  const handlePromptClick = (prompt: QuickPrompt) => {
    sendQuestion(prompt.question)
  }

  const profile = chatState.data?.profile

  return (
    <div className="chat-page">
      <nav className="chat-nav">
        <Link className="logo" to="/">
          <div className="logo-icon">💬</div>
          Chat<span>Resumes</span>
        </Link>
        <div className="chat-nav-actions">
          <Link className="btn-nav-ghost" to="/pricing">
            Candidate Plan
          </Link>
          <Link className="btn-nav-solid" to="/signup">
            Create Yours
          </Link>
        </div>
      </nav>

      <main className="chat-layout">
        <section className="chat-sidebar-card">
          <div className="chat-sidebar-panel chat-sidebar-panel-primary">
            <div className="chat-profile-badge">Public Recruiter Chat</div>
            <div className="chat-profile-header">
              <div className="chat-profile-avatar">AI</div>
              <div>
                <h1 className="chat-profile-name">
                  {profile?.displayName ?? 'Candidate AI Profile'}
                </h1>
                <p className="chat-profile-role">
                  {profile?.headline ?? 'Recruiter-safe answers from approved public content only'}
                </p>
              </div>
            </div>
            <p className="chat-profile-summary">
              {profile?.summary ??
                chatState.data?.fallbackMessage ??
                'This public route answers only from approved profile fields and approved STAR stories.'}
            </p>
            <div className="chat-profile-url">
              {profile?.publicUrl ?? 'Public AI link currently unavailable'}
            </div>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">Approved story bank</div>
            <div className="chat-story-list">
              {chatState.data?.approvedStories.length ? (
                chatState.data.approvedStories.map((story) => (
                  <div className="chat-story-card" key={story.id}>
                    <div className="chat-story-header">
                      <div>
                        <div className="chat-story-title">{story.title}</div>
                        <div className="chat-story-status approved">Approved</div>
                      </div>
                    </div>
                    <div className="chat-story-body">
                      <strong>Action:</strong> {story.action}
                    </div>
                    <div className="chat-story-body">
                      <strong>Result:</strong> {story.result}
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty-state">
                  {chatState.data?.fallbackMessage ?? 'Approved public stories will show here once the candidate publishes them.'}
                </div>
              )}
            </div>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">Suggested recruiter prompts</div>
            <div className="chat-prompt-list">
              {recruiterPrompts.map((prompt) => (
                <button
                  className="chat-prompt-chip"
                  disabled={chatState.data?.availability !== 'ready' || chatState.isReplying}
                  key={prompt.label}
                  onClick={() => handlePromptClick(prompt)}
                  type="button"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="chat-conversation-card">
          <div className="chat-conversation-header">
            <div>
              <div className="chat-conversation-title">Recruiter Q&A</div>
              <div className="chat-conversation-status">
                <div className="status-dot" />
                {chatState.data?.availability === 'ready'
                  ? chatState.isConnected
                    ? 'Live public recruiter chat'
                    : 'Connecting to the public recruiter chat'
                  : chatState.data?.fallbackMessage ?? 'This public profile is still training'}
              </div>
            </div>
            <div className="chat-conversation-pill">
              {chatState.data?.availability === 'ready' ? 'Approved-only answers' : 'Profile unavailable'}
            </div>
          </div>

          <div className="chat-thread">
            {chatState.error ? <div className="chat-inline-error">{chatState.error}</div> : null}
            {chatState.data?.messages.map((message) => (
              <div className={`chat-message ${message.role === 'ai' ? 'ai' : 'candidate'}`} key={message.id}>
                <div className="chat-message-author">{getAuthor(message)}</div>
                <div className="chat-message-bubble">{message.content}</div>
              </div>
            ))}
            {chatState.isLoading ? (
              <div className="chat-empty-state">Loading the public recruiter chat…</div>
            ) : null}
            {chatState.isReplying ? (
              <div className="typing-row chat-typing-row">
                <div className="tdot" />
                <div className="tdot" />
                <div className="tdot" />
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              aria-label="Ask the candidate AI a question"
              className="chat-composer-input"
              disabled={chatState.data?.availability !== 'ready' || chatState.isLoading || chatState.isReplying}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder="Ask about experience, leadership, business impact, or target roles..."
              type="text"
              value={composerValue}
            />
            <button
              className="chat-send-btn chat-composer-send"
              disabled={
                chatState.data?.availability !== 'ready' ||
                chatState.isLoading ||
                chatState.isReplying ||
                !composerValue.trim()
              }
              type="submit"
            >
              {chatState.isReplying ? 'Thinking...' : 'Send →'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
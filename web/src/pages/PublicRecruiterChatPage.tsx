import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Socket } from 'socket.io-client'

import {
  connectRecruiterSocket,
  fetchPublicProfile,
  type ChatMessage,
  type PublicProfileResponse,
  type RecruiterChatState,
} from '../lib/chat'
import { trackPostHogEvent } from '../lib/posthog'


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
        trackPostHogEvent('public_profile_loaded', {
          approved_story_count: profile.approvedStories.length,
          availability: profile.availability,
          has_summary: Boolean(profile.profile?.summary),
          target_role_count: profile.profile?.targetRoles.length ?? 0,
        })
        setState((current) => ({
          ...current,
          data: toInitialState(profile),
          error: null,
          isLoading: false,
        }))

        if (profile.availability === 'inactive' || profile.availability === 'missing') return

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

  const send = (text: string, source: 'freeform' | 'quick_prompt' = 'freeform') => {
    const trimmed = text.trim()
    if (!trimmed || state.isReplying) return
    const socket = socketRef.current
    if (!socket || !socket.connected) {
      trackPostHogEvent('recruiter_message_send_failed', {
        availability: state.data?.availability ?? null,
        reason: 'socket_disconnected',
        source,
      })
      setState((current) => ({
        ...current,
        error: 'Disconnected. Refresh and try again.',
      }))
      return
    }

    trackPostHogEvent('recruiter_message_sent', {
      approved_story_count: state.data?.approvedStories.length ?? 0,
      availability: state.data?.availability ?? null,
      message_length: trimmed.length,
      source,
    })
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
  const isUnavailable = availability === 'inactive' || availability === 'missing'
  const isTraining = availability === 'training'

  if (!state.isLoading && state.data && isUnavailable) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a] items-center justify-center">
        <main className="flex-1 flex items-center justify-center p-[1rem]">
          <div className="w-full max-w-[440px] bg-white border border-[#e2e8f0] rounded-[14px] shadow-[0_18px_48px_rgba(10,36,99,0.08)] p-[2rem] text-center flex flex-col items-center">
            <div className="inline-flex items-center justify-center rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-semibold tracking-[0.06em] uppercase bg-[#f1f5f9] text-[#475569] mb-[1rem]">
              Profile unavailable
            </div>
            <h1 className="font-inter font-bold text-[1.5rem] text-[#0f172a] mb-[0.6rem]">
              {profile?.displayName ?? 'This profile'} isn't available right now.
            </h1>
            <p className="text-[0.82rem] text-[#64748b] leading-[1.55] mb-[1.25rem]">
              {state.data?.fallbackMessage ?? 'Please check back later.'}
            </p>
            <Link className="text-[0.74rem] text-[#4f46e5] hover:underline" to="/">
              ChatResumes home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-inter flex flex-col">
      <header className="h-[64px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-[2rem] sticky top-0 z-50">
        <Link className="font-inter text-[1.2rem] font-extrabold text-[#0f172a] no-underline tracking-[-0.02em]" to="/">
          ChatResumes
        </Link>
        <div className="flex items-center gap-[1rem]">
          <div className={`inline-flex items-center gap-[0.35rem] py-[0.3rem] px-[0.7rem] rounded-full text-[0.72rem] font-semibold ${isTraining ? 'bg-[rgba(245,158,11,0.12)] text-[#b45309]' : 'bg-[rgba(16,185,129,0.1)] text-[#047857]'}`}>
            <span className={`w-[6px] h-[6px] rounded-full animate-pulse ${isTraining ? 'bg-[#f59e0b]' : 'bg-[#10b981]'}`} />
            {isTraining ? 'Training' : 'Live Now'}
          </div>
          <div className="text-right flex flex-col">
            <span className="font-bold text-[0.88rem] text-[#0f172a]">{profile?.displayName ?? 'Candidate AI'}</span>
            <span className="text-[0.65rem] text-[#64748b] uppercase tracking-[0.08em] font-semibold mt-[1px]">AI Resume</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(280px,340px)] gap-[2rem] max-w-[1200px] w-full mx-auto px-[2rem] py-[2rem] flex-1">
        <main className="flex flex-col h-auto lg:h-[calc(100vh-128px)]">
          <div className="flex-1 overflow-y-auto pr-[0.5rem] mb-[1.5rem] flex flex-col gap-[1.5rem]">
            <div className="self-center border border-[#e2e8f0] bg-white py-[0.4rem] px-[1rem] rounded-full text-[0.68rem] text-[#64748b] tracking-[0.06em] font-medium mb-[0.5rem] text-center">
              CONVERSATION STARTED WITH {profile?.displayName?.toUpperCase() ?? 'CANDIDATE'}'S AI VOICE
            </div>

            {isTraining && state.data?.fallbackMessage ? (
              <div className="self-center max-w-[720px] border border-amber-200 bg-amber-50 text-amber-900 py-[0.75rem] px-[1rem] rounded-[12px] text-[0.78rem] leading-[1.5] text-center">
                {state.data.fallbackMessage}
              </div>
            ) : null}

            {state.error ? (
              <div className="text-[0.76rem] text-[#ef4444] text-center my-[1rem]">
                {state.error}
              </div>
            ) : null}
            {state.isLoading ? (
              <div className="text-[0.76rem] text-[#64748b] text-center my-[1rem]">Loading…</div>
            ) : state.data && state.data.messages.length === 0 ? (
              <div className="text-[0.76rem] text-[#64748b] text-center my-[1rem]">
                Ask anything. Answers come only from approved profile content.
              </div>
            ) : (
              state.data?.messages.map((message) => {
                const isRecruiter = isRecruiterMessage(message)
                return (
                  <div key={message.id} className="flex flex-col items-start max-w-[80%]">
                    <div className={`text-[0.72rem] font-semibold mb-[0.4rem] ml-[0.2rem] ${isRecruiter ? 'text-[#64748b]' : 'text-[#4f46e5] flex items-center gap-[0.25rem]'}`}>
                      {isRecruiter ? (
                        'Recruiter'
                      ) : (
                        <>
                          {profile?.displayName ?? 'Candidate AI'} — AI
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }} className={isRecruiter ? 'bg-white border border-[#e2e8f0] text-[#0f172a] py-[1rem] px-[1.25rem] rounded-[18px_18px_18px_4px] text-[0.86rem] leading-[1.55] shadow-[0_2px_8px_rgba(15,23,42,0.02)]' : 'bg-[#4f46e5] text-white py-[1rem] px-[1.25rem] rounded-[18px_18px_18px_4px] text-[0.86rem] leading-[1.55] shadow-[0_10px_25px_rgba(79,70,229,0.2)]'}>
                      {message.content}
                    </div>
                  </div>
                )
              })
            )}
            {state.isReplying ? (
              <div className="flex flex-col items-start max-w-[80%]">
                <div className="text-[0.72rem] font-semibold mb-[0.4rem] ml-[0.2rem] text-[#4f46e5] flex items-center gap-[0.25rem]">
                  {profile?.displayName ?? 'Candidate AI'} — AI
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="bg-[#4f46e5] text-white py-[1rem] px-[1.25rem] rounded-[18px_18px_18px_4px] text-[0.86rem] leading-[1.55] shadow-[0_10px_25px_rgba(79,70,229,0.2)] opacity-85">
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <div className="flex flex-wrap gap-[0.5rem] mb-[0.75rem]">
            {RECRUITER_PROMPTS.map((prompt) => (
              <button
                className="bg-white border border-[#e2e8f0] text-[#4f46e5] py-[0.4rem] px-[0.85rem] rounded-full text-[0.72rem] font-medium cursor-pointer transition-all duration-200 hover:border-[#4f46e5] hover:bg-[rgba(79,70,229,0.08)] disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={state.isReplying || isUnavailable}
                key={prompt}
                onClick={() => send(prompt, 'quick_prompt')}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-[0.75rem] mt-auto">
            <form className="bg-white border border-[#e2e8f0] rounded-full py-[0.5rem] pr-[0.5rem] pl-[1.5rem] flex items-center shadow-[0_4px_20px_rgba(15,23,42,0.04)]" onSubmit={handleSubmit}>
              <textarea
                className="flex-1 border-none outline-none text-[0.88rem] text-[#0f172a] bg-transparent py-[0.5rem] resize-none font-inherit placeholder:text-[#64748b]"
                aria-label="Ask the candidate AI"
                disabled={isUnavailable || state.isLoading || state.isReplying}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${profile?.displayName ?? 'Jordan'} anything...`}
                rows={1}
                value={composer}
              />
              <button
                className="w-[40px] h-[40px] bg-[#4f46e5] text-white rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-200 flex-shrink-0 hover:bg-[#4338ca] hover:scale-[1.04] disabled:bg-[#cbd5e1] disabled:cursor-not-allowed"
                disabled={
                  isUnavailable ||
                  state.isLoading ||
                  state.isReplying ||
                  !composer.trim()
                }
                type="submit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div className="flex items-center justify-center gap-[0.35rem] text-[0.68rem] text-[#64748b] text-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a8a29e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              AI generated response based on verified career history
            </div>
          </div>
        </main>

        <aside className="flex flex-col gap-[1.5rem]">
          {/* Profile Card */}
          <div className="bg-white border border-[#e2e8f0] rounded-[20px] p-[2rem_1.5rem] shadow-[0_10px_30px_rgba(15,23,42,0.04)] flex flex-col items-center text-center">
            <div className="mb-[1.25rem]">
              <div className="w-[96px] h-[96px] rounded-full border-[2.5px] border-[#4f46e5] p-[3px] flex items-center justify-center bg-white">
                <img
                  className="w-full h-full rounded-full object-cover"
                  src={
                    profile?.imageUrl ??
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName ?? 'C')}&background=4f46e5&color=fff&size=150&bold=true`
                  }
                  alt={profile?.displayName ?? 'Candidate avatar'}
                  onError={(e) => {
                    const target = e.currentTarget
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName ?? 'C')}&background=4f46e5&color=fff&size=150&bold=true`
                  }}
                />
              </div>
            </div>
            <h2 className="font-inter text-[1.35rem] font-extrabold text-[#0f172a] mb-[0.25rem]">{profile?.displayName ?? 'Candidate AI'}</h2>
            <p className="text-[0.84rem] text-[#64748b] mb-[1.5rem] leading-[1.4]">{profile?.headline ?? 'Software Engineer'}</p>

            {profile?.targetRoles && profile.targetRoles.length > 0 && (
              <>
                <span className="self-start text-[0.68rem] font-bold text-[#64748b] uppercase tracking-[0.08em] mb-[0.75rem]">Key Expertise</span>
                <div className="flex flex-wrap gap-[0.5rem] justify-center mb-[1.75rem] w-full">
                  {profile.targetRoles.map((role, idx) => (
                    <span key={idx} className="bg-[rgba(79,70,229,0.08)] text-[#4f46e5] py-[0.35rem] px-[0.75rem] rounded-full text-[0.72rem] font-semibold">
                      {role}
                    </span>
                  ))}
                </div>
              </>
            )}

            <div className="flex flex-col gap-[0.75rem] w-full">
              <button className="inline-flex items-center justify-center gap-[0.5rem] bg-white text-[#0f172a] border border-[#e2e8f0] py-[0.75rem] px-[1rem] rounded-[12px] text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5e1]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Resume
              </button>
              <button className="inline-flex items-center justify-center gap-[0.5rem] bg-[#4f46e5] text-white border-none py-[0.75rem] px-[1rem] rounded-[12px] text-[0.82rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#4338ca]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="bg-[#0d0e12] text-[#e2e8f0] rounded-[20px] p-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex flex-col gap-[0.75rem]">
            <div className="flex items-center gap-[0.5rem] text-[#f1f5f9]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <h3 className="font-inter text-[0.92rem] font-bold">AI Insights</h3>
            </div>
            <p className="text-[0.78rem] leading-[1.6] text-[#94a3b8] [&_strong]:text-white [&_strong]:font-semibold">
              {profile?.displayName ?? 'Jordan'} is currently in high demand with{' '}
              <strong>4 active interview cycles</strong>. His expertise in{' '}
              {profile?.targetRoles?.[0] || "Vercel's Edge architecture"} is a rare{' '}
              <strong>0.1% skill match</strong> for your open Lead role.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

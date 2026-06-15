import { useAuth } from '@clerk/react'
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Socket } from 'socket.io-client'

import { EmptyState } from '../components/ui/EmptyState'
import { isClerkConfigured } from '../auth/clerk'
import {
  approveCandidateStory,
  connectCandidateSocket,
  fetchCandidateChatState,
  type CandidateChatState,
  type ChatMessage,
} from '../lib/chat'
import { trackPostHogEvent } from '../lib/posthog'


const QUICK_PROMPTS = [
  'Turn my last role into a STAR story',
  'Push me on the result',
  'What recruiter follow-up would you ask?',
  'Help me position my next role',
]

const isUserMessage = (message: ChatMessage) => message.role === 'candidate'

export const ChatPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const hasTrackedLoad = useRef(false)
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

  useEffect(() => {
    if (!state.data || hasTrackedLoad.current) {
      return
    }

    hasTrackedLoad.current = true
    trackPostHogEvent('candidate_chat_loaded', {
      approved_story_count: state.data.stories.filter((story) => story.status === 'approved').length,
      draft_story_count: state.data.stories.filter((story) => story.status === 'draft').length,
      message_count: state.data.messages.length,
    })
  }, [state.data])

  const send = (text: string, source: 'freeform' | 'quick_prompt' = 'freeform') => {
    const trimmed = text.trim()
    if (!trimmed || state.isReplying) return
    const socket = socketRef.current
    if (!socket || !socket.connected) {
      trackPostHogEvent('candidate_message_send_failed', {
        reason: 'socket_disconnected',
        source,
      })
      setState((current) => ({
        ...current,
        error: 'Disconnected. Refresh and try again.',
      }))
      return
    }

    trackPostHogEvent('candidate_message_sent', {
      approved_story_count: state.data?.stories.filter((story) => story.status === 'approved').length ?? 0,
      draft_story_count: state.data?.stories.filter((story) => story.status === 'draft').length ?? 0,
      message_length: trimmed.length,
      source,
    })
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
      trackPostHogEvent('candidate_story_approved', {
        story_id: storyId,
      })
      setState((current) => ({ ...current, approvingId: null, data: next }))
    } catch (error) {
      trackPostHogEvent('candidate_story_approve_failed', {
        message: error instanceof Error ? error.message : 'Approve failed.',
      })
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
    <div className="min-h-screen bg-[#090b16] text-white font-inter flex flex-col">
      <header className="h-[60px] bg-[#0f1225] border-b border-white/8 flex items-center justify-between px-[1.5rem] sticky top-0 z-50">
        <Link className="font-inter text-[1rem] font-extrabold text-white no-underline tracking-[-0.02em] flex items-center gap-[0.6rem]" to="/dashboard">
          ChatResumes
          <div className="bg-[#6366f1]/15 text-[#6366f1] border border-[#6366f1]/25 rounded-full py-[0.2rem] px-[0.6rem] text-[0.62rem] font-bold uppercase tracking-[0.06em]">AI Training Studio ⚡</div>
        </Link>
        <div className="flex items-center">
          <Link className="inline-flex items-center text-[0.78rem] text-white/55 no-underline transition-colors duration-200 hover:text-white" to="/dashboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Dashboard
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-0 flex-1">
        <aside className="bg-[#0f1225] border-r border-white/8 p-[1.25rem] flex flex-col gap-[1.5rem] overflow-y-auto">
          <div className="flex flex-col gap-[0.75rem]">
            <div className="flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/40">
              Draft Stories
              <span className="bg-white/6 text-white/55 rounded-full py-[0.1rem] px-[0.45rem] text-[0.68rem] font-semibold">{drafts.length}</span>
            </div>
            {drafts.length === 0 ? (
              <div className="text-[0.74rem] text-white/40 text-center py-[0.75rem]">No drafts yet. Chat with the AI to extract one!</div>
            ) : (
              drafts.map((story) => (
                <div className="bg-white/4 border border-white/8 rounded-[10px] p-[0.85rem] flex flex-col gap-[0.4rem]" key={story.id}>
                  <div className="text-[0.8rem] font-semibold text-white leading-[1.4]">{story.title}</div>
                  <div className="text-[0.7rem] text-white/45 leading-[1.5] italic">{story.result || 'Needs a measurable result.'}</div>
                  <button
                    className="mt-[0.35rem] bg-[#6366f1] text-white border-none rounded-[7px] py-[0.45rem] px-[0.75rem] text-[0.72rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-[#4f46e5] disabled:opacity-55 disabled:cursor-not-allowed"
                    disabled={state.approvingId === story.id}
                    onClick={() => void handleApprove(story.id)}
                  >
                    {state.approvingId === story.id ? 'Approving…' : 'Approve Story'}
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-col gap-[0.75rem]">
            <div className="flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.1em] text-white/40">
              Approved Stories
              <span className="bg-white/6 text-white/55 rounded-full py-[0.1rem] px-[0.45rem] text-[0.68rem] font-semibold">{approved.length}</span>
            </div>
            {approved.length === 0 ? (
              <div className="text-[0.74rem] text-white/40 text-center py-[0.75rem]">
                None approved yet. Approved stories appear on your public link.
              </div>
            ) : (
              approved.map((story) => (
                <div className="bg-[rgba(16,185,129,0.06)] border border-[#10b981]/20 rounded-[10px] p-[0.85rem] flex flex-col gap-[0.4rem]" key={story.id}>
                  <div className="text-[0.8rem] font-semibold text-white leading-[1.4]">{story.title}</div>
                  <div className="text-[0.7rem] text-white/45 leading-[1.5] italic">{story.result}</div>
                  <div className="inline-flex items-center text-[0.66rem] font-bold text-[#10b981] uppercase tracking-[0.06em] mt-[0.2rem]">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Live on Profile
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex flex-col flex-1 p-[1.5rem] overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-[0.5rem] mb-[1.5rem] flex flex-col gap-[1.5rem]">
            <div className="self-center border border-white/10 bg-white/4 py-[0.35rem] px-[1rem] rounded-full text-[0.65rem] text-white/40 tracking-[0.08em] font-medium mb-[0.5rem] text-center">
              TRAIN YOUR AI VOICE BY DESCRIBING YOUR REAL CAREER WINS
            </div>

            {state.error ? (
              <div className="text-[0.74rem] text-[#ef4444] text-center my-[1rem]">{state.error}</div>
            ) : null}

            {state.isLoading && !state.data ? (
              <div className="text-[0.74rem] text-white/40 text-center my-[1rem]">Loading chat studio…</div>
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
                  <div key={message.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[82%] ${isUser ? 'self-end' : 'self-start'}`}>
                    <div className={`text-[0.68rem] font-semibold mb-[0.35rem] ${isUser ? 'text-white/40 text-right mr-[0.2rem]' : 'text-[#6366f1] flex items-center gap-[0.25rem] ml-[0.2rem]'}`}>
                      {isUser ? (
                        'You (Candidate)'
                      ) : (
                        <>
                          AI Voice Coach
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </>
                      )}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }} className={isUser ? 'bg-[#6366f1] text-white py-[0.85rem] px-[1.1rem] rounded-[16px_16px_4px_16px] text-[0.86rem] leading-[1.6]' : 'bg-[#1a1d35] text-white/90 border border-white/8 py-[0.85rem] px-[1.1rem] rounded-[16px_16px_16px_4px] text-[0.86rem] leading-[1.6]'}>
                      {message.content}
                    </div>
                  </div>
                )
              })
            )}

            {state.isReplying ? (
              <div className="flex flex-col items-start self-start max-w-[82%]">
                <div className="text-[0.68rem] font-semibold mb-[0.35rem] text-[#6366f1] flex items-center gap-[0.25rem] ml-[0.2rem]">
                  AI Voice Coach
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div className="bg-[#1a1d35] text-white/90 border border-white/8 py-[0.85rem] px-[1.1rem] rounded-[16px_16px_16px_4px] text-[0.86rem] leading-[1.6] opacity-85">
                  Thinking…
                </div>
              </div>
            ) : null}
            <div ref={threadEndRef} />
          </div>

          <div className="flex flex-wrap gap-[0.5rem] mb-[0.75rem]">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                className="bg-white/5 border border-white/10 text-[#6366f1] py-[0.4rem] px-[0.85rem] rounded-full text-[0.72rem] font-medium cursor-pointer transition-all duration-200 hover:border-[#6366f1]/50 hover:bg-[#6366f1]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={state.isReplying}
                key={prompt}
                onClick={() => send(prompt, 'quick_prompt')}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-[0.65rem]">
            <form className="bg-[#1a1d35] border border-white/10 rounded-full py-[0.5rem] pr-[0.5rem] pl-[1.5rem] flex items-center" onSubmit={handleSubmit}>
              <textarea
                className="flex-1 border-none outline-none text-[0.88rem] text-white bg-transparent py-[0.5rem] resize-none font-inherit placeholder:text-white/35"
                aria-label="Message"
                disabled={state.isLoading || state.isReplying}
                onChange={(event) => setComposer(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell the AI what happened at your role…"
                rows={1}
                value={composer}
              />
              <button
                className="w-[38px] h-[38px] bg-[#6366f1] text-white rounded-full flex items-center justify-center cursor-pointer border-none transition-all duration-200 flex-shrink-0 hover:bg-[#4f46e5] disabled:bg-white/15 disabled:cursor-not-allowed"
                disabled={state.isLoading || state.isReplying || !composer.trim()}
                type="submit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div className="flex items-center justify-center gap-[0.35rem] text-[0.66rem] text-white/35 text-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-white/25">
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

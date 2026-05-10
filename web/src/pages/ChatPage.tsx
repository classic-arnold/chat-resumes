import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type MessageSide = 'candidate' | 'ai'

type ChatMessage = {
  id: number
  author: string
  body: string
  side: MessageSide
}

type QuickPrompt = {
  label: string
  question: string
}

const starterMessages: Omit<ChatMessage, 'id'>[] = [
  {
    author: 'ChatResumes AI Coach',
    body: 'Let’s build a recruiter-ready story bank. Start with the strongest leadership example you want your AI resume to use in interviews.',
    side: 'ai',
  },
  {
    author: 'Candidate · You',
    body: 'The strongest one is the 14-person Vercel rebrand. I led the rollout across design, product, engineering, and brand, and we shipped three weeks early.',
    side: 'candidate',
  },
  {
    author: 'ChatResumes AI Coach',
    body: 'Good anchor. I already have the situation and rough result. What was breaking before you stepped in, what decision did you personally own, and how did you keep the teams aligned?',
    side: 'ai',
  },
  {
    author: 'Candidate · You',
    body: 'The launch dates were conflicting, the design system was drifting, and leadership wanted one narrative. I owned the rollout plan, stakeholder alignment, and the decision framework that got everyone to commit.',
    side: 'candidate',
  },
]

const quickPrompts: QuickPrompt[] = [
  {
    label: 'Turn this into STAR',
    question: 'Help me turn the Vercel rebrand into a sharper STAR story.',
  },
  {
    label: 'Push on the result',
    question: 'Help me tighten the measurable result and before-versus-after impact.',
  },
  {
    label: 'Ask a better follow-up',
    question: 'Ask me the hardest follow-up question a recruiter would care about here.',
  },
  {
    label: 'Position my next role',
    question: 'Help me explain what kind of staff-level role I want next and why I am credible for it.',
  },
]

const knowledgeFacts = [
  '14-person cross-functional team leadership',
  'Shipped a major rebrand 3 weeks early',
  'Strong in design systems, product strategy, and stakeholder alignment',
  'Targeting staff-level design leadership roles with real ownership',
]

const storyDrafts = [
  'Vercel rebrand: situation and task captured, needs harder business impact.',
  'Design systems leadership: need one story with a clearer metric and team scope.',
  'Next-role positioning: needs a tighter explanation of desired scope and leverage.',
]

const replyLibrary = [
  {
    keywords: ['star', 'story', 'rebrand', 'brand'],
    reply:
      'Good. Let’s force the STAR shape. Situation: what was broken or at risk? Task: what outcome were you accountable for? Action: what did you personally decide or drive? Result: what changed, preferably with a number?',
  },
  {
    keywords: ['result', 'impact', 'metric', 'measure', 'before', 'after'],
    reply:
      'The result is still too soft. Give me the before state, the change you created, and one proof point such as time saved, launch acceleration, adoption, revenue impact, or leadership confidence gained.',
  },
  {
    keywords: ['stakeholder', 'alignment', 'conflict', 'pushback'],
    reply:
      'That is usually the part recruiters remember. Name the conflicting stakeholders, what each side wanted, the tradeoff you made, and why your decision was the right one under pressure.',
  },
  {
    keywords: ['role', 'next', 'staff', 'scope'],
    reply:
      'Phrase it as positioning, not preference. Describe the scope you want next, the kinds of problems you want to own, and the strongest evidence from your past that makes that move credible now.',
  },
  {
    keywords: ['culture', 'team', 'collaboration'],
    reply:
      'Great. Give me one concrete example of the team environment that brings out your best work and one environment that slows you down. Your AI should answer culture-fit questions with specifics, not slogans.',
  },
]

const getAiReply = (question: string) => {
  const normalizedQuestion = question.toLowerCase()
  const matchedReply = replyLibrary.find(({ keywords }) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  )

  return (
    matchedReply?.reply ??
    'That is a usable start, but it still reads like a resume bullet. Add the tension, your exact action, and the outcome so your AI can answer like someone who actually lived the story.'
  )
}

export const ChatPage = () => {
  const nextMessageId = useRef(starterMessages.length + 1)
  const replyTimerRef = useRef<number | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    starterMessages.map((message, index) => ({
      ...message,
      id: index + 1,
    })),
  )
  const [composerValue, setComposerValue] = useState('')
  const [isReplying, setIsReplying] = useState(false)

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [isReplying, messages])

  useEffect(
    () => () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current)
      }
    },
    [],
  )

  const appendMessage = (message: Omit<ChatMessage, 'id'>) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        ...message,
        id: nextMessageId.current,
      },
    ])
    nextMessageId.current += 1
  }

  const sendQuestion = (question: string) => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || isReplying) {
      return
    }

    appendMessage({
      author: 'Candidate · You',
      body: trimmedQuestion,
      side: 'candidate',
    })
    setComposerValue('')
    setIsReplying(true)

    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
    }

    replyTimerRef.current = window.setTimeout(() => {
      appendMessage({
        author: 'ChatResumes AI Coach',
        body: getAiReply(trimmedQuestion),
        side: 'ai',
      })
      setIsReplying(false)
      replyTimerRef.current = null
    }, 700)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendQuestion(composerValue)
  }

  const handlePromptClick = (prompt: QuickPrompt) => {
    sendQuestion(prompt.question)
  }

  return (
    <div className="chat-page">
      <nav className="chat-nav">
        <Link className="logo" to="/">
          <div className="logo-icon">💬</div>
          Chat<span>Resumes</span>
        </Link>
        <div className="chat-nav-actions">
          <Link className="btn-nav-ghost" to="/dashboard">
            Back To Dashboard
          </Link>
          <Link className="btn-nav-solid" to="/pricing">
            View Plan
          </Link>
        </div>
      </nav>

      <main className="chat-layout">
        <section className="chat-sidebar-card">
          <div className="chat-sidebar-panel chat-sidebar-panel-primary">
            <div className="chat-profile-badge">Private Candidate Chat</div>
            <div className="chat-profile-header">
              <div className="chat-profile-avatar">AI</div>
              <div>
                <h1 className="chat-profile-name">Author Your AI Resume</h1>
                <p className="chat-profile-role">Private coaching session · nothing here is public until you approve it</p>
              </div>
            </div>
            <p className="chat-profile-summary">
              Use this workspace to turn raw experience into recruiter-ready STAR
              stories, stronger positioning, and approved facts for your public AI link.
            </p>
            <div className="chat-profile-url">Private workspace · visible only to you</div>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">What your AI knows so far</div>
            <ul className="chat-fact-list">
              {knowledgeFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">Stories in progress</div>
            <ul className="chat-fact-list">
              {storyDrafts.map((story) => (
                <li key={story}>{story}</li>
              ))}
            </ul>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">Suggested prompts</div>
            <div className="chat-prompt-list">
              {quickPrompts.map((prompt) => (
                <button
                  className="chat-prompt-chip"
                  disabled={isReplying}
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
              <div className="chat-conversation-title">Candidate Authoring Session</div>
              <div className="chat-conversation-status">
                <div className="status-dot" />
                Private coaching mode for STAR stories and positioning
              </div>
            </div>
            <div className="chat-conversation-pill">1 draft story active</div>
          </div>

          <div className="chat-thread">
            {messages.map((message) => (
              <div className={`chat-message ${message.side}`} key={message.id}>
                <div className="chat-message-author">{message.author}</div>
                <div className="chat-message-bubble">{message.body}</div>
              </div>
            ))}
            {isReplying ? (
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
              aria-label="Tell your AI about your work"
              className="chat-composer-input"
              disabled={isReplying}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder="Tell the AI what happened, what you owned, the hard part, or the result..."
              type="text"
              value={composerValue}
            />
            <button
              className="chat-send-btn chat-composer-send"
              disabled={isReplying || !composerValue.trim()}
              type="submit"
            >
              {isReplying ? 'Thinking...' : 'Send →'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
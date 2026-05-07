import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

type MessageSide = 'recruiter' | 'ai'

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
    author: 'Recruiter · Sarah M.',
    body: 'Hi Jordan. I saw your background in product design systems. What kind of team do you do your best work with?',
    side: 'recruiter',
  },
  {
    author: 'Jordan\'s AI',
    body: 'Jordan thrives on high-context, low-ego teams where design, product, and engineering are in the same conversation early. Their best work usually comes from ambiguous problems with clear ownership.',
    side: 'ai',
  },
  {
    author: 'Recruiter · Sarah M.',
    body: 'That tracks. What is the strongest example of leadership they would want me to know about?',
    side: 'recruiter',
  },
  {
    author: 'Jordan\'s AI',
    body: 'Jordan led a 14-person cross-functional rebrand at Vercel and shipped it three weeks early. The notable part was not just delivery speed, but how they aligned conflicting priorities without creating drag across the team.',
    side: 'ai',
  },
]

const quickPrompts: QuickPrompt[] = [
  {
    label: 'Ask about leadership',
    question: 'What is the strongest example of leadership Jordan would want a recruiter to know about?',
  },
  {
    label: 'Ask about product sense',
    question: 'How does Jordan balance product thinking, design craft, and business impact?',
  },
  {
    label: 'Ask about ideal next role',
    question: 'What does Jordan want in an ideal next role?',
  },
  {
    label: 'Ask about team culture',
    question: 'What kind of team culture helps Jordan do their best work?',
  },
]

const profileFacts = [
  '14-person cross-functional team leadership',
  'Shipped a major rebrand 3 weeks early',
  'Design systems, product strategy, and storytelling',
  'Open to staff-level design and product design leadership roles',
]

const replyLibrary = [
  {
    keywords: ['leadership', 'lead', 'manage'],
    reply:
      'Jordan leads by lowering ambiguity for the team. A strong example is the 14-person rebrand they ran at Vercel, where they aligned product, engineering, and brand stakeholders early enough to ship three weeks ahead of schedule without burning trust.',
  },
  {
    keywords: ['product', 'business', 'impact', 'craft', 'design'],
    reply:
      'Jordan tends to connect design craft to business outcomes quickly. Their pattern is to frame the product decision, prototype the riskiest path first, and then use the design system to scale the winning direction without adding delivery drag.',
  },
  {
    keywords: ['role', 'next', 'ideal'],
    reply:
      'Jordan is strongest in staff-level product design or design leadership roles where the scope is ambiguous, the stakes are real, and they can shape both the system and the story. They want ownership, cross-functional access, and a team that values judgment over theater.',
  },
  {
    keywords: ['culture', 'team', 'collaboration'],
    reply:
      'The best fit is a high-context, low-ego team. Jordan does their best work where design, product, and engineering are in the same room early, feedback is direct, and strong opinions are used to sharpen decisions instead of slowing them down.',
  },
]

const getAiReply = (question: string) => {
  const normalizedQuestion = question.toLowerCase()
  const matchedReply = replyLibrary.find(({ keywords }) =>
    keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  )

  return (
    matchedReply?.reply ??
    'Jordan would answer that with a concrete story, the team context, and the business result. The short version is that they are strongest when translating ambiguity into clear product and design decisions that move teams forward.'
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
      author: 'Recruiter · You',
      body: trimmedQuestion,
      side: 'recruiter',
    })
    setComposerValue('')
    setIsReplying(true)

    if (replyTimerRef.current !== null) {
      window.clearTimeout(replyTimerRef.current)
    }

    replyTimerRef.current = window.setTimeout(() => {
      appendMessage({
        author: 'Jordan\'s AI',
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
          <Link className="btn-nav-ghost" to="/">
            Back To Landing
          </Link>
          <Link className="btn-nav-solid" to="/dashboard">
            View Dashboard
          </Link>
        </div>
      </nav>

      <main className="chat-layout">
        <section className="chat-sidebar-card">
          <div className="chat-sidebar-panel chat-sidebar-panel-primary">
            <div className="chat-profile-badge">Live Recruiter View</div>
            <div className="chat-profile-header">
              <div className="chat-profile-avatar">JH</div>
              <div>
                <h1 className="chat-profile-name">Jordan Hayes</h1>
                <p className="chat-profile-role">AI Resume · Product Design Leader</p>
              </div>
            </div>
            <p className="chat-profile-summary">
              A recruiter-ready AI profile that answers questions with Jordan&apos;s
              voice, priorities, and strongest career stories.
            </p>
            <div className="chat-profile-url">chatresumes.io/jordan-hayes</div>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">What recruiters learn fast</div>
            <ul className="chat-fact-list">
              {profileFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          </div>

          <div className="chat-sidebar-panel chat-sidebar-panel-soft">
            <div className="chat-section-title">Suggested questions</div>
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
              <div className="chat-conversation-title">Recruiter Conversation</div>
              <div className="chat-conversation-status">
                <div className="status-dot" />
                Live demo of Jordan&apos;s AI resume
              </div>
            </div>
            <div className="chat-conversation-pill">4 min avg session</div>
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
              aria-label="Ask Jordan a question"
              className="chat-composer-input"
              disabled={isReplying}
              onChange={(event) => setComposerValue(event.target.value)}
              placeholder="Ask Jordan about impact, leadership, culture fit, or next-role goals..."
              type="text"
              value={composerValue}
            />
            <button
              className="chat-send-btn chat-composer-send"
              disabled={isReplying || !composerValue.trim()}
              type="submit"
            >
              {isReplying ? 'Replying...' : 'Send ↗'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
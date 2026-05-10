import { Link } from 'react-router-dom'

const tickerItems = [
  'Recruiters now expect a ChatResumes link',
  'Top candidates are already live — are you?',
  "Don't get passed over for being a static PDF",
  'Interviews happen to those who stand out first',
  'Your link is your edge — claim it before someone else does',
]

const stats = [
  {
    label: 'Average time a recruiter\nspends on a static resume',
    prefix: '7',
    suffix: 's',
  },
  {
    label: 'More likely to get a callback\nwith a chat link on your resume',
    prefix: '4',
    suffix: '×',
  },
  {
    label: 'Your AI answers recruiters\neven while you sleep',
    prefix: '24',
    suffix: '/7',
  },
]

const steps = [
  {
    description:
      "We ask you what recruiters always want to know — your story, superpowers, and goals — to craft your AI's personality around your real voice.",
    icon: '📋',
    number: '01',
    title: 'Answer 5 Questions',
  },
  {
    description:
      'Drop your resume PDF and a short bio document. Our AI digests everything — experience, skills, achievements — until it knows you inside-out.',
    icon: '📄',
    number: '02',
    title: 'Upload Your Docs',
  },
  {
    description:
      'Within 60 seconds, your personal AI chatbot is trained and live. It answers questions exactly as you would — only faster and always available.',
    icon: '⚡',
    number: '03',
    title: 'AI Goes Live',
  },
  {
    description:
      'You get a permanent URL at chatresumes.io/yourname. Add it to your resume header, LinkedIn, and email sig — and let it do the work.',
    icon: '🔗',
    number: '04',
    title: 'Share Your Link',
  },
]

const questions = [
  {
    category: 'Identity',
    hint:
      "This becomes the core of your AI's personality. Be real, be human — this is your headline pitch that no bullet point can replace.",
    number: 'Question 01',
    text: "If a recruiter had 60 seconds with you, what would you want them to walk away knowing — that your resume simply can't convey?",
  },
  {
    category: 'Impact',
    hint:
      'Not just the metric — the meaning. Recruiters remember stories, not spreadsheets. Your AI will tell this compellingly on your behalf.',
    number: 'Question 02',
    text: "What's the single most meaningful thing you've achieved in your career, and why did it matter to you?",
  },
  {
    category: 'Superpower',
    hint:
      "Your hidden edge — the skill that isn't obvious on paper. This is what sets you apart from candidates with identical CVs.",
    number: 'Question 03',
    text: 'What do colleagues consistently come to you for that surprises people when they first find out?',
  },
  {
    category: 'Direction',
    hint:
      'Recruiters use this to qualify you for the right roles instantly. Be specific — vague answers train vague AI.',
    number: 'Question 04',
    text: 'What does your ideal next role look like, and what kind of team culture makes you do your best work?',
  },
  {
    category: 'Closer',
    hint:
      "Your mic-drop moment. The thing you've always wanted a chance to say. Your AI will deploy this at exactly the right moment.",
    number: 'Question 05',
    text: "What's one question you wish every recruiter would ask you — and what's your answer?",
  },
]

const urgencyPoints = [
  {
    body:
      'Forward-thinking hiring managers flag ChatResumes links as high-engagement candidates. Without one, you are invisible before you are even seen.',
    icon: '📬',
    title: 'Recruiters are already asking for it',
  },
  {
    body:
      "While you're with Company A, your link is fielding questions from B, C, and D simultaneously. Unfair advantage? Absolutely.",
    icon: '⚡',
    title: 'Your AI works while you interview elsewhere',
  },
  {
    body:
      "chatresumes.io/yourname is first-come, first-served. Someone with your name could take it. Don't find out the hard way.",
    icon: '🔒',
    title: 'Your URL is yours forever — once claimed',
  },
]

export const LandingPage = () => (
  <div className="landing-page">
    <nav className="site-nav">
      <Link className="logo" to="/">
        <div className="logo-icon">💬</div>
        Chat<span>Resumes</span>
      </Link>
      <div className="nav-links">
        <a className="nav-link" href="#how-it-works">
          How It Works
        </a>
        <a className="nav-link" href="#questions">
          The Questions
        </a>
        <a className="nav-link" href="#fomo">
          Why Now
        </a>
      </div>
      <div className="nav-actions">
        <Link className="btn-nav-ghost" to="/login">
          Log In
        </Link>
        <Link className="btn-nav-solid" to="/pricing">
          See Pricing →
        </Link>
      </div>
    </nav>

    <main>
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-dots" />
        <div className="hero-left">
          <div className="hero-eyebrow">
            <div className="eyebrow-dot" />
            Now Live — Claim Your Link Today
          </div>
          <h1 className="hero-headline">
            <div className="line">
              <span>Your resume,</span>
            </div>
            <div className="line">
              <span className="italic-serif">now alive.</span>
            </div>
            <div className="line">
              <span className="blue-word">Always on.</span>
            </div>
          </h1>
          <p className="hero-sub">
            Stop being a PDF in a pile of PDFs. ChatResumes turns your
            experience into an intelligent AI that answers recruiter questions
            24/7 — as if you were sitting right across the table.
          </p>
          <div className="hero-ctas">
            <Link className="btn-primary-blue" to="/pricing">
              See Launch Pricing ↗
            </Link>
            <a className="btn-outline-blue" href="#how-it-works">
              See how it works
            </a>
          </div>
          <div className="hero-url-row">
            <div className="url-chip">
              🔗 chatresumes.io/<strong>yourname</strong>
              <span className="blink">_</span>
            </div>
            <span className="url-note">Your permanent recruiter-ready link</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-chat-card">
            <div className="chat-card-header">
              <div className="chat-avatar">JH</div>
              <div>
                <div className="chat-card-name">Jordan Hayes — AI Resume</div>
                <div className="chat-card-status">
                  <div className="status-dot" />
                  Online · chatresumes.io/jordan-hayes
                </div>
              </div>
            </div>
            <div className="chat-card-body">
              <div className="cmsg r">
                <div className="cmsg-who">Recruiter · Sarah M.</div>
                <div className="cmsg-bubble">
                  Hi! Can you tell me about Jordan&apos;s leadership experience?
                </div>
              </div>
              <div className="cmsg ai">
                <div className="cmsg-who">Jordan&apos;s AI</div>
                <div className="cmsg-bubble">
                  Absolutely! Jordan led a 14-person cross-functional team at
                  Vercel, shipping a full rebrand 3 weeks ahead of schedule.
                  They genuinely thrive in high-ambiguity situations — it&apos;s
                  where their best thinking happens.
                </div>
              </div>
              <div className="cmsg r">
                <div className="cmsg-who">Recruiter · Sarah M.</div>
                <div className="cmsg-bubble">
                  Impressive. What&apos;s Jordan looking for next?
                </div>
              </div>
              <div className="typing-row">
                <div className="tdot" />
                <div className="tdot" />
                <div className="tdot" />
              </div>
            </div>
            <div className="chat-card-footer">
              <div className="chat-input-fake">Ask anything about Jordan...</div>
              <button className="chat-send-btn" type="button">
                ↑
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="fomo-strip">
        <div className="fomo-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div className="fomo-item" key={`${item}-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="stats-row">
        {stats.map((stat) => (
          <div className="stat-cell" key={stat.label}>
            <div className="stat-num">
              <span>{stat.prefix}</span>
              {stat.suffix}
            </div>
            <div className="stat-label">
              {stat.label.split('\n').map((line) => (
                <span className="label-line" key={line}>
                  {line}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <section className="section section-white" id="how-it-works">
        <div className="section-tag">Process</div>
        <h2 className="section-title">
          Up and running
          <br />
          in under 10 minutes.
        </h2>
        <div className="steps-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <div className="step-num-bg">{step.number}</div>
              <div className="step-icon-box">{step.icon}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="questions-section" id="questions">
        <div className="section-tag">The 5 Questions</div>
        <h2 className="section-title">
          We ask the questions
          <br />
          recruiters are{' '}
          <em className="section-emphasis">dying</em>
          {' '}to ask.
        </h2>
        <div className="q-grid">
          {questions.map((question, index) => (
            <div className="q-card" key={question.number}>
              <div className="q-num-badge">{question.number}</div>
              <div className="q-card-tag">{question.category}</div>
              <div className="q-text">{question.text}</div>
              <div className="q-hint">{question.hint}</div>
              {index === 0 ? null : null}
            </div>
          ))}
        </div>
      </section>

      <section className="fomo-section" id="fomo">
        <div>
          <div className="section-tag">Why You Can&apos;t Wait</div>
          <h2 className="fomo-headline">
            The candidates getting hired
            <br />
            aren&apos;t <span className="strike">sending PDFs</span>
            <br />
            anymore.
          </h2>
          <p className="fomo-body">
            The job market has changed. Hiring managers are overwhelmed.
            Recruiters have seconds, not minutes. A ChatResumes link on your
            resume signals you&apos;re different before the conversation even
            starts. Every day without one is a day recruiters choose someone
            else who has it.
          </p>
          <Link className="btn-primary-blue inline-cta" to="/pricing">
            Start My Paid Plan →
          </Link>
        </div>
        <div>
          <ul className="fomo-bullets">
            {urgencyPoints.map((point) => (
              <li key={point.title}>
                <div className="fomo-icon">{point.icon}</div>
                <div>
                  <strong>{point.title}</strong>
                  {point.body}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="footer-logo">
        Chat<span>Resumes</span>
      </div>
      <div className="footer-links">
        <span className="footer-link">Privacy</span>
        <span className="footer-link">Terms</span>
        <Link className="footer-link" to="/login">
          Log In
        </Link>
      </div>
      <div className="footer-text">
        © 2025 ChatResumes · The link that gets you hired.
      </div>
    </footer>
  </div>
)
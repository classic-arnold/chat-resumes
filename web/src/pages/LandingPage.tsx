import { Link } from 'react-router-dom'

import { quizQuestions } from '../lib/quizQuestions'
import chatUi2 from '../assets/chat-ui-2.png'
import pdfUi from '../assets/pdf-ui.png'
import chatUi1 from '../assets/chat-ui-1.png'

const tickerItems = [
  'Recruiters now expect a ChatResumes link',
  'Top candidates are already live — are you?',
  "Don't get passed over for being a static PDF",
  'Interviews happen to those who stand out first',
  'Your link is your edge — claim it before someone else does',
]

const stats = [
  {
    label: 'Average Response\nTime',
    prefix: '7',
    suffix: 's',
  },
  {
    label: 'Callback Rate\nIncrease',
    prefix: '4',
    suffix: '×',
  },
  {
    label: 'Always\nMessaging',
    prefix: '24',
    suffix: '/7',
  },
]

const steps = [
  {
    description:
      "We ask you what recruiters always want to know — your story, superpowers, and goals — to craft your AI's personality around your real voice.",
    number: '1',
    title: 'Answer Questions',
  },
  {
    description:
      'Drop your resume PDF and a short bio document. Our AI digests everything — experience, skills, achievements — until it knows you inside-out.',
    number: '2',
    title: 'Upload Your Docs',
  },
  {
    description:
      'Within 60 seconds, your personal AI chatbot is trained and live. It answers questions exactly as you would — only faster and always available.',
    number: '3',
    title: 'AI Goes Live',
  },
  {
    description:
      'You get a permanent URL at chatresumes.io/yourname. Add it to your resume header, LinkedIn, and email sig — and let it do the work.',
    number: '4',
    title: 'Share Your Link',
  },
]

const questions = quizQuestions

const pricingFeatures = [
  { text: 'Personal AI chatbot trained on your experience' },
  { text: 'Custom ', bold: 'chatresumes.io/your-name', text2: ' URL' },
  { text: 'Recruiter engagement analytics' },
  { text: 'Dynamic tone adjustment for different roles' },
  { text: 'Static PDF export & backup' },
]

const testimonials = [
  {
    stars: 5,
    quote: "“I was applying for senior roles for months with no luck. Within two weeks of switching to ChatResumes, I had three interviews. Recruiters love that they can just ask my AI if I have specific tech stack experience.”",
    name: "Jordan Smith",
    role: "Senior Frontend Engineer",
    initials: "JS",
    color: "#e0e7ff"
  },
  {
    stars: 5,
    quote: "“The analytics are a game changer. Seeing which companies are actually interacting with my profile let me focus my follow-ups. I landed my dream PM role at a Series B startup.”",
    name: "Alex Martinez",
    role: "Product Manager",
    initials: "AM",
    color: "#dbeafe"
  },
  {
    stars: 5,
    quote: "“The PDF export looks better than any template I found elsewhere, and the AI chatbot feels like I have a 24/7 personal assistant handling initial recruiter screens for me.”",
    name: "Sarah Chen",
    role: "Data Scientist",
    initials: "SC",
    color: "#f3e8ff"
  }
]

const faqItems = [
  {
    question: "Will recruiters actually use this?",
    answer: "Yes. In our testing, recruiters spend 3x longer interacting with a ChatResumes compared to a static PDF. It allows them to ask exactly what they need to know, instantly."
  },
  {
    question: "Can it hallucinate my experience?",
    answer: "No. The AI is strictly constrained to the source material you provide. It will proudly state 'I don't have that information in my profile' rather than invent experience."
  },
  {
    question: "What if I need a traditional PDF?",
    answer: "We've got you covered. Your Pro account includes a beautifully formatted, ATS-friendly static PDF export that syncs automatically with your chat data."
  },
  {
    question: "How do the analytics work?",
    answer: "You'll see which companies are viewing your profile, what questions they are asking the AI, and how long they spend engaged with your history."
  }
]

export const LandingPage = () => (
  <div className="lp-root">
    {/* NAV */}
    <nav className="lp-nav">
      <Link className="lp-logo" to="/">
        <span className="lp-logo-icon">💬</span>
        ChatResumes
      </Link>
      <div className="lp-nav-links">
        <a className="lp-nav-link" href="#how-it-works">How it works</a>
        <a className="lp-nav-link" href="#pricing">Pricing</a>
      </div>
      <Link className="lp-btn-cta" to="/pricing">Claim My URL →</Link>
    </nav>

    <main>
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-ticker-mini uppercase">
            <span className="lp-ticker-dot" />
            recruiters are already clicking these links
          </div>
          <h1 className="lp-hero-h1">
            You're not getting ignored<br />
            because you're<br />
            <span className="lp-hero-accent">being unqualified.</span>
          </h1>
          <p className="lp-hero-sub">
            ChatResumes has let you understand, only a few AI/NLP elements last your
            questions HAP. That's cheaper, far cheaper, than starting a hiring pipeline.
          </p>
          <div className="lp-hero-ctas">
            <Link className="lp-btn-primary" to="/pricing">
              Claim My Link — $19/mo
            </Link>
            <a className="lp-btn-ghost" href="#how-it-works">See how it works</a>
          </div>

          {/* Chat preview card */}
          <img src={chatUi2} alt="Chat preview" className="lp-chat-demo-img" />
        </div>
      </section>

      {/* TICKER STRIP */}
      <div className="lp-fomo-strip">
        <div className="lp-fomo-track">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div className="lp-fomo-item" key={`${item}-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* STOP BEING A PDF */}
      <section className="lp-stop-pdf">
        <div className="lp-stop-pdf-inner">
          <h2 className="lp-section-h2">Stop being a PDF in a pile of PDFs.</h2>
          {/* stop pdf demo */}
          <div className="lp-stop-pdf-demo">
            <div className="lp-pdf-left">
              <div className="lp-pdf-card-label">NOT CHATRESUMES</div>
              <img src={pdfUi} alt="PDF Resume" className="lp-stop-pdf-img" />
            </div>
            <div className="lp-pdf-right">
              <div className="lp-pdf-card-label lp-pdf-card-label-active">✓ WITH CHATRESUMES</div>
              <img src={chatUi1} alt="Chat UI Resume" className="lp-stop-chat-img" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="lp-stats">
        <div className="lp-stats-inner">
          {stats.map((stat) => (
            <div className="lp-stat-cell" key={stat.label}>
              <div className="lp-stat-num">
                <span className="lp-stat-prefix">{stat.prefix}</span>
                <span className="lp-stat-suffix">{stat.suffix}</span>
              </div>
              <div className="lp-stat-label">
                {stat.label.split('\n').map((line) => (
                  <span className="lp-stat-label-line" key={line}>{line}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="lp-how" id="how-it-works">
        <div className="lp-how-inner">
          <p className="lp-section-eyebrow">How it works</p>
          <h2 className="lp-section-h2 lp-section-h2-light">
            Fast easy access to results within just 5 months.
          </h2>
          <div className="lp-steps">
            {steps.map((step) => (
              <div className="lp-step" key={step.number}>
                <div className="lp-step-num">{step.number}</div>
                <div className="lp-step-body">
                  <div className="lp-step-title">{step.title}</div>
                  <div className="lp-step-desc">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-how-ctas">
            <a className="lp-btn-link" href="#questions">I understand all →</a>
            <a className="lp-btn-link lp-btn-link-muted" href="#pricing">part → more</a>
          </div>
        </div>
      </section>

      {/* INVEST / PRICING */}
      <section className="lp-pricing" id="pricing">
        <div className="lp-pricing-inner">
          <h2 className="lp-section-h2 lp-section-h2-dark">Invest in your career.<br />One simple price.</h2>
          <p className="lp-pricing-sub">No complex tiers. No hidden fees. Get the ultimate AI-powered resume and interview tool for a single, flat monthly rate.</p>
          
          <div className="lp-pricing-card-split">
            <div className="lp-pricing-card-left">
              <div className="lp-pricing-plan-badge">PRO AI</div>
              <h3 className="lp-pricing-card-title">The Edge</h3>
              <div className="lp-pricing-price">
                <span className="lp-pricing-price-num">$19</span>
                <span className="lp-pricing-price-sub">/mo</span>
              </div>
              <p className="lp-pricing-card-desc">
                Everything you need to stand out, optimized for modern recruiting.
              </p>
              <Link className="lp-btn-primary lp-btn-pricing" to="/pricing">
                Start Your Free Trial
              </Link>
              <p className="lp-pricing-note">
                Cancel anytime. 7-day money-back guarantee.
              </p>
            </div>
            
            <div className="lp-pricing-card-right">
              <ul className="lp-pricing-features">
                {pricingFeatures.map((f, i) => (
                  <li key={i} className="lp-pricing-feature">
                    <span className="lp-pricing-check">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="lp-pricing-feature-text">
                      {f.text}
                      {f.bold && <strong>{f.bold}</strong>}
                      {f.text2}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="lp-testimonials">
        <div className="lp-testimonials-inner">
          <p className="lp-testimonials-eyebrow">REAL CANDIDATES. REAL CALLBACKS.</p>
          <h2 className="lp-section-h2 lp-section-h2-dark">They stopped being a PDF in a pile.</h2>
          
          <div className="lp-testimonials-grid">
            {testimonials.map((t, idx) => (
              <div className="lp-testimonial-card" key={idx}>
                <div className="lp-testimonial-stars">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="lp-star">★</span>
                  ))}
                </div>
                <p className="lp-testimonial-quote">{t.quote}</p>
                <div className="lp-testimonial-user">
                  <div className="lp-testimonial-avatar" style={{ backgroundColor: t.color }}>
                    {t.initials}
                  </div>
                  <div className="lp-testimonial-info">
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-faq" id="faq">
        <div className="lp-faq-inner">
          <h2 className="lp-section-h2 lp-section-h2-white">Common Questions</h2>
          <p className="lp-faq-sub">Everything you need to know about the product and billing.</p>
          
          <div className="lp-faq-grid">
            {faqItems.map((item, idx) => (
              <div className="lp-faq-card" key={idx}>
                <div className="lp-faq-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="lp-faq-content">
                  <h3 className="lp-faq-question">{item.question}</h3>
                  <p className="lp-faq-answer">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* FOOTER */}
    <footer className="lp-footer">
      <div className="lp-footer-logo">ChatResumes</div>
      <div className="lp-footer-links">
        <span className="lp-footer-link">Privacy Policy</span>
        <span className="lp-footer-link">Terms of Service</span>
        <span className="lp-footer-link">Cookie Policy</span>
      </div>
      <div className="lp-footer-copy">© 2024 ChatResumes. All rights reserved.</div>
    </footer>
  </div>
)
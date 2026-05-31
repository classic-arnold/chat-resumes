import { Link } from 'react-router-dom'
import chatUi2 from '../assets/chat-ui-2.png'
import pdfUi from '../assets/pdf-ui.png'
import chatUi1 from '../assets/chat-ui-1.png'
import { ArrowRight } from 'lucide-react'
import beforeImg from '../assets/before.png'
import afterImg from '../assets/after.png'
import overlayImg from '../assets/Overlay.png'
import overlayDarkImg from '../assets/overlay-dark.png'
import linkCopyImg from '../assets/link-copy.png'



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
  <div className="min-h-screen bg-lp-bg text-lp-text font-inter overflow-x-hidden">
    {/* NAV */}
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[2rem] h-[56px] bg-white/90 backdrop-blur-[12px] border-b border-[#e2e8f0]">
      <Link className="flex items-center gap-[0.5rem] font-inter text-[1.05rem] font-extrabold text-[#0f172a] no-underline tracking-[-0.02em]" to="/">
        <span className="text-[1rem]">💬</span>
        ChatResumes
      </Link>
      <div className="hidden md:flex gap-[2rem]">
        <a className="text-[0.82rem] text-[#475569] no-underline transition-colors duration-200 hover:text-[#0f172a]" href="#how-it-works">How it works</a>
        <a className="text-[0.82rem] text-[#475569] no-underline transition-colors duration-200 hover:text-[#0f172a]" href="#pricing">Pricing</a>
      </div>
      <Link className="inline-flex items-center justify-center py-[0.6rem] px-[1.25rem] bg-lp-accent text-white rounded-full text-[0.82rem] font-light no-underline border-none cursor-pointer transition-all duration-200 hover:bg-lp-accent-hover hover:-translate-y-[1px] tracking-[0.01em]" to="/pricing">Claim My Link </Link>
    </nav>

    <main>
      {/* HERO */}
      <section className="py-[100px] px-[2rem] md:py-[80px] md:px-[1.25rem] pb-[4rem] flex justify-center bg-white">
        <div className="max-w-[900px] w-full flex flex-col items-center text-center mt-10">
          <div className="inline-flex items-start gap-[0.5rem] max-w-[62ch] mb-[2rem] py-[0.5rem] px-[0.9rem] bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-[0.65rem] md:text-[0.72rem] text-[#475569] leading-[1.5] uppercase">
            <span className="flex-shrink-0 w-[6px] h-[6px] mt-[4px] bg-[#22C55E] 
            rounded-full animate-lp-pulse" />
            recruiters are already clicking these links
          </div>
          <h1 className="font-inter text-[2.2rem] md:text-[4.5rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0f172a] mb-[1.25rem]">
            You're not getting ignored<br />
            because you're<br />
            <span className="text-lp-accent">unqualified.</span>
          </h1>
          <p className="max-w-[52ch] text-[1.15rem] leading-[1.75] text-[#475569] mb-[2rem]">
            ChatResumes turns your experience into a live AI that answers recruiter
            questions 24/7. Stop sending dead PDFs. Start sending a living portfolio.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-[0.9rem] mb-[3rem] w-full md:w-auto">
            <Link className="w-full md:w-auto inline-flex items-center justify-center py-[0.8rem] px-[1.5rem] bg-lp-accent text-white rounded-full text-[0.82rem] font-semibold no-underline border-none cursor-pointer transition-all duration-200 hover:bg-lp-accent-hover hover:-translate-y-[1px] tracking-[0.01em]" to="/pricing">
              Claim My Link — $19/mo <ArrowRight className="ml-2" />
            </Link>
            <a className="w-full md:w-auto inline-flex items-center justify-center py-[0.8rem] px-[1.5rem] bg-transparent text-[#475569] border border-[#cbd5e1] rounded-full text-[0.82rem] font-medium no-underline cursor-pointer transition-all duration-200 hover:text-[#0f172a] hover:border-[#94a3b8]" href="#how-it-works">See how it works</a>
          </div>

          {/* Chat preview card */}
          <div className='w-full md:mt-10'>
            <h2 className='text-[12px] font-light text-[#6B7280] mb-2 uppercase'>This is what recruiters see...</h2>
            <img src={chatUi2} alt="Chat preview" className="w-full h-auto rounded-[12px] shadow-[0_30px_60px_rgba(15,23,42,0.12),0_12px_24px_rgba(15,23,42,0.04)] animate-lp-fade-up block" />
          </div>
        </div>
      </section>

      {/* TICKER STRIP */}
      {/* <div className="py-[0.85rem] px-0 overflow-hidden bg-white border-t border-b border-[#e2e8f0]">
        <div className="flex w-max animate-lp-marquee">
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <div className="flex items-center gap-[2rem] px-[2rem] py-0 whitespace-nowrap text-[#475569] text-[0.72rem] tracking-[0.1em] uppercase after:content-['◆'] after:text-lp-accent after:text-[0.45rem] after:ml-[2rem]" key={`${item}-${index}`}>
              {item}
            </div>
          ))}
        </div>
      </div> */}

      {/* STOP BEING A PDF */}
      <section className="py-[5rem] px-[2rem] bg-lp-bg2 flex justify-center">
        <div className="max-w-[900px] w-full">
          <h2 className="font-inter text-[1.6rem] md:text-[2.4rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-white text-center mb-[3rem]">Stop being a PDF in a pile of PDFs.</h2>
          {/* stop pdf demo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
            <div>
              <div className="text-[0.65rem] tracking-[0.15em] uppercase text-lp-muted mb-[0.75rem]">NOT CHATRESUMES</div>
              <img src={pdfUi} alt="PDF Resume" className="w-full h-auto rounded-[10px] block border border-white/8 shadow-[0_10px_30px_rgba(0,0,0,0.25)]" />
            </div>
            <div>
              <div className="text-[0.65rem] tracking-[0.15em] uppercase text-lp-green mb-[0.75rem]">✓ WITH CHATRESUMES</div>
              <img src={chatUi1} alt="Chat UI Resume" className="w-full h-auto rounded-[10px] block border border-lp-accent/30 shadow-[0_15px_40px_rgba(91,84,247,0.15)]" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="flex justify-center bg-white border-t border-b border-[#e2e8f0]">
        <div className="max-w-[900px] w-full grid grid-cols-1 md:grid-cols-3">
          {stats.map((stat) => (
            <div className="py-[3rem] px-[2.5rem] md:py-[2rem] md:px-[1.5rem] border-b md:border-b-0 md:border-r border-[#e2e8f0] last:border-b-0 last:border-r-0 text-center" key={stat.label}>
              <div className="font-inter text-[3rem] font-extrabold tracking-[-0.04em] leading-[1] text-[#0f172a] mb-[0.5rem]">
                <span>{stat.prefix}</span>
                <span className="text-lp-accent">{stat.suffix}</span>
              </div>
              <div className="flex flex-col text-[0.7rem] tracking-[0.08em] uppercase text-[#475569] leading-[1.5]">
                {stat.label.split('\n').map((line) => (
                  <span className="block" key={line}>{line}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-[6rem] px-[2rem] flex flex-col items-center bg-white" id="how-it-works">
        <div className="max-w-7xl w-full text-center flex flex-col items-center mb-[5rem]">
          <h2 className="font-inter text-[2.2rem] md:text-[3.5rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0f172a] mb-[1.25rem]">
            From static PDF to<br />interactive AI <span className="text-[#5B54F7]">in minutes.</span>
          </h2>
          <p className="max-w-[64ch] text-[0.88rem] md:text-[1rem] leading-[1.75] text-[#475569] mx-auto mb-[3.5rem]">
            We've simplified the process of turning your professional history into an engaging, 24/7 AI advocate. Here is how we transform your career narrative.
          </p>

          {/* BEFORE & AFTER SHOWCASE CARD */}
          <div className="w-full bg-[#FAFBFD] rounded-[14px] p-[2rem] md:p-[3rem] flex flex-col md:flex-row items-center justify-between gap-[0.5rem]">
            {/* BEFORE (PDF Wireframe Image) */}
            <div className="w-full md:w-[45%] flex justify-center items-center">
              <img src={beforeImg} alt="Before ChatResumes" className="h-[280px] md:h-[400px] object-contain" />
            </div>

            {/* TRANSITION ARROW */}
            <div className="w-[44px] h-[44px] rounded-full bg-[#5B54F7] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(91,84,247,0.3)] shrink-0 transition-transform duration-300 hover:scale-110">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>

            {/* AFTER (AI Active Chat Image) */}
            <div className="w-full md:w-[45%] flex justify-center items-center">
              <img src={afterImg} alt="After ChatResumes" className="h-[280px] md:h-[400px] object-contain" />
            </div>
          </div>
        </div>

        {/* STEP 1: THE INTERVIEW */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-[4rem] items-center mb-[6rem]">
          {/* Left (Visual Mockup Image) */}
          <div className="w-full aspect-[4/3]   flex items-center justify-center relative">
            <img src={overlayImg} alt="The Interview Overlay" className="w-full h-auto" />
          </div>

          {/* Right (Text Content) */}
          <div className="text-left flex flex-col gap-[1.25rem]">
            <span className="text-[#5B54F7] text-[0.75rem] tracking-[0.15em] uppercase font-bold">01 / THE INTERVIEW</span>
            <h3 className="text-[1.8rem] md:text-[2.2rem] font-extrabold text-[#0f172a] tracking-tight">How the AI learns your story.</h3>
            <p className="text-[0.88rem] leading-[1.75] text-[#475569]">
              We don't just scrape text. Our proprietary onboarding agent conducts a dynamic, conversational interview to uncover the nuances of your experience that a bullet point can't capture.
            </p>
            <ul className="flex flex-col gap-[1rem] p-0 m-0 list-none mt-[0.5rem]">
              <li className="text-[0.88rem] text-[#334155] font-medium flex items-center gap-[0.75rem]">
                <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
                  <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                Contextual deep-dives into past projects
              </li>
              <li className="text-[0.88rem] text-[#334155] font-medium flex items-center gap-[0.75rem]">
                <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
                  <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                Extracts leadership philosophy and soft skills
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* STEP 2: THE TRAINING (DARK THEME SECTION) */}
      <section className="py-[6rem] px-[2rem] bg-[#090A10] flex justify-center border-t border-b border-white/[0.05]">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-[4rem] items-center">
          {/* Left (Text Content) */}
          <div className="text-left flex flex-col gap-[1.25rem]">
            <span className="text-[0.75rem] tracking-[0.15em] uppercase font-bold">02 / THE TRAINING</span>
            <h3 className="text-[1.8rem] md:text-[2.2rem] font-extrabold text-white tracking-tight">How it digests your resume.</h3>
            <p className="text-[0.88rem] leading-[1.75] text-white/60">
              Behind the scenes, we construct a specialized knowledge graph from your uploaded documents and interview responses. This allows your AI clone to hallucinate less and advocate more.
            </p>
          </div>

          {/* Right (Visual Mockup Image with Glow) */}
          <div className="w-full flex items-center justify-center relative">
            {/* Glow Effect Backdrop */}
            <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-[#5B54F7] to-[#4F46E5] rounded-full blur-[60px] opacity-25 pointer-events-none z-0" />

            {/* The Image */}
            <img src={overlayDarkImg} alt="The Training Overlay" className="w-full h-auto relative z-10 rounded-[12px] shadow-[0_25px_60px_rgba(91,84,247,0.18)]" />
          </div>
        </div>
      </section>

      {/* STEP 3 & STEP 4 CONTAINER */}
      <section className="py-[6rem] px-[2rem] flex flex-col items-center bg-white">
        {/* STEP 3: THE LAUNCH */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-[4rem] items-center mb-[6rem]">
          {/* Left (Visual Mockup Image) */}
          <div className="w-full  flex items-center justify-center relative ">
            <img src={linkCopyImg} alt="The Launch Link Copy" className="w-full h-auto" />
          </div>

          {/* Right (Text Content) */}
          <div className="text-left flex flex-col gap-[1.25rem]">
            <span className="text-[#5B54F7] text-[0.75rem] tracking-[0.15em] uppercase font-bold">03 / THE LAUNCH</span>
            <h3 className="text-[1.8rem] md:text-[2.2rem] font-extrabold text-[#0f172a] tracking-tight">How your link goes live.</h3>
            <p className="text-[0.88rem] leading-[1.75] text-[#475569]">
              Instantly deploy your custom URL. It acts as a permanent, interactive gateway for recruiters and hiring managers to engage with your professional persona on their schedule.
            </p>
          </div>
        </div>

        {/* STEP 4: THE ANALYTICS */}
        <div className="max-w-7xl w-full bg-[#F5F5F7] border border-[#E5E5E9]/65 rounded-[16px] p-[1.5rem] md:p-[4.5rem_4rem] shadow-sm flex flex-col items-center">
          <div className="text-center flex flex-col items-center gap-[1rem] max-w-[620px] mb-[3.5rem]">
            <span className="text-[#5B54F7] text-[0.75rem] tracking-[0.18em] uppercase font-bold">04 / THE ANALYTICS</span>
            <h3 className="font-inter text-[2.2rem] md:text-[3.2rem] font-extrabold text-[#0f172a] tracking-[-0.03em] leading-[1.12]">
              How you see what recruiters are asking.
            </h3>
            <p className="text-[0.9rem] md:text-[1rem] leading-[1.7] text-[#475569] mt-[0.5rem] opacity-90">
              Stop guessing what hiring managers care about. Get a secure dashboard showing exactly which skills and experiences they are inquiring about the most.
            </p>
          </div>

          {/* Metric Cards Row */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-[1.5rem] text-left">
            {/* Metric 1 */}
            <div className="bg-white border border-[#E5E5E9]/60 rounded-[20px] p-[1.75rem] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-[0.75rem]">
                <div className="w-[32px] h-[32px] bg-[#EEEDFC] rounded-[8px] flex items-center justify-center text-[#5B54F7] shrink-0">
                  <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <span className="text-[0.88rem] font-semibold text-[#475569]">Total Engagements</span>
              </div>
              <div className="text-[2.5rem] font-extrabold text-[#0f172a] tracking-tight mt-[1.5rem] leading-none">142</div>
              <span className="text-[0.74rem] text-[#22C55E] font-bold mt-[0.75rem]">+12% from last week</span>
            </div>

            {/* Metric 2 */}
            <div className="bg-white border border-[#E5E5E9]/60 rounded-[20px] p-[1.75rem] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-[0.75rem]">
                <div className="w-[32px] h-[32px] bg-[#EEEDFC] rounded-[8px] flex items-center justify-center text-[#5B54F7] shrink-0">
                  <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-[0.88rem] font-semibold text-[#475569]">Top Query Topic</span>
              </div>
              <div className="text-[1.55rem] font-extrabold text-[#0f172a] tracking-tight mt-[1.5rem] leading-none mb-[0.6rem] py-[0.15rem] truncate">
                "Leadership Style"
              </div>
              <span className="text-[0.74rem] text-[#64748B] font-medium mt-[0.35rem]">Asked in 45% of chats</span>
            </div>

            {/* Metric 3 */}
            <div className="bg-white border border-[#E5E5E9]/60 rounded-[20px] p-[1.75rem] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <div className="flex items-center gap-[0.75rem]">
                <div className="w-[32px] h-[32px] bg-[#EEEDFC] rounded-[8px] flex items-center justify-center text-[#5B54F7] shrink-0">
                  <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-[0.88rem] font-semibold text-[#475569]">Avg. Time Spent</span>
              </div>
              <div className="text-[2.5rem] font-extrabold text-[#0f172a] tracking-tight mt-[1.5rem] leading-none">4m 12s</div>
              <span className="text-[0.74rem] text-[#64748B] font-medium mt-[0.75rem]">vs 30s on standard PDF</span>
            </div>
          </div>
        </div>
      </section>

      {/* INVEST / PRICING */}
      <section className="py-[6rem] px-[2rem] flex justify-center bg-white border-t border-[#e2e8f0]" id="pricing">
        <div className="max-w-[900px] w-full text-center">
          <h2 className="font-inter text-[1.6rem] md:text-[2.4rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-[#0f172a] mb-[1.25rem]">Invest in your career.<br />One simple price.</h2>
          <p className="max-w-[64ch] text-[0.88rem] leading-[1.75] text-[#475569] mx-auto mb-[3.5rem]">No complex tiers. No hidden fees. Get the ultimate AI-powered resume and interview tool for a single, flat monthly rate.</p>

          {/* TWO-COLUMN PRICING CARD */}
          <div className="relative w-full grid grid-cols-1 md:grid-cols-2 bg-white border border-[#e2e8f0] border-t-4 border-t-lp-accent rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.04)] text-left">
            {/* LEFT COLUMN */}
            <div className="p-[2.5rem] flex flex-col justify-between z-10">
              <div>
                <div className="inline-block p-[0.25rem_0.65rem] bg-[rgba(91,84,247,0.08)] border border-[rgba(91,84,247,0.2)] rounded-full text-[0.65rem] tracking-[0.08em] font-bold uppercase text-lp-accent mb-[1rem]">
                  PRO AI
                </div>
                <h3 className="text-[2rem] font-extrabold text-[#0f172a] m-0 mb-[0.5rem] tracking-tight">
                  The Edge
                </h3>
                <div className="flex items-baseline gap-[0.15rem] font-extrabold text-[#0f172a] mb-[1.25rem]">
                  <span className="text-[3rem] leading-[1]">$19</span>
                  <span className="text-[0.95rem] text-[#475569] font-medium">/mo</span>
                </div>
                <p className="text-[0.85rem] leading-[1.6] text-[#475569] mb-[2rem]">
                  Everything you need to stand out, optimized for modern recruiting.
                </p>
              </div>

              <div>
                <Link
                  className="w-full inline-flex items-center justify-center py-[0.85rem] px-[1.5rem] bg-[#5B54F7] text-white rounded-[6px] text-[0.88rem] font-semibold border-none cursor-pointer transition-all duration-200 hover:bg-[#4a43e6] disabled:opacity-55 disabled:cursor-not-allowed tracking-[0.01em] no-underline"
                  to="/pricing"
                >
                  Start Your Free Trial
                </Link>
                <div className="text-[0.7rem] text-[#6B7280] text-center mt-[1rem]">
                  Cancel anytime. 7-day money-back guarantee.
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="p-[2.5rem] flex flex-col justify-center z-10">
              <ul className="flex flex-col gap-[1.25rem] p-0 m-0 list-none">
                {pricingFeatures.map((f, i) => (
                  <li key={i} className="text-[0.88rem] text-[#334155] font-medium flex items-start gap-[0.75rem]">
                    <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center mt-[1px]">
                      <svg
                        className="w-[10px] h-[10px] text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        viewBox="0 0 24 24"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="leading-tight">
                      {f.text}
                      {f.bold && <strong className="font-semibold text-[#0f172a]">{f.bold}</strong>}
                      {f.text2}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CENTERED VERTICAL DIVIDER LINE (Does not touch top/bottom, hidden on mobile) */}
            <div className="hidden md:block absolute top-[10%] bottom-[10%] left-1/2 w-[1px] bg-[#e2e8f0] z-20" />

            {/* CENTERED HORIZONTAL DIVIDER LINE (Visible on mobile only) */}
            <div className="block md:hidden absolute left-[10%] right-[10%] top-1/2 h-[1px] bg-[#e2e8f0] z-20" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-[6rem] px-[2rem] flex justify-center bg-white border-t border-[#e2e8f0]">
        <div className="max-w-[900px] w-full text-center">
          <p className="text-[0.72rem] tracking-[0.18em] uppercase text-lp-accent font-bold mb-[0.75rem]">REAL CANDIDATES. REAL CALLBACKS.</p>
          <h2 className="font-inter text-[1.6rem] md:text-[2.4rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-[#0f172a] mb-[2.5rem]">They stopped being a PDF in a pile.</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1.5rem] text-left mt-[3.5rem]">
            {testimonials.map((t, idx) => (
              <div className="bg-white border border-[#e2e8f0] rounded-[12px] p-[2rem] flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.01)]" key={idx}>
                <div className="text-[#fbbf24] text-[0.85rem] mb-[1rem]">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="text-[0.82rem] leading-[1.7] text-[#334155] italic mb-[1.5rem]">{t.quote}</p>
                <div className="flex items-center gap-[0.75rem]">
                  <div className="w-[32px] h-[32px] rounded-full flex items-center justify-center font-inter text-[0.72rem] font-bold text-[#1e293b] flex-shrink-0" style={{ backgroundColor: t.color }}>
                    {t.initials}
                  </div>
                  <div className="flex flex-col gap-[1px]">
                    <div className="text-[0.8rem] font-bold text-[#0f172a]">{t.name}</div>
                    <div className="text-[0.7rem] text-[#64748b] font-medium">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-[6rem] px-[2rem] flex justify-center bg-[#0a0b10]" id="faq">
        <div className="max-w-[900px] w-full text-center">
          <h2 className="font-inter text-[1.6rem] md:text-[2.4rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-white mb-[2.5rem]">Common Questions</h2>
          <p className="text-[0.88rem] text-white/45 mb-[3.5rem]">Everything you need to know about the product and billing.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] text-left">
            {faqItems.map((item, idx) => (
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-[12px] p-[2rem] flex gap-[1rem]" key={idx}>
                <div className="text-white/35 mt-[3px] flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="font-inter text-[0.95rem] font-bold text-white mb-[0.6rem]">{item.question}</h3>
                  <p className="text-[0.8rem] leading-[1.65] text-white/60">{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>

    {/* FOOTER */}
    <footer className="flex items-center justify-between flex-wrap gap-[1rem] p-[2rem] bg-[#0a0b10] border-t border-white/[0.05] flex-col md:flex-row">
      <div className="font-inter text-[0.95rem] font-extrabold text-white">ChatResumes</div>
      <div className="flex gap-[2rem]">
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Privacy Policy</span>
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Terms of Service</span>
        <span className="text-[0.75rem] text-white/40 cursor-pointer transition-colors duration-200 hover:text-white">Cookie Policy</span>
      </div>
      <div className="text-[0.72rem] text-white/25">© 2024 ChatResumes. All rights reserved.</div>
    </footer>
  </div>
)
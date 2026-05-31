import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { useNavigate as useReactNavigate } from 'react-router-dom'

import { createCheckout } from '../lib/billing'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'

const FEATURES = [
  'Personal AI chatbot trained on your experience',
  'Custom chatresumes.io/your-name URL',
  'Recruiter engagement analytics',
  'Dynamic tone adjustment for different roles',
  'Static PDF export & backup',
]

const FAQ_ITEMS = [
  {
    question: 'Will recruiters actually use this?',
    answer: 'Yes. In our testing, recruiters spend 3x longer interacting with a ChatResume compared to a static PDF. It allows them to ask exactly what they need to know, instantly.',
  },
  {
    question: 'Can it hallucinate my experience?',
    answer: 'No. The AI is strictly constrained to the source material you provide. It will proudly state "I don\'t have that information in my profile" rather than invent experience.',
  },
  {
    question: 'What if I need a traditional PDF?',
    answer: 'We\'ve got you covered. Your Pro account includes a beautifully formatted, ATS-friendly static PDF export that syncs automatically with your chat data.',
  },
  {
    question: 'How do the analytics work?',
    answer: 'You\'ll see which companies are viewing your profile, what questions they are asking the AI, and how long they spend engaged with your history.',
  },
]

export const PricingPage = () => {
  const navigate = useReactNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  const startCheckout = async () => {
    if (!isLoaded) return
    if (!isSignedIn) {
      navigate('/signup')
      return
    }
    setError(null)
    setIsStarting(true)
    try {
      const { checkoutUrl } = await createCheckout(getToken, {
        cancelUrl: `${window.location.origin}/billing/cancel`,
        successUrl: `${window.location.origin}/billing/success`,
      })
      window.location.assign(checkoutUrl)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to start checkout.')
      setIsStarting(false)
    }
  }

  const ctaLabel = !isLoaded
    ? 'Loading…'
    : isStarting
      ? 'Starting…'
      : isSignedIn
        ? 'Subscribe — $19/mo'
        : 'Start Your Free Trial'

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBFD] text-[#0F172A] font-sans antialiased">
      {/* NAVBAR */}
      <Navbar />

      {/* MAIN TOP SECTION */}
      <main className="flex-1 flex flex-col items-center pt-[100px] pb-[80px] px-[1.5rem]">
        <div className="max-w-[900px] w-full text-center flex flex-col items-center">
          <h1 className="font-sans text-[2.2rem] md:text-[3.5rem] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#0f172a] mb-[1.25rem]">
            Invest in your career.<br />One simple price.
          </h1>
          <p className="max-w-[64ch] text-[0.88rem] md:text-[1rem] leading-[1.75] text-[#475569] mx-auto mb-[3.5rem]">
            No complex tiers. No hidden fees. Get the ultimate AI-powered resume and interview tool for a single, flat monthly rate.
          </p>

          {/* TWO-COLUMN PRICING CARD */}
          <div className="relative w-full grid grid-cols-1 md:grid-cols-2 bg-white border border-[#e2e8f0] border-t-4 border-t-[#5B54F7] rounded-[16px] overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.04)] text-left">
            {/* LEFT COLUMN */}
            <div className="p-[2.5rem] flex flex-col justify-between z-10">
              <div>
                <div className="inline-block p-[0.25rem_0.65rem] bg-[rgba(91,84,247,0.08)] border border-[rgba(91,84,247,0.2)] rounded-full text-[0.65rem] tracking-[0.08em] font-bold uppercase text-[#5B54F7] mb-[1rem]">
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
                <button
                  className="w-full inline-flex items-center justify-center py-[0.85rem] px-[1.5rem] bg-[#5B54F7] text-white rounded-[6px] text-[0.88rem] font-semibold border-none cursor-pointer transition-all duration-200 hover:bg-[#4a43e6] disabled:opacity-55 disabled:cursor-not-allowed tracking-[0.01em]"
                  disabled={isStarting || !isLoaded}
                  onClick={startCheckout}
                  type="button"
                >
                  {ctaLabel}
                </button>
                {error ? (
                  <div className="text-[0.74rem] text-[#ef4444] text-center mt-[0.5rem]">
                    {error}
                  </div>
                ) : null}
                <div className="text-[0.7rem] text-[#6B7280] text-center mt-[1rem]">
                  Cancel anytime. 7-day money-back guarantee.
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="p-[2.5rem] flex flex-col justify-center z-10">
              <ul className="flex flex-col gap-[1.25rem] p-0 m-0 list-none">
                {FEATURES.map((feature) => (
                  <li key={feature} className="text-[0.88rem] text-[#334155] font-medium flex items-start gap-[0.75rem]">
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
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CENTERED VERTICAL DIVIDER LINE (Does not touch top/bottom, hidden on mobile) */}
            <div className="hidden md:block absolute top-[10%] bottom-[10%] left-1/2 w-[1px] bg-[#e2e8f0] z-20" />

            {/* CENTERED HORIZONTAL DIVIDER LINE (Visible on mobile only) */}
            <div className="block md:hidden absolute left-[10%] right-[10%] top-[55%] h-[1px] bg-[#e2e8f0] z-20" />
          </div>
        </div>
      </main>

      {/* COMMON QUESTIONS / FAQ SECTION (DARK THEME) */}
      <section className="py-[6rem] px-[2rem] bg-[#090A10] flex justify-center border-t border-white/[0.05]">
        <div className="max-w-[900px] w-full text-center">
          <h2 className="font-sans text-[2.2rem] md:text-[2.6rem] font-extrabold tracking-[-0.03em] leading-[1.15] text-white mb-[1.25rem]">
            Common Questions
          </h2>
          <p className="text-[0.88rem] md:text-[1rem] text-white/45 mb-[3.5rem] max-w-[60ch] mx-auto">
            Everything you need to know about the product and billing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem] text-left">
            {FAQ_ITEMS.map((item) => (
              <div
                className="p-[2rem] bg-[#111322] border border-white/[0.04] rounded-[12px] flex gap-[1.25rem] items-start transition-all duration-200 hover:border-white/[0.08]"
                key={item.question}
              >
                <div className="w-[32px] h-[32px] rounded-full bg-white/[0.05] flex items-center justify-center flex-shrink-0 text-white/40">
                  <svg
                    className="w-[16px] h-[16px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[0.95rem] font-bold text-white mb-[0.6rem] tracking-tight">
                    {item.question}
                  </h3>
                  <p className="text-[0.82rem] leading-[1.65] text-white/60">
                    {item.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  )
}

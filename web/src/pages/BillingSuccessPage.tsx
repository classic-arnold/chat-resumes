import { Link } from 'react-router-dom'

import { ButtonLink } from '../components/ui/Button'

export const BillingSuccessPage = () => (
  <div className="min-h-screen flex flex-col bg-off-white text-navy-text font-mono">
    <main className="flex-1 flex items-center justify-center py-[2rem] px-[1rem]">
      <div className="w-full max-w-[440px] bg-white border border-border rounded-[14px] shadow-[0_18px_48px_rgba(10,36,99,0.08)] p-[2rem] text-center flex flex-col items-center justify-center">
        <div className="inline-flex items-center justify-center rounded-full py-[0.25rem] px-[0.65rem] text-[0.66rem] font-semibold tracking-[0.06em] uppercase bg-[#d1fae5] text-[#065f46]" style={{ marginBottom: '1rem' }}>
          Subscribed
        </div>
        <h1 className="font-inter font-bold text-[1.5rem] text-navy-text mt-[0.2rem] mx-0 mb-[0.6rem]">You're in.</h1>
        <p className="text-[0.82rem] text-muted leading-[1.55] mt-0 mx-0 mb-[1.25rem]">
          Your public recruiter link is now active. Open the dashboard to copy it
          and start training your AI.
        </p>
        <ButtonLink href="/dashboard" variant="primary">
          Open dashboard →
        </ButtonLink>
        <Link className="mt-[0.9rem] text-[0.74rem] text-muted hover:underline" to="/chat">
          or jump straight into chat
        </Link>
      </div>
    </main>
  </div>
)

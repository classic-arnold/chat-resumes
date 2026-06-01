import React from 'react'
import { Link } from 'react-router-dom'

interface PricingCardProps {
  buttonText: string
  onClick?: () => void
  to?: string
  isLoading?: boolean
  error?: string | null
}

export const PricingCard: React.FC<PricingCardProps> = ({
  buttonText,
  onClick,
  to,
  isLoading = false,
  error = null,
}) => {
  const buttonClasses = "w-full inline-flex items-center justify-center py-[0.9rem] px-[1.5rem] bg-[#5B54F7] hover:bg-[#4a43e6] disabled:opacity-55 disabled:cursor-not-allowed text-white rounded-[12px] text-[0.9rem] font-semibold transition-all duration-200 border-none cursor-pointer tracking-[0.01em] no-underline gap-[0.5rem] mt-[0.5rem]"

  return (
    <div className="relative max-w-[480px] w-full bg-[#0E101E] border border-white/[0.08] rounded-[24px] p-[2rem] md:p-[2.5rem] shadow-[0_25px_60px_rgba(91,84,247,0.15)] text-left flex flex-col gap-[1.75rem]">
      {/* Header Grid */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-[0.25rem]">
          <span className="text-[1.15rem] font-extrabold text-white tracking-tight">Pro AI</span>
          <span className="text-[0.82rem] text-white/50">Everything you need to stand out.</span>
        </div>
        <div className="flex items-baseline font-extrabold text-white leading-none">
          <span className="text-[2.2rem]">$9.99</span>
          <span className="text-[0.88rem] text-white/50 font-normal ml-[0.15rem]">/mo</span>
        </div>
      </div>

      {/* Separator Divider */}
      <div className="h-[1px] w-full bg-white/[0.08]" />

      {/* Features Checklist */}
      <ul className="flex flex-col gap-[1rem] p-0 m-0 list-none">
        <li className="text-[0.85rem] text-white/80 font-medium flex items-center gap-[0.75rem]">
          <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
            <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          Custom AI Chatbot trained on your experience
        </li>
        <li className="text-[0.85rem] text-white/80 font-medium flex items-center gap-[0.75rem]">
          <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
            <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          Personalized chatresumes.io/name URL
        </li>
        <li className="text-[0.85rem] text-white/80 font-medium flex items-center gap-[0.75rem]">
          <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
            <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          Recruiter analytics & chat transcripts
        </li>
        <li className="text-[0.85rem] text-white/80 font-medium flex items-center gap-[0.75rem]">
          <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
            <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          Tone adjustment (Professional to Casual)
        </li>
        <li className="text-[0.85rem] text-white/80 font-medium flex items-center gap-[0.75rem]">
          <span className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#4F46E5] flex items-center justify-center">
            <svg className="w-[10px] h-[10px] text-white" fill="none" stroke="currentColor" strokeWidth="3.5" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          Downloadable PDF backup generation
        </li>
      </ul>

      {/* Action Button */}
      {to ? (
        <Link className={buttonClasses} to={to}>
          {buttonText}
        </Link>
      ) : (
        <button
          className={buttonClasses}
          disabled={isLoading}
          onClick={onClick}
          type="button"
        >
          {buttonText}
        </button>
      )}

      {error && (
        <div className="text-[0.74rem] text-[#ef4444] text-center mt-[0.5rem]">
          {error}
        </div>
      )}

      {/* Footer Subtext */}
      <div className="text-[0.72rem] text-white/40 text-center">
        Cancel anytime. Secure checkout via Stripe.
      </div>
    </div>
  )
}

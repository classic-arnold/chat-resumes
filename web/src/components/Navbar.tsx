import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/react'

import { trackPostHogEvent } from '../lib/posthog'

export const Navbar: React.FC = () => {
  const location = useLocation()
  const { isSignedIn } = useAuth()
  const isHome = location.pathname === '/'
  const isPricingActive = location.pathname === '/pricing'

  const handlePricingClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    trackPostHogEvent('navbar_pricing_clicked', {
      destination: isHome ? 'landing_pricing_section' : '/pricing',
      from_path: location.pathname,
      is_signed_in: Boolean(isSignedIn),
    })

    if (isHome) {
      e.preventDefault()
      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Determine right CTA
  const ctaLabel = isSignedIn ? 'Dashboard' : isPricingActive ? 'Login' : 'Claim My Link'
  const ctaTo = isSignedIn ? '/dashboard' : isPricingActive ? '/login' : '/pricing'

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[2rem] h-[56px] bg-[#F9F9F9]/90 backdrop-blur-[12px] border-b border-[#e2e8f0]">
      <Link
        className="flex items-center gap-[0.5rem] font-inter text-[1.05rem] font-extrabold text-[#0f172a] no-underline tracking-[-0.02em]"
        onClick={() =>
          trackPostHogEvent('navbar_brand_clicked', {
            from_path: location.pathname,
            is_signed_in: Boolean(isSignedIn),
          })
        }
        to="/"
      >
        ChatResumes
      </Link>
      <div className="hidden md:flex items-center gap-[2.25rem]">
        <a
          className="text-[0.82rem] text-[#475569] no-underline transition-colors duration-200 hover:text-[#0f172a] font-medium"
          href="/#how-it-works"
          onClick={() =>
            trackPostHogEvent('navbar_how_it_works_clicked', {
              from_path: location.pathname,
              is_signed_in: Boolean(isSignedIn),
            })
          }
        >
          How It Works
        </a>
        <a
          className={`text-[0.82rem] no-underline transition-colors duration-200 flex flex-col items-center relative font-medium cursor-pointer ${isPricingActive ? 'text-[#5B54F7]' : 'text-[#475569] hover:text-[#0f172a]'}`}
          href={isHome ? '#pricing' : '/pricing'}
          onClick={handlePricingClick}
        >
          Pricing
          {isPricingActive && (
            <span className="absolute -bottom-[18px] w-[4px] h-[4px] bg-[#5B54F7] rounded-full" />
          )}
        </a>
      </div>
      <Link
        className="inline-flex items-center justify-center py-[0.6rem] px-[1.25rem] bg-[#5B54F7] text-white rounded-full text-[0.82rem] font-medium no-underline border-none cursor-pointer transition-all duration-200 hover:bg-[#4a43e6] hover:-translate-y-[1px] tracking-[0.01em]"
        onClick={() =>
          trackPostHogEvent('navbar_primary_cta_clicked', {
            destination: ctaTo,
            from_path: location.pathname,
            is_signed_in: Boolean(isSignedIn),
            label: ctaLabel,
          })
        }
        to={ctaTo}
      >
        {ctaLabel}
      </Link>
    </nav>
  )
}

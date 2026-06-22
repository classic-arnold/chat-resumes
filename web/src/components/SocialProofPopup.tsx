import { CheckCircle2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { trackPostHogEvent } from '../lib/posthog'

const NAMES = [
  'Sarah', 'James', 'Maria', 'David', 'Aisha', 'Liam', 'Priya', 'Carlos',
  'Emma', 'Noah', 'Sofia', 'Marcus', 'Olivia', 'Daniel', 'Zoe', 'Ethan',
  'Chloe', 'Andre', 'Nina', 'Jordan',
] as const

const CITIES = [
  'Austin', 'Chicago', 'Seattle', 'Denver', 'Boston', 'Atlanta', 'Portland',
  'Miami', 'Dallas', 'Phoenix', 'Nashville', 'Brooklyn', 'San Diego',
  'Minneapolis', 'Charlotte', 'Columbus', 'Raleigh', 'Tampa', 'Sacramento',
  'Pittsburgh',
] as const

// Timing: first toast ~10s after load, visible ~6s, then recurs every 4 minutes.
const INITIAL_DELAY_MS = 10_000
const VISIBLE_MS = 6_000
const INTERVAL_MS = 4 * 60 * 1000

const pickRandom = <T,>(items: readonly T[], exclude?: T): T => {
  if (items.length <= 1) {
    return items[0]
  }

  let choice = items[Math.floor(Math.random() * items.length)]
  while (choice === exclude) {
    choice = items[Math.floor(Math.random() * items.length)]
  }

  return choice
}

type Notice = {
  city: string
  minutesAgo: number
  name: string
}

const buildNotice = (previousName?: string): Notice => ({
  city: pickRandom(CITIES),
  minutesAgo: 1 + Math.floor(Math.random() * 9),
  name: pickRandom(NAMES, previousName),
})

export const SocialProofPopup = () => {
  const [notice, setNotice] = useState<Notice | null>(null)
  const [visible, setVisible] = useState(false)

  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastNameRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const showNotice = () => {
      const next = buildNotice(lastNameRef.current)
      lastNameRef.current = next.name

      setNotice(next)
      setVisible(true)
      trackPostHogEvent('social_proof_popup_shown', {
        city: next.city,
        name: next.name,
      })

      hideTimeoutRef.current = setTimeout(() => setVisible(false), VISIBLE_MS)
    }

    const initialTimeout = setTimeout(showNotice, INITIAL_DELAY_MS)
    const interval = setInterval(showNotice, INTERVAL_MS)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const handleDismiss = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    setVisible(false)
  }

  if (!notice) {
    return null
  }

  const initials = `${notice.name[0]}${notice.city[0]}`.toUpperCase()

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-[1.25rem] left-[1.25rem] z-[1000] w-[min(330px,calc(100vw-2.5rem))] transition-all duration-500 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-[1rem] pointer-events-none'
      }`}
      role="status"
    >
      <div className="flex items-start gap-[0.85rem] bg-white border border-[#e2e8f0] rounded-[12px] shadow-[0_12px_32px_rgba(15,23,42,0.12)] py-[0.9rem] px-[1rem]">
        <div className="flex-shrink-0 w-[40px] h-[40px] rounded-full bg-[#5B54F7] text-white flex items-center justify-center text-[0.85rem] font-bold">
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-[0.82rem] font-semibold text-[#0f172a] leading-tight">
            {notice.name} from {notice.city}
          </div>
          <div className="text-[0.72rem] text-[#475569] leading-snug mt-[0.15rem]">
            just subscribed to Pro
          </div>
          <div className="flex items-center gap-[0.3rem] text-[0.66rem] text-[#16a34a] font-medium mt-[0.35rem]">
            <CheckCircle2 className="w-[12px] h-[12px]" />
            Verified · {notice.minutesAgo} min ago
          </div>
        </div>
        <button
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-[#94a3b8] hover:text-[#475569] transition-colors duration-150 border-none bg-transparent cursor-pointer p-[0.1rem] -mt-[0.1rem] -mr-[0.2rem]"
          onClick={handleDismiss}
          type="button"
        >
          <X className="w-[15px] h-[15px]" />
        </button>
      </div>
    </div>
  )
}

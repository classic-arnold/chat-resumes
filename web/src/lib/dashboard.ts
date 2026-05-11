import type { BillingStatus } from './billing'
import { requestApi, type TokenProvider } from './api'

export type CandidateProfile = {
  approvedStoriesCount: number
  completeness: {
    completed: number
    items: Array<{
      done: boolean
      key: string
      label: string
    }>
    percentage: number
    total: number
  }
  displayName: string
  draftStoriesCount: number
  headline: string | null
  id: string
  isPublic: boolean
  location: string | null
  publicReady: boolean
  publicUrl: string
  quizAnsweredCount: number
  quizTotal: number
  slug: string
  summary: string | null
  targetRoles: string[]
}

export type DashboardSummary = {
  activity: Array<{
    id: string
    occurredAt: string
    summary: string
    title: string
    type: 'chat' | 'view'
  }>
  billing: BillingStatus
  metrics: {
    approvedStoriesCount: number
    averageChatDurationMinutes: number
    chatSessions: number
    profileCompletenessPercentage: number
    recruiterMessages: number
    totalViews: number
    viewsThisWeek: number
  }
  profile: CandidateProfile
  publicLinkActive: boolean
}

export const fetchDashboard = (getToken: TokenProvider) => {
  return requestApi<DashboardSummary>('/api/dashboard', { getToken })
}
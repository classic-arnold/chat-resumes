import { io } from 'socket.io-client'

import {
  requestApi,
  resolveSocketOrigin,
  resolveSocketPath,
  type TokenProvider,
} from './api'
import type { CandidateProfile } from './dashboard'

export type ChatMessage = {
  content: string
  createdAt: string
  id: string
  role: 'ai' | 'candidate' | 'recruiter' | 'system'
}

export type Story = {
  action: string
  id: string
  result: string
  situation: string
  sourceSessionId: string | null
  status: 'approved' | 'archived' | 'draft'
  task: string
  title: string
  updatedAt: string
}

export type CandidateChatState = {
  knowledgeFacts: string[]
  messages: ChatMessage[]
  profile: CandidateProfile
  sessionId: string
  stories: Story[]
  summary: string
}

export type PublicStory = {
  action: string
  id: string
  result: string
  situation: string
  task: string
  title: string
  updatedAt: string
}

export type PublicProfile = {
  displayName: string
  headline: string | null
  location: string | null
  publicUrl: string
  slug: string
  summary: string | null
  targetRoles: string[]
}

export type PublicProfileResponse = {
  approvedStories: PublicStory[]
  availability: 'inactive' | 'missing' | 'ready' | 'training'
  fallbackMessage: string | null
  profile: PublicProfile | null
  visitorToken: string
}

export type RecruiterChatState = PublicProfileResponse & {
  messages: ChatMessage[]
  sessionId: string | null
}

export type SocketErrorPayload = {
  code: string
  message: string
}

export const fetchCandidateChatState = (getToken: TokenProvider) => {
  return requestApi<CandidateChatState>('/api/chat/candidate/session', { getToken })
}

export const approveCandidateStory = (getToken: TokenProvider, storyId: string) => {
  return requestApi<CandidateChatState>(`/api/chat/candidate/stories/${storyId}/approve`, {
    getToken,
    method: 'POST',
  })
}

export const fetchPublicProfile = (slug: string, visitorToken?: string | null) => {
  return requestApi<PublicProfileResponse>(`/api/public/profiles/${encodeURIComponent(slug)}`, {
    headers: visitorToken ? { 'x-visitor-token': visitorToken } : undefined,
  })
}

export const connectCandidateSocket = async ({ getToken }: { getToken: TokenProvider }) => {
  const token = await getToken()

  if (!token) {
    throw new Error('Authentication token unavailable.')
  }

  return io(`${resolveSocketOrigin()}/candidate`, {
    auth: {
      token,
    },
    path: resolveSocketPath(),
    transports: ['websocket'],
  })
}

export const connectRecruiterSocket = ({
  slug,
  visitorToken,
}: {
  slug: string
  visitorToken?: string | null
}) => {
  return io(`${resolveSocketOrigin()}/recruiter`, {
    auth: {
      ...(visitorToken ? { visitorToken } : {}),
      slug,
    },
    path: resolveSocketPath(),
    transports: ['websocket'],
  })
}
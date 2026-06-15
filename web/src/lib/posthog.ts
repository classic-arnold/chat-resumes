import posthog from 'posthog-js'

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com'

export const posthogProjectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
export const posthogHost = import.meta.env.VITE_POSTHOG_HOST ?? DEFAULT_POSTHOG_HOST
export const isPostHogConfigured = Boolean(posthogProjectToken)

type PostHogPrimitive = boolean | number | string | null

export interface PostHogEventProperties {
  [key: string]: PostHogEventPropertyValue
}

export type PostHogEventPropertyValue =
  | PostHogPrimitive
  | PostHogPrimitive[]
  | PostHogEventProperties
  | PostHogEventProperties[]

let hasInitializedPostHog = false
let lastTrackedPageKey: string | null = null

const canUseDom = () => typeof window !== 'undefined'

export const initPostHog = () => {
  if (!canUseDom() || hasInitializedPostHog || !posthogProjectToken) {
    return
  }

  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    autocapture: false,
    capture_pageleave: true,
    capture_pageview: false,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
  })

  hasInitializedPostHog = true
}

export const identifyPostHogUser = (
  distinctId: string,
  properties?: PostHogEventProperties,
) => {
  if (!isPostHogConfigured) {
    return
  }

  initPostHog()
  posthog.identify(distinctId, properties)
}

export const resetPostHogUser = () => {
  if (!canUseDom() || !isPostHogConfigured) {
    return
  }

  initPostHog()
  posthog.reset()
}

export const trackPostHogEvent = (
  eventName: string,
  properties?: PostHogEventProperties,
) => {
  if (!isPostHogConfigured) {
    return
  }

  initPostHog()
  posthog.capture(eventName, properties)
}

export const trackPostHogPageView = (path: string) => {
  if (!canUseDom() || !isPostHogConfigured) {
    return
  }

  const pageKey = `${window.location.origin}${path}`

  if (lastTrackedPageKey === pageKey) {
    return
  }

  lastTrackedPageKey = pageKey
  initPostHog()
  posthog.capture('$pageview', {
    $current_url: window.location.href,
    path,
  })
}

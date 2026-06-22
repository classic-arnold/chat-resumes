const META_PIXEL_ID = '1649842482969699' as const
const META_PIXEL_SCRIPT_ID = 'meta-pixel-script'
const META_PIXEL_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js'

export const META_PIXEL_SUBSCRIPTION = {
  currency: 'USD',
  id: 'chatresumes-pro-monthly',
  quantity: 1,
  value: 9.99,
} as const

export const META_PIXEL_SUBSCRIPTION_ANNUAL = {
  currency: 'USD',
  id: 'chatresumes-pro-annual',
  quantity: 1,
  value: 79,
} as const

export const META_PIXEL_STANDARD_EVENTS = [
  'AddPaymentInfo',
  'AddToCart',
  'AddToWishlist',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'InitiateCheckout',
  'Lead',
  'PageView',
  'Purchase',
  'Schedule',
  'Search',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
  'ViewContent',
] as const

export const META_PIXEL_CUSTOM_EVENTS = {
  checkoutCanceled: 'CheckoutCanceled',
  checkoutFailed: 'CheckoutFailed',
  signupIntent: 'SignupIntent',
  subscriptionActivated: 'SubscriptionActivated',
} as const

export type MetaPixelStandardEventName = (typeof META_PIXEL_STANDARD_EVENTS)[number]
export type MetaPixelKnownCustomEventName =
  (typeof META_PIXEL_CUSTOM_EVENTS)[keyof typeof META_PIXEL_CUSTOM_EVENTS]

type MetaPixelPrimitive = boolean | number | string | null

export type MetaPixelAdvancedMatching = {
  country?: string
  ct?: string
  db?: string
  em?: string
  external_id?: string
  fn?: string
  ge?: 'f' | 'm'
  ln?: string
  ph?: string
  st?: string
  zp?: string
}

export type MetaPixelContent = {
  id: number | string
  quantity: number
} & Record<string, MetaPixelPrimitive | undefined>

type MetaPixelContentIds = Array<number | string>
type MetaPixelContents = MetaPixelContent[]
type MetaPixelContentType = 'product' | 'product_group'

type AddPaymentInfoParameters = {
  content_ids?: MetaPixelContentIds
  contents?: MetaPixelContents
  currency?: string
  value?: number
}

type AddToCartParameters = {
  content_ids?: MetaPixelContentIds
  content_type?: MetaPixelContentType
  contents?: MetaPixelContents
  currency?: string
  value?: number
}

type AddToWishlistParameters = {
  content_ids?: MetaPixelContentIds
  contents?: MetaPixelContents
  currency?: string
  value?: number
}

type CompleteRegistrationParameters = {
  currency?: string
  status?: boolean
  value?: number
}

type InitiateCheckoutParameters = {
  content_ids?: MetaPixelContentIds
  contents?: MetaPixelContents
  currency?: string
  num_items?: number
  value?: number
}

type LeadParameters = {
  currency?: string
  value?: number
}

type PurchaseParameters = {
  content_ids?: MetaPixelContentIds
  content_type?: MetaPixelContentType
  contents?: MetaPixelContents
  currency: string
  num_items?: number
  value: number
}

type SearchParameters = {
  content_ids?: MetaPixelContentIds
  content_type?: MetaPixelContentType
  contents?: MetaPixelContents
  currency?: string
  search_string?: string
  value?: number
}

type SubscriptionParameters = {
  currency?: string
  predicted_ltv?: number
  value?: number
}

type ViewContentParameters = {
  content_ids?: MetaPixelContentIds
  content_type?: MetaPixelContentType
  contents?: MetaPixelContents
  currency?: string
  value?: number
}

export type MetaPixelStandardEventParameters = {
  AddPaymentInfo: AddPaymentInfoParameters
  AddToCart: AddToCartParameters
  AddToWishlist: AddToWishlistParameters
  CompleteRegistration: CompleteRegistrationParameters
  Contact: undefined
  CustomizeProduct: undefined
  Donate: undefined
  FindLocation: undefined
  InitiateCheckout: InitiateCheckoutParameters
  Lead: LeadParameters
  PageView: undefined
  Purchase: PurchaseParameters
  Schedule: undefined
  Search: SearchParameters
  StartTrial: SubscriptionParameters
  SubmitApplication: undefined
  Subscribe: SubscriptionParameters
  ViewContent: ViewContentParameters
}

export interface MetaPixelCustomParameters {
  [key: string]: MetaPixelCustomParameterValue
}

export type MetaPixelCustomParameterValue =
  | MetaPixelPrimitive
  | MetaPixelPrimitive[]
  | MetaPixelCustomParameters
  | MetaPixelCustomParameters[]

type MetaPixelStandardEventPayload = {
  [Name in MetaPixelStandardEventName]: {
    kind?: 'standard'
    name: Name
    parameters?: MetaPixelStandardEventParameters[Name]
  }
}[MetaPixelStandardEventName]

type MetaPixelCustomEventPayload = {
  kind: 'custom'
  name: MetaPixelKnownCustomEventName | (string & {})
  parameters?: MetaPixelCustomParameters
}

export type MetaPixelEventPayload =
  | MetaPixelStandardEventPayload
  | MetaPixelCustomEventPayload

type MetaPixelFunction = ((command: string, eventOrPixelId?: string, data?: unknown) => void) & {
  callMethod?: (...args: unknown[]) => void
  loaded?: boolean
  push?: (...args: unknown[]) => number
  queue: unknown[][]
  version?: string
}

declare global {
  interface Window {
    _fbq?: MetaPixelFunction
    fbq?: MetaPixelFunction
  }
}

let hasInitializedMetaPixel = false
let lastTrackedPageKey: string | null = null

const canUseDom = () => typeof document !== 'undefined' && typeof window !== 'undefined'

const normalizeAlpha = (value: string) => value.trim().toLowerCase().replace(/[^a-z]/g, '')
const normalizeLowercase = (value: string) => value.trim().toLowerCase()
const normalizeDigits = (value: string) => value.replace(/\D/g, '')
const normalizeCompactLowercase = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '')

const normalizeAdvancedMatching = (
  advancedMatching?: MetaPixelAdvancedMatching,
): MetaPixelAdvancedMatching | undefined => {
  if (!advancedMatching) {
    return undefined
  }

  const normalized: MetaPixelAdvancedMatching = {}

  if (advancedMatching.em) normalized.em = normalizeLowercase(advancedMatching.em)
  if (advancedMatching.fn) normalized.fn = normalizeAlpha(advancedMatching.fn)
  if (advancedMatching.ln) normalized.ln = normalizeAlpha(advancedMatching.ln)
  if (advancedMatching.ph) normalized.ph = normalizeDigits(advancedMatching.ph)
  if (advancedMatching.external_id) normalized.external_id = advancedMatching.external_id.trim()
  if (advancedMatching.ge) {
    const gender = normalizeLowercase(advancedMatching.ge)
    if (gender === 'f' || gender === 'm') {
      normalized.ge = gender
    }
  }
  if (advancedMatching.db) normalized.db = normalizeDigits(advancedMatching.db)
  if (advancedMatching.ct) normalized.ct = normalizeCompactLowercase(advancedMatching.ct)
  if (advancedMatching.st) normalized.st = normalizeLowercase(advancedMatching.st)
  if (advancedMatching.zp) normalized.zp = advancedMatching.zp.trim()
  if (advancedMatching.country) normalized.country = normalizeLowercase(advancedMatching.country)

  return Object.keys(normalized).length > 0 ? normalized : undefined
}

const ensureMetaPixelStub = () => {
  if (!canUseDom()) {
    return null
  }

  if (window.fbq) {
    return window.fbq
  }

  const fbq: MetaPixelFunction = ((...args: unknown[]) => {
    if (fbq.callMethod) {
      fbq.callMethod(...args)
      return
    }

    fbq.queue.push(args)
  }) as MetaPixelFunction

  fbq.queue = []
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.push = (...args: unknown[]) => fbq.queue.push(args)

  window.fbq = fbq

  if (!window._fbq) {
    window._fbq = fbq
  }

  return fbq
}

const ensureMetaPixelScript = () => {
  if (!canUseDom()) {
    return
  }

  if (document.getElementById(META_PIXEL_SCRIPT_ID)) {
    return
  }

  const script = document.createElement('script')
  script.id = META_PIXEL_SCRIPT_ID
  script.async = true
  script.src = META_PIXEL_SCRIPT_SRC

  const firstScript = document.getElementsByTagName('script')[0]

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript)
    return
  }

  document.head.appendChild(script)
}

const isStandardEvent = (name: string): name is MetaPixelStandardEventName => {
  return META_PIXEL_STANDARD_EVENTS.includes(name as MetaPixelStandardEventName)
}

const isCustomEventNameValid = (name: string) => name.trim().length > 0 && name.trim().length <= 50

export const initMetaPixel = (advancedMatching?: MetaPixelAdvancedMatching) => {
  const fbq = ensureMetaPixelStub()

  if (!fbq) {
    return false
  }

  ensureMetaPixelScript()

  if (hasInitializedMetaPixel) {
    return true
  }

  const normalizedAdvancedMatching = normalizeAdvancedMatching(advancedMatching)

  if (normalizedAdvancedMatching) {
    fbq('init', META_PIXEL_ID, normalizedAdvancedMatching)
  } else {
    fbq('init', META_PIXEL_ID)
  }

  hasInitializedMetaPixel = true
  return true
}

export const trackMetaPageView = (pageKey?: string) => {
  if (!initMetaPixel()) {
    return false
  }

  const resolvedPageKey =
    pageKey ??
    (canUseDom()
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : null)

  if (resolvedPageKey && resolvedPageKey === lastTrackedPageKey) {
    return false
  }

  lastTrackedPageKey = resolvedPageKey ?? lastTrackedPageKey
  window.fbq?.('track', 'PageView')
  return true
}

export const trackMetaEvent = (payload: MetaPixelEventPayload) => {
  if (!initMetaPixel()) {
    return false
  }

  if (payload.kind === 'custom') {
    if (!isCustomEventNameValid(payload.name)) {
      console.warn('Meta Pixel custom event names must be 1-50 characters long.')
      return false
    }

    window.fbq?.('trackCustom', payload.name.trim(), payload.parameters)
    return true
  }

  if (!isStandardEvent(payload.name)) {
    console.warn(`Unsupported Meta Pixel standard event: ${payload.name}`)
    return false
  }

  window.fbq?.('track', payload.name, payload.parameters)
  return true
}

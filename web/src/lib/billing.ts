export type TokenProvider = () => Promise<string | null>

export type BillingStatus = {
  canManageBilling: boolean
  checkoutRequired: boolean
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
  isStripeConfigured: boolean
  status: string | null
}

const resolveApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin)
}

const createApiUrl = (path: string) => {
  return new URL(path, resolveApiBaseUrl()).toString()
}

const requestBilling = async <T>(
  path: string,
  {
    body,
    getToken,
    method = 'GET',
  }: {
    body?: Record<string, string | undefined>
    getToken: TokenProvider
    method?: 'GET' | 'POST'
  },
): Promise<T> => {
  const token = await getToken()
  const response = await fetch(createApiUrl(path), {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  })

  const payload = (await response.json()) as T & {
    error?: {
      message?: string
    }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Billing request failed.')
  }

  return payload
}

export const fetchBillingStatus = (getToken: TokenProvider) => {
  return requestBilling<BillingStatus>('/api/billing/status', { getToken })
}

export const createCheckout = (
  getToken: TokenProvider,
  { cancelUrl, successUrl }: { cancelUrl: string; successUrl: string },
) => {
  return requestBilling<{ checkoutUrl: string }>('/api/billing/checkout-session', {
    body: { cancelUrl, successUrl },
    getToken,
    method: 'POST',
  })
}

export const createPortalSession = (getToken: TokenProvider, returnUrl: string) => {
  return requestBilling<{ portalUrl: string }>('/api/billing/portal-session', {
    body: { returnUrl },
    getToken,
    method: 'POST',
  })
}
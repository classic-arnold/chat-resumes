import { requestApi, type TokenProvider } from './api'

export type BillingStatus = {
  canManageBilling: boolean
  checkoutRequired: boolean
  currentPeriodEnd: string | null
  hasActiveSubscription: boolean
  isStripeConfigured: boolean
  status: string | null
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
  return requestApi<T>(path, {
    body,
    getToken,
    method,
  })
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
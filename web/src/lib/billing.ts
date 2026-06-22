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

export type BillingPlan = 'monthly' | 'annual'

export const createCheckout = (
  getToken: TokenProvider,
  {
    cancelUrl,
    plan,
    successUrl,
  }: { cancelUrl: string; plan?: BillingPlan; successUrl: string },
) => {
  return requestBilling<{ checkoutUrl: string }>('/api/billing/checkout-session', {
    body: { cancelUrl, plan, successUrl },
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
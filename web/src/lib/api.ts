export type TokenProvider = () => Promise<string | null>

const resolveApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin)
}

export const createApiUrl = (path: string) => {
  return new URL(path, resolveApiBaseUrl()).toString()
}

export const resolveSocketOrigin = () => {
  return new URL(resolveApiBaseUrl()).origin
}

export const resolveSocketPath = () => {
  return import.meta.env.VITE_SOCKET_PATH ?? '/socket.io'
}

export const requestApi = async <T>(
  path: string,
  {
    body,
    getToken,
    headers,
    method = 'GET',
  }: {
    body?: unknown
    getToken?: TokenProvider
    headers?: Record<string, string>
    method?: 'GET' | 'PATCH' | 'POST'
  } = {},
): Promise<T> => {
  const token = getToken ? await getToken() : null
  const response = await fetch(createApiUrl(path), {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  })
  const payload = (await response.json().catch(() => null)) as
    | (T & {
        error?: {
          message?: string
        }
      })
    | null

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Request failed.')
  }

  return payload as T
}
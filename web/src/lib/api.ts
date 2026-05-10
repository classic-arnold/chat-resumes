export type TokenProvider = () => Promise<string | null>

const resolveApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? 'http://localhost:4000' : window.location.origin)
}

const createNgrokHeaders = (): Record<string, string> => {
  const apiBaseUrl = resolveApiBaseUrl()

  if (!apiBaseUrl.includes('.ngrok-free.app')) {
    return {}
  }

  return {
    'ngrok-skip-browser-warning': 'true',
  }
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
    method?: 'DELETE' | 'GET' | 'PATCH' | 'POST'
  } = {},
): Promise<T> => {
  const token = getToken ? await getToken() : null
  const response = await fetch(createApiUrl(path), {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...createNgrokHeaders(),
      ...(headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  })

  if (response.status === 204) {
    return undefined as T
  }

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

export const uploadApi = async <T>(
  path: string,
  {
    file,
    fieldName = 'file',
    getToken,
  }: {
    file: File
    fieldName?: string
    getToken?: TokenProvider
  },
): Promise<T> => {
  const token = getToken ? await getToken() : null
  const formData = new FormData()
  formData.append(fieldName, file)

  const response = await fetch(createApiUrl(path), {
    body: formData,
    headers: {
      ...createNgrokHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method: 'POST',
  })
  const payload = (await response.json().catch(() => null)) as
    | (T & {
        error?: {
          message?: string
        }
      })
    | null

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Upload failed.')
  }

  return payload as T
}
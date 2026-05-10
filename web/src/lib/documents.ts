import { requestApi, uploadApi, type TokenProvider } from './api'

export type DocumentStatus = 'failed' | 'processing' | 'ready'

export type DocumentSummary = {
  id: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: DocumentStatus
  error: string | null
  createdAt: string
  updatedAt: string
}

export type DocumentsListResponse = {
  documents: DocumentSummary[]
}

export const listDocuments = (getToken: TokenProvider) => {
  return requestApi<DocumentsListResponse>('/api/documents', { getToken })
}

export const uploadDocument = (file: File, getToken: TokenProvider) => {
  return uploadApi<{ document: DocumentSummary }>('/api/documents', { file, getToken })
}

export const deleteDocument = (documentId: string, getToken: TokenProvider) => {
  return requestApi<void>(`/api/documents/${encodeURIComponent(documentId)}`, {
    getToken,
    method: 'DELETE',
  })
}

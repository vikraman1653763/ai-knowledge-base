import type { AskResponse, SearchResponse, UploadResponse } from '../types'

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { detail?: string; message?: string }
    return body.detail || body.message || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init)
  } catch {
    throw new Error(`Cannot connect to the API at ${API_BASE_URL}. Make sure the FastAPI backend is running.`)
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return response.json() as Promise<T>
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const body = new FormData()
  body.append('file', file)
  return request<UploadResponse>('/upload', { method: 'POST', body })
}

export async function askQuestion(question: string, topK: number, source?: string): Promise<AskResponse> {
  return request<AskResponse>('/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK, ...(source ? { source } : {}) }),
  })
}

export async function searchDocuments(question: string, topK: number, source?: string): Promise<SearchResponse> {
  return request<SearchResponse>('/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, top_k: topK, ...(source ? { source } : {}) }),
  })
}

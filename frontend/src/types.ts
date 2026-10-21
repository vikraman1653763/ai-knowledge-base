export interface UploadResponse {
  filename: string
  pages: number
  chunks: number
  deleted_chunks?: number
  total_chunks?: number
  message?: string
}

export interface SourceChunk {
  source: string
  page: number
  text: string
  distance?: number | null
  chunk_index?: number
}

export interface AskResponse {
  question?: string
  answer: string
  sources: SourceChunk[]
}

export interface SearchResponse {
  question?: string
  results: SourceChunk[]
}

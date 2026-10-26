export interface UploadResponse {
  filename: string
  total_pages: number
  total_chunks: number
  stored_chunks: number
  deleted_stale_chunks: number
  collection_count: number
  message?: string
}

export interface KnowledgeDocument {
  filename: string
  pages: number | null
  chunks: number
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

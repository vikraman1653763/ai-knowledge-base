import { useState, type FormEvent } from 'react'
import { FileSearch, LoaderCircle, Search, FileText } from 'lucide-react'
import { searchDocuments } from '../lib/api'
import type { SourceChunk } from '../types'

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [results, setResults] = useState<SourceChunk[]>([])
  const [busy, setBusy] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!query.trim() || busy) return
    setBusy(true)
    setError('')
    setSearched(false)
    try {
      const response = await searchDocuments(query.trim(), topK)
      setResults(response.results ?? [])
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="search-workspace">
      <div className="search-title">
        <div className="welcome-icon"><FileSearch size={20} /></div>
        <p className="eyebrow">RETRIEVAL EXPLORER</p>
        <h1>Semantic search<span>.</span></h1>
        <p className="welcome-copy">Find the most relevant passages in your documents without generating an AI answer.</p>
      </div>
      <form className="search-form" onSubmit={submit}>
        <Search size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts, facts, or phrases…" aria-label="Search documents" />
        <select value={topK} onChange={(event) => setTopK(Number(event.target.value))} aria-label="Number of results">
          <option value={3}>Top 3</option><option value={5}>Top 5</option><option value={8}>Top 8</option><option value={10}>Top 10</option>
        </select>
        <button type="submit" disabled={!query.trim() || busy}>{busy ? <LoaderCircle size={17} className="spin" /> : 'Search'}</button>
      </form>
      {error && <div className="inline-alert error-alert">{error}</div>}
      {searched && <div className="results-summary"><strong>{results.length} passages found</strong><span>for “{query}”</span></div>}
      <div className="search-results">
        {results.map((item, index) => (
          <article className="result-card" key={`${item.source}-${item.page}-${item.chunk_index ?? index}-${index}`}>
            <div className="result-card-head"><div className="result-file"><FileText size={16} /><strong>{item.source}</strong></div><span className="page-pill">Page {item.page}</span></div>
            <p>{item.text}</p>
            <div className="result-foot"><span>Result {index + 1}</span>{typeof item.distance === 'number' && <span>Distance: {item.distance.toFixed(3)}</span>}</div>
          </article>
        ))}
        {searched && results.length === 0 && <div className="empty-results"><FileSearch size={25} /><strong>No matching passages found</strong><p>Try a broader phrase or upload more documents.</p></div>}
        {!searched && <div className="search-placeholder"><div className="placeholder-icon"><Search size={23} /></div><strong>Your results will appear here</strong><p>Enter a query to explore the passages most similar to your search.</p></div>}
      </div>
    </div>
  )
}

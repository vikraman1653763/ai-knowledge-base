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
    <div className="mx-auto w-full max-w-[850px]">
      <div className="mx-auto mb-7 mt-[5px] text-center">
        <div className="mx-auto mb-[18px] grid size-11 place-items-center rounded-[14px] bg-[#eeecff] text-[#7061e8]"><FileSearch size={20} /></div>
        <p className="mb-[10px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">RETRIEVAL EXPLORER</p>
        <h1 className="mb-[14px] font-heading text-[clamp(27px,3vw,37px)] font-extrabold leading-[1.2] tracking-[-1.65px] text-[#26273b]">Semantic search<span className="text-[#7061e8]">.</span></h1>
        <p className="mx-auto mb-0 max-w-[525px] text-xs leading-[1.85] text-[#9293a6]">Find the most relevant passages in your documents without generating an AI answer.</p>
      </div>
      <form className="flex items-center gap-3 rounded-xl border border-[#e7e6f2] bg-white p-[10px_11px_10px_15px] text-[#a1a2b3] shadow-[0_8px_28px_#37306d07] max-mobile:flex-wrap" onSubmit={submit}>
        <Search className="shrink-0" size={19} />
        <input className="min-w-0 flex-1 border-0 text-[11px] text-[#55566c] outline-none placeholder:text-[#b0b1c0] max-mobile:basis-[calc(100%-40px)]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search concepts, facts, or phrases…" aria-label="Search documents" />
        <select className="rounded-[7px] border-0 bg-[#f7f7fb] px-[9px] py-[7px] text-[10px] text-[#73758a] outline-none max-mobile:ml-7" value={topK} onChange={(event) => setTopK(Number(event.target.value))} aria-label="Number of results">
          <option value={3}>Top 3</option><option value={5}>Top 5</option><option value={8}>Top 8</option><option value={10}>Top 10</option>
        </select>
        <button className="flex min-w-[72px] items-center justify-center gap-[7px] rounded-lg border-0 bg-[#7061e8] px-[15px] py-[10px] text-[10px] font-bold text-white hover:bg-[#5c4ed0] disabled:opacity-55 max-mobile:ml-auto" type="submit" disabled={!query.trim() || busy}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : 'Search'}</button>
      </form>
      {error && <div className="mt-3 flex items-start gap-2 wrap-anywhere rounded-[9px] border border-[#ffe0e3] bg-[#fff1f2] px-[11px] py-[10px] text-[10px] leading-[1.6] text-[#b64a5b]">{error}</div>}
      {searched && <div className="mb-3 mt-6 flex items-center gap-2 text-[10px] text-[#999aad]"><strong className="text-[#55566d]">{results.length} passages found</strong><span>for “{query}”</span></div>}
      <div className="grid gap-3">
        {results.map((item, index) => (
          <article className="rounded-xl border border-[#ebebf4] bg-white p-4" key={`${item.source}-${item.page}-${item.chunk_index ?? index}-${index}`}>
            <div className="flex items-center justify-between gap-[10px]"><div className="flex min-w-0 items-center gap-2 text-[#8477e3]"><FileText size={16} /><strong className="wrap-anywhere text-[10px] text-[#5e5f76]">{item.source}</strong></div><span className="whitespace-nowrap rounded-md bg-[#f3f1ff] px-[7px] py-[5px] text-[9px] text-[#8275de]">Page {item.page}</span></div>
            <p className="my-[13px] whitespace-pre-wrap wrap-anywhere text-[11px] leading-[1.85] text-[#83859a]">{item.text}</p>
            <div className="flex justify-between border-t border-[#f2f1f7] pt-[10px] text-[9px] text-[#aaaabb]"><span>Result {index + 1}</span>{typeof item.distance === 'number' && <span>Distance: {item.distance.toFixed(3)}</span>}</div>
          </article>
        ))}
        {searched && results.length === 0 && <div className="mt-[17px] flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e3e2ef] bg-[#fbfbfe] px-5 py-[45px] text-center text-[#9a9bae]"><FileSearch className="mb-[13px] text-[#8c7fe6]" size={25} /><strong className="mb-[7px] text-[11px] text-[#73748a]">No matching passages found</strong><p className="mb-0 text-[10px] leading-[1.7]">Try a broader phrase or upload more documents.</p></div>}
        {!searched && <div className="mt-[17px] flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e3e2ef] bg-[#fbfbfe] px-5 py-[45px] text-center text-[#9a9bae]"><div className="mb-[14px] grid size-[45px] place-items-center rounded-[14px] bg-[#efedff] text-[#8a7ce8]"><Search size={23} /></div><strong className="mb-[7px] text-[11px] text-[#73748a]">Your results will appear here</strong><p className="mb-0 text-[10px] leading-[1.7]">Enter a query to explore the passages most similar to your search.</p></div>}
      </div>
    </div>
  )
}

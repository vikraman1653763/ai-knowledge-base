import { useEffect, useState, type FormEvent } from 'react'
import { ArrowUp, BookOpenText, Check, Copy, FileText, LoaderCircle, Sparkles } from 'lucide-react'
import { askQuestion } from '../lib/api'
import type { AskResponse } from '../types'

interface AnswerPanelProps {
  onAnswer: (result: AskResponse) => void
  lastAnswer: AskResponse | null
}

const suggestions = [
  { title: 'Career timeline', question: 'Summarize my work experience and dates.' },
  { title: 'Key achievements', question: 'What are the main achievements mentioned in my documents?' },
  { title: 'Find a detail', question: 'What specific dates or details are stated in my documents?' },
]

const HISTORY_KEY = 'knowbase-question-history'

function readQuestionHistory(): string[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    const parsed: unknown = stored ? JSON.parse(stored) : []
    if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) return []
    return parsed.slice(0, 3)
  } catch {
    return []
  }
}

export default function AnswerPanel({ onAnswer, lastAnswer }: AnswerPanelProps) {
  const [question, setQuestion] = useState('')
  const [topK, setTopK] = useState(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [questionHistory, setQuestionHistory] = useState(readQuestionHistory)

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(questionHistory))
    } catch {
      setError('Question history could not be saved in this browser.')
    }
  }, [questionHistory])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError('')
    setCopied(false)
    try {
      const result = await askQuestion(trimmed, topK)
      onAnswer(result)
      setQuestionHistory((history) => [
        trimmed,
        ...history.filter((item) => item.toLocaleLowerCase() !== trimmed.toLocaleLowerCase()),
      ].slice(0, 3))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get an answer.')
    } finally {
      setBusy(false)
    }
  }

  async function copyAnswer() {
    if (!lastAnswer?.answer) return
    try {
      await navigator.clipboard.writeText(lastAnswer.answer)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Clipboard access was blocked by your browser.')
    }
  }

  return (
    <div className="w-full">
      <div className="mx-auto mb-[26px] max-w-[620px] text-center">
        <div className="mx-auto mb-[18px] grid size-11 place-items-center rounded-[14px] bg-[#eeecff] text-[#7061e8]"><Sparkles size={20} /></div>
        <p className="mb-[10px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">AI KNOWLEDGE ASSISTANT</p>
        <h1 className="mb-[14px] font-heading text-[clamp(27px,3vw,37px)] font-extrabold leading-[1.2] tracking-[-1.65px] text-[#26273b]">Ask your documents<span className="text-[#7061e8]">.</span></h1>
        <p className="mx-auto mb-0 max-w-[525px] text-xs leading-[1.85] text-[#9293a6]">Your files hold the answers. Ask a question and get a response grounded in your knowledge base, with source references to verify it.</p>
      </div>

      <form className="rounded-[15px] border border-[#e7e6f2] bg-white px-[17px] pb-[13px] pt-4 shadow-[0_8px_30px_#37306d08] transition-[border-color,box-shadow] focus-within:border-[#c6c0ff] focus-within:shadow-[0_8px_28px_#7061e812]" onSubmit={submit}>
        <textarea
          className="block min-h-[75px] w-full resize-y border-0 bg-transparent text-xs leading-[1.7] text-[#393a50] outline-none placeholder:text-[#b0b1c1]"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about your uploaded documents…"
          rows={3}
          maxLength={2000}
          aria-label="Your question"
        />
        <div className="flex items-center justify-between border-t border-[#f0eff6] pt-[11px] max-mobile:gap-[10px]">
          <label className="flex items-center gap-[9px] text-[10px] text-[#a0a1b2] max-mobile:gap-[5px]">Context chunks
            <select className="rounded-[7px] border-0 bg-[#f7f7fb] px-[9px] py-[7px] text-[10px] text-[#73758a] outline-none" value={topK} onChange={(event) => setTopK(Number(event.target.value))} aria-label="Number of context chunks">
              <option value={1}>1 chunk</option>
              <option value={3}>3 chunks</option>
              <option value={5}>5 chunks</option>
              <option value={8}>8 chunks</option>
              <option value={10}>10 chunks</option>
            </select>
          </label>
          <button className="flex items-center gap-2 rounded-[9px] border-0 bg-[#7061e8] px-[13px] py-[10px] text-[11px] font-semibold text-white shadow-[0_4px_10px_#7061e82b] transition hover:-translate-y-px hover:bg-[#5c4ed0] disabled:hover:translate-y-0 max-mobile:px-[10px] max-mobile:py-[9px]" type="submit" disabled={!question.trim() || busy}>
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowUp size={18} />}
            <span className="max-mobile:text-[10px]">{busy ? 'Thinking…' : 'Ask question'}</span>
          </button>
        </div>
      </form>

      {error && <div className="mt-3 flex items-start gap-2 wrap-anywhere rounded-[9px] border border-[#ffe0e3] bg-[#fff1f2] px-[11px] py-[10px] text-[10px] leading-[1.6] text-[#b64a5b]"><span>{error}</span></div>}

      <div className="mt-[31px]">
        <p className="mb-3 text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">TRY ASKING</p>
        <div className="grid grid-cols-3 gap-[10px] max-desktop:gap-[7px] max-mobile:grid-cols-1">
          {(questionHistory.length
            ? questionHistory.map((item) => ({ title: 'Recent question', question: item }))
            : suggestions
          ).map((item, index) => (
            <button key={`${item.question}-${index}`} type="button" className="relative min-h-[105px] rounded-[11px] border border-[#ebebf4] bg-white p-[14px_13px] text-left transition hover:-translate-y-0.5 hover:border-[#cfcaff] hover:bg-[#fcfbff] max-desktop:p-[12px_10px] max-mobile:min-h-0 max-mobile:p-[13px]">
              <span className="text-[11px] font-bold text-[#515269]">{item.title}</span><p className="mb-0 mr-3 mt-2 text-[10px] leading-[1.6] text-[#a0a1b1] max-mobile:mt-[5px]">{item.question}</p><span className="absolute bottom-[10px] right-[11px] text-[13px] text-[#aaa4ee]">↗</span>
            </button>
          ))}
        </div>
      </div>

      {lastAnswer && (
        <section className="mt-[25px] overflow-hidden rounded-[14px] border border-[#e9e8f3] bg-white shadow-[0_8px_30px_#37306d06]" aria-live="polite">
          <div className="flex items-center justify-between border-b border-[#f0eff6] px-[18px] py-[15px]">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[.8px] text-[#73748b]"><span className="grid place-items-center text-[#7061e8]"><Sparkles size={15} /></span><span>ANSWER</span></div>
            <button className="flex items-center gap-[6px] rounded-[7px] border border-[#eeecff] bg-[#f8f7ff] px-[9px] py-[7px] text-[9px] text-[#7e72d9]" onClick={() => void copyAnswer()}><span className="flex">{copied ? <Check size={15} /> : <Copy size={15} />}</span>{copied ? 'Copied' : 'Copy answer'}</button>
          </div>
          <div className="whitespace-pre-wrap px-5 py-5 pb-[23px] text-xs leading-[1.9] text-[#4b4c62]">{lastAnswer.answer}</div>
          <div className="flex items-center gap-2 border-t border-[#f0eff6] bg-[#fbfbfe] px-[19px] py-[13px] text-[#77788f]"><BookOpenText className="text-[#8b7de8]" size={17} /><strong className="text-[10px]">Sources</strong><span className="ml-auto text-[9px] text-[#a4a5b5]">{lastAnswer.sources?.length ?? 0} references</span></div>
          <div className="px-[17px] pb-2">
            {lastAnswer.sources?.map((source, index) => (
              <article className="flex gap-[11px] border-b border-[#f1f1f6] px-[2px] py-[15px] last:border-b-0" key={`${source.source}-${source.page}-${source.chunk_index ?? index}-${index}`}>
                <div className="grid h-8 w-[30px] shrink-0 place-items-center rounded-lg bg-[#f1efff] text-[#8275df]"><FileText size={17} /></div>
                <div className="min-w-0 flex-1">
                  <div className="mb-[7px] flex items-start justify-between gap-[10px]"><strong className="wrap-anywhere text-[10px] text-[#65667d]">{source.source}</strong><span className="whitespace-nowrap rounded-[5px] bg-[#f4f2ff] px-[6px] py-1 text-[8px] text-[#8b7ee0]">Page {source.page}</span></div>
                  <p className="mb-0 whitespace-pre-wrap wrap-anywhere text-[10px] leading-[1.75] text-[#999aad]">{source.text}</p>
                </div>
              </article>
            ))}
            {!lastAnswer.sources?.length && <p className="text-[10px] text-[#999aad]">No source references were returned for this answer.</p>}
          </div>
        </section>
      )}

      <div className="mt-7 flex items-start gap-[9px] text-[10px] leading-[1.7] text-[#a0a1b0]"><span className="mt-[5px] size-[6px] shrink-0 rounded-full bg-[#a5a0ee]" /><span>Answers are generated from retrieved document context. Always verify important details against the source.</span></div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
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

export default function AnswerPanel({ onAnswer, lastAnswer }: AnswerPanelProps) {
  const [question, setQuestion] = useState('')
  const [topK, setTopK] = useState(3)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

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
    <div className="ask-workspace">
      <div className="welcome-block">
        <div className="welcome-icon"><Sparkles size={20} /></div>
        <p className="eyebrow">AI KNOWLEDGE ASSISTANT</p>
        <h1>Ask your documents<span>.</span></h1>
        <p className="welcome-copy">Your files hold the answers. Ask a question and get a response grounded in your knowledge base, with source references to verify it.</p>
      </div>

      <form className="question-box" onSubmit={submit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about your uploaded documents…"
          rows={3}
          maxLength={2000}
          aria-label="Your question"
        />
        <div className="question-controls">
          <label className="topk-control">Context chunks
            <select value={topK} onChange={(event) => setTopK(Number(event.target.value))} aria-label="Number of context chunks">
              <option value={1}>1 chunk</option>
              <option value={3}>3 chunks</option>
              <option value={5}>5 chunks</option>
              <option value={8}>8 chunks</option>
              <option value={10}>10 chunks</option>
            </select>
          </label>
          <button className="send-button" type="submit" disabled={!question.trim() || busy}>
            {busy ? <LoaderCircle size={17} className="spin" /> : <ArrowUp size={18} />}
            <span>{busy ? 'Thinking…' : 'Ask question'}</span>
          </button>
        </div>
      </form>

      {error && <div className="inline-alert error-alert"><span>{error}</span></div>}

      {!lastAnswer && (
        <div className="suggestions">
          <p className="section-kicker">TRY ASKING</p>
          <div className="suggestion-grid">
            {suggestions.map((item) => (
              <button key={item.title} className="suggestion-card" onClick={() => setQuestion(item.question)}>
                <span>{item.title}</span><p>{item.question}</p><span className="suggestion-arrow">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {lastAnswer && (
        <section className="answer-card" aria-live="polite">
          <div className="answer-topline">
            <div className="answer-label"><span className="answer-spark"><Sparkles size={15} /></span><span>ANSWER</span></div>
            <button className="copy-button" onClick={() => void copyAnswer()}><span>{copied ? <Check size={15} /> : <Copy size={15} />}</span>{copied ? 'Copied' : 'Copy answer'}</button>
          </div>
          <div className="answer-text">{lastAnswer.answer}</div>
          <div className="sources-heading"><BookOpenText size={17} /><strong>Sources</strong><span>{lastAnswer.sources?.length ?? 0} references</span></div>
          <div className="source-list">
            {lastAnswer.sources?.map((source, index) => (
              <article className="source-item" key={`${source.source}-${source.page}-${source.chunk_index ?? index}-${index}`}>
                <div className="source-file-icon"><FileText size={17} /></div>
                <div className="source-content">
                  <div className="source-meta"><strong>{source.source}</strong><span>Page {source.page}</span></div>
                  <p>{source.text}</p>
                </div>
              </article>
            ))}
            {!lastAnswer.sources?.length && <p className="no-sources">No source references were returned for this answer.</p>}
          </div>
        </section>
      )}

      <div className="grounding-note"><span className="note-dot" /><span>Answers are generated from retrieved document context. Always verify important details against the source.</span></div>
    </div>
  )
}

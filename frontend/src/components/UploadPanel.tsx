import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { CheckCircle2, FileText, LoaderCircle, UploadCloud, X } from 'lucide-react'
import { uploadPdf } from '../lib/api'
import type { UploadResponse } from '../types'

interface UploadPanelProps {
  onUploaded: (result: UploadResponse) => void
}

export default function UploadPanel({ onUploaded }: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<UploadResponse | null>(null)

  async function processFile(file?: File) {
    if (!file) return
    setError('')
    setSuccess(null)
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type && file.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    setBusy(true)
    try {
      const result = await uploadPdf(file)
      setSuccess(result)
      onUploaded(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    void processFile(event.target.files?.[0])
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void processFile(event.dataTransfer.files?.[0])
  }

  return (
    <section className="panel upload-panel" id="documents">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR LIBRARY</p>
          <h2>Knowledge sources</h2>
        </div>
        <span className="heading-icon"><FilesIcon /></span>
      </div>
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${busy ? 'uploading' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/pdf,.pdf" onChange={handleInput} />
        <div className="upload-symbol">{busy ? <LoaderCircle className="spin" size={23} /> : <UploadCloud size={23} />}</div>
        <strong>{busy ? 'Processing your PDF…' : 'Drop a PDF here'}</strong>
        <span>or <button className="text-button" onClick={() => inputRef.current?.click()} disabled={busy}>browse files</button></span>
        <small>PDF files only</small>
      </div>

      {error && <div className="inline-alert error-alert"><X size={16} /><span>{error}</span></div>}
      {success && (
        <div className="inline-alert success-alert">
          <CheckCircle2 size={17} />
          <div><strong>{success.filename}</strong><span>{success.pages} pages · {success.chunks} chunks indexed</span></div>
          <button className="icon-button small" aria-label="Dismiss upload message" onClick={() => setSuccess(null)}><X size={15} /></button>
        </div>
      )}

      <div className="library-empty">
        <div className="empty-file-icon"><FileText size={19} /></div>
        <div><strong>Ready to build your library</strong><p>Upload a PDF to make its contents searchable.</p></div>
      </div>
    </section>
  )
}

function FilesIcon() {
  return <FileText size={18} />
}

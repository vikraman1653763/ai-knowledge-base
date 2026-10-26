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
    <section className="rounded-[13px] border border-[#ebebf4] bg-white p-[19px]" id="documents">
      <div className="mb-[19px] flex items-center justify-between">
        <div>
          <p className="mb-[7px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">YOUR LIBRARY</p>
          <h2 className="m-0 font-heading text-sm font-bold tracking-[-.3px] text-[#37384d]">Knowledge sources</h2>
        </div>
        <span className="grid size-[31px] place-items-center rounded-[9px] bg-[#f0eeff] text-[#8174e7]"><FilesIcon /></span>
      </div>
      <div
        className={`flex min-h-[173px] flex-col items-center justify-center rounded-[11px] border border-dashed border-[#d8d5f0] bg-[#fcfbff] px-[10px] pb-[15px] pt-5 transition ${dragging ? 'border-[#7061e8] bg-[#f3f1ff]' : ''} ${busy ? 'opacity-75' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input ref={inputRef} id="pdf-upload-input" className="sr-only" type="file" accept="application/pdf,.pdf" onChange={handleInput} />
        <div className="mb-3 grid size-[42px] place-items-center rounded-[13px] bg-[#eeecff] text-[#7061e8]">{busy ? <LoaderCircle className="animate-spin" size={23} /> : <UploadCloud size={23} />}</div>
        <strong className="mb-[7px] text-[11px] text-[#505168]">{busy ? 'Processing your PDF…' : 'Drop a PDF here'}</strong>
        <span className="text-[10px] text-[#9b9caf]">or <button className="border-0 bg-transparent p-0 text-inherit font-bold text-[#7061e8]" onClick={() => inputRef.current?.click()} disabled={busy}>browse files</button></span>
        <small className="mt-3 text-[9px] text-[#b0b1bf]">PDF files only</small>
      </div>

      {error && <div className="mt-3 flex items-start gap-2 wrap-anywhere rounded-[9px] border border-[#ffe0e3] bg-[#fff1f2] px-[11px] py-[10px] text-[10px] leading-[1.6] text-[#b64a5b]"><X size={16} /><span>{error}</span></div>}
      {success && (
        <div className="mt-3 flex items-start gap-2 overflow-wrap-anywhere rounded-[9px] border border-[#d6f2e4] bg-[#effaf5] px-[11px] py-[10px] text-[10px] leading-[1.6] text-[#328464]">
          <CheckCircle2 size={17} />
          <div className="grid min-w-0 flex-1 gap-[3px]"><strong className="wrap-anywhere text-[10px]">{success.filename}</strong><span className="text-[9px] text-[#6c9d88]">{success.total_pages} pages · {success.total_chunks} chunks indexed</span></div>
          <button className="relative inline-grid place-items-center rounded-lg border-0 bg-transparent p-[2px] text-[#85869b] hover:bg-[#f4f3ff] hover:text-[#7061e8]" aria-label="Dismiss upload message" onClick={() => setSuccess(null)}><X size={15} /></button>
        </div>
      )}
    </section>
  )
}

function FilesIcon() {
  return <FileText size={18} />
}

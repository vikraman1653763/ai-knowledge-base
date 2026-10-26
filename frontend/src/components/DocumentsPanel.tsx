import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, FileText, LoaderCircle, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { deleteDocument, listDocuments } from '../lib/api'
import type { KnowledgeDocument } from '../types'
import UploadPanel from './UploadPanel'

interface DocumentsPanelProps {
  onDocumentsChange: (count: number) => void
}

export default function DocumentsPanel({ onDocumentsChange }: DocumentsPanelProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState('')
  const [error, setError] = useState('')

  const refreshDocuments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await listDocuments()
      setDocuments(result)
      onDocumentsChange(result.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load documents.')
    } finally {
      setLoading(false)
    }
  }, [onDocumentsChange])

  useEffect(() => {
    void refreshDocuments()
  }, [refreshDocuments])

  function handleUploaded() {
    void refreshDocuments()
  }

  async function handleDelete(filename: string) {
    if (!window.confirm(`Delete "${filename}" and all of its indexed chunks? This cannot be undone.`)) return
    setDeleting(filename)
    setError('')
    try {
      await deleteDocument(filename)
      await refreshDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this document.')
    } finally {
      setDeleting('')
    }
  }

  function focusUpload() {
    const input = document.getElementById('pdf-upload-input')
    if (input instanceof HTMLInputElement) input.click()
  }

  return (
    <div className="mx-auto w-full max-w-[1050px]">
      <div className="mx-auto mb-7 mt-[5px] text-center">
        <div className="mx-auto mb-[18px] grid size-11 place-items-center rounded-[14px] bg-[#eeecff] text-[#7061e8]"><FileText size={20} /></div>
        <p className="mb-[10px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">YOUR LIBRARY</p>
        <h1 className="mb-[14px] font-heading text-[clamp(27px,3vw,37px)] font-extrabold leading-[1.2] tracking-[-1.65px] text-[#26273b]">Documents<span className="text-[#7061e8]">.</span></h1>
        <p className="mx-auto mb-0 max-w-[525px] text-xs leading-[1.85] text-[#9293a6]">Manage the PDFs indexed in your knowledge base.</p>
      </div>

      <div className="mb-[17px]"><UploadPanel onUploaded={handleUploaded} /></div>

      <section className="rounded-[13px] border border-[#ebebf4] bg-white p-[19px]">
        <div className="mb-[14px] flex items-center justify-between">
          <div><p className="mb-[7px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">INDEXED FILES</p><h2 className="m-0 font-heading text-sm font-bold tracking-[-.3px] text-[#37384d]">Uploaded documents</h2></div>
          <button className="inline-flex items-center justify-center gap-[7px] rounded-lg border border-[#eeecff] bg-[#f8f7ff] px-[10px] py-2 text-[10px] font-semibold text-[#786bdd] disabled:cursor-wait" type="button" onClick={() => void refreshDocuments()} disabled={loading} aria-label="Refresh documents">
            {loading ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            <span>Refresh</span>
          </button>
        </div>

        <p className="mb-[14px] rounded-lg bg-[#fbfaff] px-3 py-[10px] text-[10px] leading-[1.7] text-[#89899f]">Original PDF files are not retained by the backend, so previews are unavailable. Indexed text remains available to search and ask questions.</p>
        {error && <div className="mt-3 flex items-start gap-2 wrap-anywhere rounded-[9px] border border-[#ffe0e3] bg-[#fff1f2] px-[11px] py-[10px] text-[10px] leading-[1.6] text-[#b64a5b]" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}

        {loading && documents.length === 0 ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-[10px] text-[10px] text-[#9293a6]"><LoaderCircle className="animate-spin" size={21} /><span>Loading documents…</span></div>
        ) : documents.length === 0 && !loading ? (
          <div className="flex min-h-[150px] flex-col items-center justify-center gap-[10px] px-[15px] py-[22px] text-center text-[10px] text-[#9293a6]">
            <div className="mb-[2px] grid size-[45px] place-items-center rounded-[14px] bg-[#efedff] text-[#8a7ce8]"><UploadCloud size={22} /></div>
            <strong className="text-[11px] text-[#73748a]">{error ? 'Documents could not be loaded' : 'Your library is empty'}</strong>
            <p className="mb-0 text-[10px] leading-[1.7]">{error ? 'Try refreshing the list.' : 'Upload a PDF to make its contents searchable.'}</p>
            <button className="mt-1 rounded-lg border-0 bg-[#7061e8] px-[13px] py-[9px] text-[10px] font-semibold text-white" type="button" onClick={error ? () => void refreshDocuments() : focusUpload}>
              {error ? 'Retry' : 'Upload a PDF'}
            </button>
          </div>
        ) : documents.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-[10px]">
              <thead><tr className="bg-[#fbfbfe] text-[9px] font-bold uppercase tracking-[.5px] text-[#999aad]"><th className="min-w-[190px] px-[10px] py-[11px]">Document</th><th className="px-[10px] py-[11px]">Pages</th><th className="px-[10px] py-[11px]">Chunks</th><th className="min-w-[175px] px-[10px] py-[11px]">Actions</th></tr></thead>
              <tbody>
                {documents.map((doc) => (
                  <tr className="text-[#77788f] last:[&>td]:border-b-0" key={doc.filename}>
                    <td className="border-b border-[#f0eff6] px-[10px] py-[13px]"><span className="flex items-center gap-[9px] font-semibold text-[#65667d] [overflow-wrap:anywhere]"><FileText className="shrink-0 text-[#8275df]" size={17} />{doc.filename}</span></td>
                    <td className="border-b border-[#f0eff6] px-[10px] py-[13px]">{doc.pages ?? '—'}</td>
                    <td className="border-b border-[#f0eff6] px-[10px] py-[13px]">{doc.chunks}</td>
                    <td className="border-b border-[#f0eff6] px-[10px] py-[13px]">
                      <button className="inline-flex items-center justify-center gap-[7px] rounded-lg border border-[#ffe0e3] bg-[#fff8f8] px-[9px] py-[7px] text-[10px] font-semibold text-[#b64a5b]" type="button" onClick={() => void handleDelete(doc.filename)} disabled={deleting === doc.filename}>
                        {deleting === doc.filename ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        <span>{deleting === doc.filename ? 'Deleting…' : 'Delete'}</span>
                      </button>
                      <span className="ml-[11px] inline-block text-[9px] text-[#a0a1b0]" title="Original PDFs are not stored by the backend">View unavailable</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  )
}

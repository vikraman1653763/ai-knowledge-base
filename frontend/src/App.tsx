import { useState } from 'react'
import { Bell, ChevronDown, Command, Menu, PanelLeftClose, ShieldCheck } from 'lucide-react'
import Sidebar, { type WorkspaceView } from './components/Sidebar'
import UploadPanel from './components/UploadPanel'
import AnswerPanel from './components/AnswerPanel'
import SearchPanel from './components/SearchPanel'
import type { AskResponse, UploadResponse } from './types'

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('ask')
  const [lastAnswer, setLastAnswer] = useState<AskResponse | null>(null)
  const [uploadedCount, setUploadedCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lastUpload, setLastUpload] = useState<UploadResponse | null>(null)

  function handleUploaded(result: UploadResponse) {
    setLastUpload(result)
    setUploadedCount((count) => count + (count === 0 ? 1 : 0))
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <div className={`sidebar-wrap ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar activeView={activeView} onViewChange={(view) => { setActiveView(view); setSidebarOpen(false) }} documentCount={uploadedCount} />
      </div>
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeView === 'ask' ? 'AI assistant' : 'Semantic search'}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="api-status"><span className="status-dot" /> API connected locally</div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="avatar">V</div>
            <button className="profile-button"><span>Personal workspace</span><ChevronDown size={15} /></button>
          </div>
        </header>

        <div className="page-content">
          <div className="page-main-column">
            <div className="workspace-toolbar">
              <div className="workspace-label-pill"><span className="tiny-purple-dot" /> PERSONAL KNOWLEDGE BASE</div>
              <div className="shortcut-hint"><Command size={13} /> Local development</div>
            </div>
            {activeView === 'ask'
              ? <AnswerPanel lastAnswer={lastAnswer} onAnswer={setLastAnswer} />
              : <SearchPanel />}
            <footer className="main-footer"><span>Knowbase AI</span><span>Built for your documents</span><span className="footer-security"><ShieldCheck size={14} /> Private local workspace</span></footer>
          </div>
          <aside className="right-rail">
            <UploadPanel onUploaded={handleUploaded} />
            <section className="panel how-panel">
              <div className="panel-heading"><div><p className="eyebrow">HOW IT WORKS</p><h2>From files to answers</h2></div><span className="heading-icon"><PanelLeftClose size={18} /></span></div>
              <div className="steps-list">
                <div className="step-row"><span className="step-number">01</span><div><strong>Upload a PDF</strong><p>Text is extracted from your document.</p></div></div>
                <div className="step-row"><span className="step-number">02</span><div><strong>Find relevant context</strong><p>Semantic search retrieves related chunks.</p></div></div>
                <div className="step-row"><span className="step-number">03</span><div><strong>Get grounded answers</strong><p>Gemini answers using retrieved context.</p></div></div>
              </div>
              {lastUpload && <div className="last-upload"><span className="status-dot" /><div><strong>Last uploaded</strong><p>{lastUpload.filename}</p></div></div>}
            </section>
            <div className="privacy-note"><ShieldCheck size={16} /><p><strong>Your documents stay in your workspace.</strong><br />Files are sent to your local API for processing. Questions and context are sent to the configured AI provider.</p></div>
          </aside>
        </div>
      </main>
    </div>
  )
}

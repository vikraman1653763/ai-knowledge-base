import { BookOpen, BrainCircuit, CircleHelp, Files, MessageSquareText, Search, Settings2, Sparkles } from 'lucide-react'

export type WorkspaceView = 'ask' | 'search'

interface SidebarProps {
  activeView: WorkspaceView
  onViewChange: (view: WorkspaceView) => void
  documentCount: number
}

export default function Sidebar({ activeView, onViewChange, documentCount }: SidebarProps) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" aria-label="Knowbase home">
        <span className="brand-mark"><BrainCircuit size={23} strokeWidth={2.2} /></span>
        <span className="brand-name">knowbase<span>.</span></span>
      </a>

      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">
        <button className={`nav-item ${activeView === 'ask' ? 'active' : ''}`} onClick={() => onViewChange('ask')}>
          <MessageSquareText size={18} /><span>Ask your knowledge base</span>
        </button>
        <button className={`nav-item ${activeView === 'search' ? 'active' : ''}`} onClick={() => onViewChange('search')}>
          <Search size={18} /><span>Semantic search</span>
        </button>
        <a className="nav-item" href="#documents"><Files size={18} /><span>Documents</span><span className="nav-count">{documentCount}</span></a>
      </nav>

      <div className="sidebar-bottom">
        <div className="upgrade-card">
          <div className="upgrade-icon"><Sparkles size={17} /></div>
          <strong>Your knowledge, connected.</strong>
          <p>Ask questions across your PDFs and get answers grounded in your files.</p>
        </div>
        <a className="nav-item muted-nav" href="#help"><CircleHelp size={18} /><span>Help & feedback</span></a>
        <div className="sidebar-footer"><span className="status-dot" /> Local workspace <span className="version">v0.1</span></div>
      </div>
    </aside>
  )
}

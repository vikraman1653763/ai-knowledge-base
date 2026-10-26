import { BrainCircuit, CircleHelp, Files, MessageSquareText, Search, Sparkles } from 'lucide-react'

export type WorkspaceView = 'ask' | 'search' | 'documents'

interface SidebarProps {
  activeView: WorkspaceView
  onViewChange: (view: WorkspaceView) => void
  documentCount: number
}

export default function Sidebar({ activeView, onViewChange, documentCount }: SidebarProps) {
  return (
    <aside className="flex h-full flex-col border-r border-[#ededf5] bg-white px-[17px] pb-[18px] pt-7">
      <a className="mb-[47px] flex items-center gap-[10px] px-[11px]" href="#" aria-label="Knowbase home">
        <span className="grid size-[38px] place-items-center rounded-xl bg-[linear-gradient(145deg,#8275f5,#6253d7)] text-white shadow-[0_5px_12px_#7061e82e]"><BrainCircuit size={23} strokeWidth={2.2} /></span>
        <span className="font-heading text-[23px] font-extrabold tracking-[-1.1px]">knowbase<span className="text-[#7061e8]">.</span></span>
      </a>

      <div className="mb-[13px] px-[13px] text-[10px] font-bold tracking-[1.35px] text-[#a0a1b4]">WORKSPACE</div>
      <nav className="grid gap-[5px]" aria-label="Main navigation">
        <button className={`flex w-full items-center gap-3 rounded-[10px] border-0 px-[13px] py-3 text-left text-xs font-semibold transition-colors ${activeView === 'ask' ? 'bg-[#f0efff] text-[#5c4ed0]' : 'bg-transparent text-[#7f8196] hover:bg-[#f8f7ff] hover:text-[#7061e8]'}`} onClick={() => onViewChange('ask')}>
          <MessageSquareText size={18} /><span>Ask your knowledge base</span>
        </button>
        <button className={`flex w-full items-center gap-3 rounded-[10px] border-0 px-[13px] py-3 text-left text-xs font-semibold transition-colors ${activeView === 'search' ? 'bg-[#f0efff] text-[#5c4ed0]' : 'bg-transparent text-[#7f8196] hover:bg-[#f8f7ff] hover:text-[#7061e8]'}`} onClick={() => onViewChange('search')}>
          <Search size={18} /><span>Semantic search</span>
        </button>
        <button className={`flex w-full items-center gap-3 rounded-[10px] border-0 px-[13px] py-3 text-left text-xs font-semibold transition-colors ${activeView === 'documents' ? 'bg-[#f0efff] text-[#5c4ed0]' : 'bg-transparent text-[#7f8196] hover:bg-[#f8f7ff] hover:text-[#7061e8]'}`} onClick={() => onViewChange('documents')}>
          <Files size={18} /><span>Documents</span><span className="ml-auto rounded-md bg-[#f1f1f8] px-[7px] py-[3px] text-[10px]">{documentCount}</span>
        </button>
      </nav>

      <div className="mt-auto">
        <div className="mx-[3px] mb-6 rounded-[13px] border border-[#eae7ff] bg-[linear-gradient(145deg,#faf9ff,#f6f5ff)] px-[15px] py-[17px]">
          <div className="mb-[13px] grid size-[31px] place-items-center rounded-[9px] bg-[#eae7ff] text-[#7061e8]"><Sparkles size={17} /></div>
          <strong className="mb-[6px] block text-xs">Your knowledge, connected.</strong>
          <p className="m-0 text-[10.5px] leading-[1.7] text-[#89899f]">Ask questions across your PDFs and get answers grounded in your files.</p>
        </div>
        <a className="mb-[15px] flex items-center gap-3 rounded-[10px] px-[13px] py-3 text-xs font-semibold text-[#7f8196] hover:bg-[#f8f7ff] hover:text-[#7061e8]" href="#help"><CircleHelp size={18} /><span>Help & feedback</span></a>
        <div className="flex items-center gap-[7px] border-t border-[#f0f0f5] px-[11px] pt-[18px] text-[10px] text-[#9294a6]"><span className="inline-block size-[7px] shrink-0 rounded-full bg-[#35bd87] shadow-[0_0_0_3px_#35bd871c]" /> Local workspace <span className="ml-auto text-[#b0b1c0]">v0.1</span></div>
      </div>
    </aside>
  )
}

import { useCallback, useState } from 'react'
import { Bell, ChevronDown, Command, Menu, ShieldCheck } from 'lucide-react'
import Sidebar, { type WorkspaceView } from './components/Sidebar'
import AnswerPanel from './components/AnswerPanel'
import SearchPanel from './components/SearchPanel'
import DocumentsPanel from './components/DocumentsPanel'
import type { AskResponse } from './types'

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('ask')
  const [lastAnswer, setLastAnswer] = useState<AskResponse | null>(null)
  const [documentCount, setDocumentCount] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const handleDocumentsChange = useCallback((count: number) => setDocumentCount(count), [])

  return (
    <div className="min-h-screen">
      {sidebarOpen && <button className="fixed inset-0 z-[19] hidden border-0 bg-[#1c1b2d55] max-mobile:block" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-20 w-[254px] max-mobile:-translate-x-full max-mobile:transition-transform max-mobile:duration-200 ${sidebarOpen ? 'max-mobile:translate-x-0 max-mobile:shadow-[12px_0_35px_#17152a18]' : ''}`}>
        <Sidebar activeView={activeView} onViewChange={(view) => { setActiveView(view); setSidebarOpen(false) }} documentCount={documentCount} />
      </div>
      <main className="ml-[254px] min-h-screen max-mobile:ml-0">
        <header className="flex h-[76px] items-center justify-between border-b border-[#ececf4] bg-white px-[34px] max-desktop:px-[22px] max-mobile:h-16 max-mobile:px-[15px]">
          <div className="flex min-w-0 items-center">
            <button className="relative hidden place-items-center rounded-lg bg-transparent p-[7px] text-[#85869b] hover:bg-[#f4f3ff] hover:text-[#7061e8] max-mobile:mr-2 max-mobile:inline-grid" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button>
            <div className="flex items-center gap-3 whitespace-nowrap text-[11px] text-[#9a9bad] max-mobile:gap-[7px] max-mobile:text-[10px]"><span>Workspace</span><span className="text-[#d1d1df]">/</span><strong className="font-bold text-[#3b3c51]">{activeView === 'ask' ? 'AI assistant' : activeView === 'search' ? 'Semantic search' : 'Documents'}</strong></div>
          </div>
          <div className="flex items-center gap-5 max-desktop:gap-[13px] max-mobile:gap-[9px]">
            <div className="flex items-center gap-2 border-r border-[#ededf4] pr-[19px] text-[10px] text-[#8a8ca0] max-mobile:hidden"><span className="inline-block size-[7px] shrink-0 rounded-full bg-[#35bd87] shadow-[0_0_0_3px_#35bd871c]" /> API connected locally</div>
            <button className="relative inline-grid place-items-center rounded-lg bg-transparent p-[7px] text-[#85869b] hover:bg-[#f4f3ff] hover:text-[#7061e8] max-mobile:hidden" aria-label="Notifications"><Bell size={18} /><i className="absolute right-[5px] top-[6px] size-[5px] rounded-full border border-white bg-[#f38b9d]" /></button>
            <div className="grid size-[31px] place-items-center rounded-[10px] bg-[#ece9ff] text-xs font-bold text-[#6354d5]">V</div>
            <button className="flex items-center gap-[9px] border-0 bg-transparent text-[10px] text-[#64667b] max-mobile:hidden"><span className="max-desktop:hidden">Personal workspace</span><ChevronDown size={15} /></button>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1700px] grid-cols-[minmax(0,1fr)_310px] gap-7 px-[30px] py-[27px] max-desktop:gap-[18px] max-desktop:px-5 max-desktop:py-6 max-tablet:grid-cols-1 max-mobile:gap-[25px] max-mobile:px-[15px] max-mobile:py-[21px] wide:grid-cols-[minmax(0,1fr)_330px] wide:gap-[35px] wide:px-10 wide:py-[35px]">
          <div className="flex min-w-0 flex-col">
            <div className="mb-[34px] flex items-center justify-between max-mobile:mb-[29px]">
              <div className="flex items-center gap-2 text-[9px] font-bold tracking-[1.05px] text-[#77798f]"><span className="size-[6px] rounded-full bg-[#7061e8]" /> PERSONAL KNOWLEDGE BASE</div>
              <div className="flex items-center gap-[6px] text-[9px] text-[#a4a5b7] max-mobile:hidden"><Command size={13} /> Local development</div>
            </div>
            {activeView === 'ask'
              ? <AnswerPanel lastAnswer={lastAnswer} onAnswer={setLastAnswer} />
              : activeView === 'search'
                ? <SearchPanel />
                : <DocumentsPanel onDocumentsChange={handleDocumentsChange} />}
            <footer className="mt-auto flex flex-wrap items-center gap-4 pt-9 text-[9px] text-[#b0b1c0] max-tablet:pb-[10px] max-mobile:gap-[9px]"><span className="font-bold text-[#88899e]">Knowbase AI</span><span>Built for your documents</span><span className="ml-auto flex items-center gap-[5px] max-mobile:ml-0"><ShieldCheck size={14} /> Private local workspace</span></footer>
          </div>
          {activeView !== 'documents' && <aside className="flex min-w-0 flex-col gap-[17px] max-tablet:grid max-tablet:grid-cols-2 max-tablet:items-start max-mobile:grid-cols-1">
            <div className="flex items-start gap-[9px] rounded-[11px] border border-[#e0f4eb] bg-[#f0faf6] p-[13px] text-[#5ca487] max-tablet:col-span-full max-mobile:col-span-1"><ShieldCheck className="mt-0.5 shrink-0" size={16} /><p className="m-0 text-[9px] leading-[1.7] text-[#80a897]"><strong className="font-bold text-[#4b8d72]">Your documents stay in your workspace.</strong><br />Files are sent to your local API for processing. Questions and context are sent to the configured AI provider.</p></div>
          </aside>}
        </div>
      </main>
    </div>
  )
}

import GridEditor from '../components/GridEditor';
import AssistantPanel from '../components/AssistantPanel';
import QualityPanel from '../components/QualityPanel';

export default function Home() {
  return (
    <main className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 shadow-sm z-20">
        <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center">
          <span className="text-blue-600 mr-2 text-2xl">#</span> 
          Çengel<span className="text-slate-400 font-normal ml-1">Bulmaca</span>
        </h1>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Grid Editor */}
        <div className="flex-1 relative overflow-hidden bg-slate-100">
          <GridEditor />
        </div>

        {/* Right: Assistant Panel */}
        <AssistantPanel />
      </div>

      {/* Bottom: Quality/Score Panel */}
      <QualityPanel />
    </main>
  );
}

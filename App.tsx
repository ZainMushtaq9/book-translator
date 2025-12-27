
import React, { useState } from 'react';
import { AppView } from './types';
import PDFTranslator from './components/PDFTranslator';
import ChatBot from './components/ChatBot';
import { 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PDF_TRANSLATOR);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: 'PDF Translator', view: AppView.PDF_TRANSLATOR, icon: BookOpenIcon },
    { name: 'Smart Chat', view: AppView.CHAT, icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden font-inter">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 transition-all duration-300 flex flex-col z-20 shadow-2xl`}
      >
        <div className="p-6 flex items-center justify-between">
          <span className={`${!isSidebarOpen && 'hidden'} text-white font-bold text-xl tracking-tight`}>
            UrduLink<span className="text-indigo-400">AI</span>
          </span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                currentView === item.view 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 ${currentView === item.view ? 'text-white' : 'group-hover:text-indigo-400'}`} />
              <span className={`${!isSidebarOpen && 'hidden'} ml-3 font-semibold transition-opacity`}>
                {item.name}
              </span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                ZM
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-white truncate">Zain Mushtaq</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Lead Engineer</p>
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-10">
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            {navigation.find(n => n.view === currentView)?.name}
          </h1>
          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                  System Active
                </span>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-5xl mx-auto p-8">
            {currentView === AppView.PDF_TRANSLATOR && <PDFTranslator />}
            {currentView === AppView.CHAT && <ChatBot />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

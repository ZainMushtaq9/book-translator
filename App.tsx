
import React, { useState } from 'react';
import { AppView } from './types';
import PDFTranslator from './components/PDFTranslator';
import ImageGenerator from './components/ImageGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import ChatBot from './components/ChatBot';
import VideoAnalyzer from './components/VideoAnalyzer';
import { 
  BookOpenIcon, 
  PhotoIcon, 
  MagnifyingGlassIcon, 
  ChatBubbleLeftRightIcon, 
  VideoCameraIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PDF_TRANSLATOR);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navigation = [
    { name: 'PDF Translator', view: AppView.PDF_TRANSLATOR, icon: BookOpenIcon },
    { name: 'AI Image Gen', view: AppView.IMAGE_GEN, icon: PhotoIcon },
    { name: 'Image Analysis', view: AppView.IMAGE_ANALYSIS, icon: MagnifyingGlassIcon },
    { name: 'Video Insights', view: AppView.VIDEO_ANALYSIS, icon: VideoCameraIcon },
    { name: 'Smart Chat', view: AppView.CHAT, icon: ChatBubbleLeftRightIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900 transition-all duration-300 flex flex-col z-20`}
      >
        <div className="p-6 flex items-center justify-between">
          <span className={`${!isSidebarOpen && 'hidden'} text-white font-bold text-xl tracking-tight`}>
            UrduLink<span className="text-indigo-400">AI</span>
          </span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => setCurrentView(item.view)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors group ${
                currentView === item.view 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-6 h-6 shrink-0 ${currentView === item.view ? 'text-white' : 'group-hover:text-indigo-400'}`} />
              <span className={`${!isSidebarOpen && 'hidden'} ml-3 font-medium transition-opacity`}>
                {item.name}
              </span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
           <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                ZM
              </div>
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">Zain Mushtaq</p>
                  <p className="text-xs text-slate-500 truncate">Developer</p>
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
          <h1 className="text-lg font-semibold text-slate-800">
            {navigation.find(n => n.view === currentView)?.name}
          </h1>
          <div className="flex items-center space-x-4">
             <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
               Gemini Powered
             </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {currentView === AppView.PDF_TRANSLATOR && <PDFTranslator />}
            {currentView === AppView.IMAGE_GEN && <ImageGenerator />}
            {currentView === AppView.IMAGE_ANALYSIS && <ImageAnalyzer />}
            {currentView === AppView.VIDEO_ANALYSIS && <VideoAnalyzer />}
            {currentView === AppView.CHAT && <ChatBot />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

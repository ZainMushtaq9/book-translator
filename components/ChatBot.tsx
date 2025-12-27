
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../services/geminiService';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon, GlobeAltIcon, UserIcon, SparklesIcon, CommandLineIcon } from '@heroicons/react/24/solid';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithGemini(input, []);
      const modelMessage: ChatMessage = {
        role: 'model',
        text: response.text || "I apologize, I couldn't process that request at this moment.",
        timestamp: Date.now(),
        sources: response.sources as any
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: "System Error: Failed to reach Gemini intelligence. Please check your connection.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render message text with bolding and basic markdown-like list detection
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      let processedLine = line;
      
      // Handle Bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(processedLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(processedLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={`${i}-${match.index}`} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < processedLine.length) {
        parts.push(processedLine.substring(lastIndex));
      }

      const finalContent = parts.length > 0 ? parts : processedLine;

      // Detect bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <div key={i} className="flex items-start space-x-2 my-1.5 ml-1">
            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-2 shrink-0" />
            <span className="text-sm md:text-base leading-relaxed">{finalContent}</span>
          </div>
        );
      }

      return (
        <p key={i} className={`${line.trim() === '' ? 'h-3' : 'mb-1'} text-sm md:text-base leading-relaxed tracking-tight`}>
          {finalContent}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
         <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
               <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div>
               <h3 className="text-sm font-bold text-slate-800">Gemini 3 Pro Intelligence</h3>
               <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Online
               </p>
            </div>
         </div>
         <CommandLineIcon className="w-5 h-5 text-slate-300" />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center rotate-12" />
              <div className="absolute inset-0 w-24 h-24 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-slate-200 shadow-xl">
                <SparklesIcon className="w-12 h-12 text-indigo-600" />
              </div>
            </div>
            <div className="max-w-md">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">How can I assist you, Zain?</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                I can provide weather updates, translate complex documents, or search the web for real-time information.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                 <button onClick={() => setInput("Multan ka mosam kaisa hai?")} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors">Multan weather?</button>
                 <button onClick={() => setInput("Translate 'Hello' to Urdu.")} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors">Urdu translation</button>
                 <button onClick={() => setInput("Who is the current CEO of Google?")} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 transition-colors">Search info</button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <SparklesIcon className="w-4 h-4 text-white" />}
              </div>
              <div className={`relative group ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none shadow-lg shadow-indigo-100' 
                  : 'bg-slate-50 text-slate-700 rounded-2xl rounded-tl-none border border-slate-200/60 shadow-sm'
              }`}>
                <div className="p-4 md:p-5">
                  {renderMessageContent(msg.text)}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mx-4 mb-4 pt-4 border-t border-slate-200/50 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <GlobeAltIcon className="w-3 h-3 mr-1" />
                      Verified Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, i) => s.web && (
                        <a 
                          key={i} 
                          href={s.web.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[10px] bg-white px-2 py-1 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-bold transition-all truncate max-w-[140px]"
                        >
                          {s.web.title || s.web.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <span className={`absolute -bottom-5 text-[9px] font-bold uppercase tracking-widest text-slate-400 ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 shrink-0 flex items-center justify-center">
                 <SparklesIcon className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="bg-slate-100 px-6 py-4 rounded-2xl rounded-tl-none animate-pulse flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="relative flex items-center group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything in Roman Urdu or English..."
            className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all shadow-inner text-slate-700 font-medium"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`absolute right-2 p-3 rounded-xl transition-all shadow-md ${
              !input.trim() || loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0'
            }`}
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="mt-3 text-[10px] text-center text-slate-400 font-medium italic">
          Powered by Gemini 3 Pro — Real-time Web Grounding Enabled
        </p>
      </div>
    </div>
  );
};

export default ChatBot;

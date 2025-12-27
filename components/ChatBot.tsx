
import React, { useState, useRef, useEffect } from 'react';
import { chatWithGemini } from '../services/geminiService';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon, GlobeAltIcon, UserIcon, SparklesIcon } from '@heroicons/react/24/solid';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
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
        text: response.text || "I couldn't process that.",
        timestamp: Date.now(),
        sources: response.sources as any
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-10 h-10 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Gemini 3 Pro Assistant</h3>
              <p className="text-slate-500 max-w-sm mt-2">
                Ask me anything. I can browse the web to give you the most accurate and up-to-date information.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-white" /> : <SparklesIcon className="w-4 h-4 text-white" />}
              </div>
              <div className={`p-4 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center">
                      <GlobeAltIcon className="w-3 h-3 mr-1" />
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((s, i) => s.web && (
                        <a 
                          key={i} 
                          href={s.web.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-indigo-600 hover:text-indigo-800 transition-colors truncate max-w-[150px]"
                        >
                          {s.web.title || s.web.uri}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl animate-pulse flex items-center space-x-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t bg-slate-50 rounded-b-2xl">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`absolute right-2 p-2 rounded-lg transition-all ${
              !input.trim() || loading ? 'text-slate-300' : 'text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;

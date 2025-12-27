
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, PhotoIcon, ArrowDownTrayIcon, KeyIcon } from '@heroicons/react/24/outline';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const aspectRatios = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

  const handleGenerate = async () => {
    if (!prompt) return;

    // Check for API key selection when using high-quality models
    if (typeof window.aistudio !== 'undefined') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        // Proceeding assuming selection was triggered
      }
    }

    setLoading(true);
    try {
      const url = await generateImage(prompt, aspectRatio);
      setImageUrl(url);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        // Prompt user to select a key again if request fails due to key permissions/billing
        await window.aistudio?.openSelectKey();
      } else {
        alert('Failed to generate image');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Visual Creator</h3>
            <button 
              onClick={() => window.aistudio?.openSelectKey()}
              className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <KeyIcon className="w-3 h-3 mr-1" />
              Switch API Key
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic library in Lahore with floating Urdu books..."
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Aspect Ratio</label>
            <div className="flex flex-wrap gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    aspectRatio === ratio 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt}
            className={`w-full py-4 rounded-xl flex items-center justify-center font-bold text-white transition-all ${
              loading || !prompt ? 'bg-slate-300' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90'
            }`}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Magic...
              </span>
            ) : (
              <span className="flex items-center">
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate with Gemini-3-Pro
              </span>
            )}
          </button>
          
          <p className="text-[10px] text-center text-slate-400">
            Note: High-quality image generation using gemini-3-pro-image-preview requires a <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-indigo-500">paid API key</a>.
          </p>
        </div>
      </div>

      {imageUrl ? (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
           <div className="relative group overflow-hidden rounded-xl">
              <img src={imageUrl} alt="Generated" className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <a 
                   href={imageUrl} 
                   download="urdu-link-ai-gen.png"
                   className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold flex items-center"
                 >
                   <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                   Download Image
                 </a>
              </div>
           </div>
        </div>
      ) : !loading && (
        <div className="h-64 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
          <PhotoIcon className="w-12 h-12 mb-2" />
          <p>Your generated masterpiece will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;

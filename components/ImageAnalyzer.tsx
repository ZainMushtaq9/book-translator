
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { MagnifyingGlassCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ImageAnalyzer: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('Describe this image in detail and identify key subjects.');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzeImage(base64, prompt);
      setAnalysis(result || "No analysis returned.");
    } catch (err) {
      console.error(err);
      alert('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Analyze Visuals</h3>
          <div className="space-y-4">
            <div 
              className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => document.getElementById('analyzer-upload')?.click()}
            >
              {image ? (
                <img src={image} alt="Upload" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <MagnifyingGlassCircleIcon className="w-12 h-12 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">Click to upload image</p>
                </div>
              )}
              <input 
                id="analyzer-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">What should I look for?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!image || loading}
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:bg-slate-200 flex items-center justify-center"
            >
              {loading && <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />}
              Run Deep Analysis
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-y-auto max-h-[600px]">
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Gemini Insights</h4>
        {analysis ? (
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{analysis}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20">
             <div className="w-16 h-1 bg-slate-100 rounded mb-4" />
             <p className="text-sm">Analysis report will be generated here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;


import React, { useState } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { VideoCameraIcon, BoltIcon } from '@heroicons/react/24/outline';

const VideoAnalyzer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    // Mimic processing time
    await new Promise(r => setTimeout(r, 2000));
    const response = await analyzeVideo(null as any, "Analyze the scene flow.");
    setResult(response);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-2xl mx-auto">
      <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <VideoCameraIcon className="w-10 h-10 text-purple-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Video Intelligence</h2>
      <p className="text-slate-600 mb-8 leading-relaxed">
        Upload clips to identify objects, summarize events, or extract spoken information using <span className="font-bold text-slate-900">Gemini-3-Pro-Preview</span>.
      </p>

      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 mb-8 text-left">
        <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center mb-2">
          <BoltIcon className="w-4 h-4 mr-1" />
          Production Note
        </h4>
        <p className="text-xs text-slate-400">
          Large video files are processed via asynchronous operations. This module provides the interface for file submission and insight retrieval.
        </p>
      </div>

      <button 
        onClick={handleSimulate}
        disabled={loading}
        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
      >
        {loading ? 'Submitting to Gemini...' : 'Analyze Sample Clip'}
      </button>

      {result && (
        <div className="mt-8 p-6 bg-purple-50 rounded-xl border border-purple-100 text-left">
          <p className="text-sm text-purple-900 font-medium">{result}</p>
        </div>
      )}
    </div>
  );
};

export default VideoAnalyzer;

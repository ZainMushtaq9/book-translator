
import React, { useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { translatePage } from '../services/geminiService';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  BookOpenIcon,
  ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/solid';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const PDFTranslator: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<'fast' | 'precise'>('fast');
  const [processedPages, setProcessedPages] = useState<{ original: string; translated: string; pageNum: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setProcessedPages([]);
    setProgress(0);
    
    if (file.size > 200 * 1024 * 1024) {
      setError("File size exceeds 200MB limit.");
      return;
    }

    if (file.type !== 'application/pdf') {
      setError("Please upload a PDF document.");
      return;
    }

    setIsProcessing(true);
    setStatus('Reading book content...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ 
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false
      });
      
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      for (let i = 1; i <= totalPages; i++) {
        setStatus(`Rendering Page ${i} of ${totalPages}...`);
        const page = await pdf.getPage(i);
        
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
          const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          
          setStatus(`Translating Page ${i}...`);
          
          try {
            const translation = await translatePage(base64Image, quality);
            setProcessedPages(prev => [...prev, { ...translation, pageNum: i }]);
          } catch (apiErr: any) {
            console.error(`Page ${i} failed:`, apiErr);
          }
          
          setProgress(Math.round((i / totalPages) * 100));
          canvas.width = 0;
          canvas.height = 0;
        }
      }
      setStatus('Completed! Your full book is ready for download.');
    } catch (err: any) {
      setError(err.message || "Failed to process book.");
      setStatus('Failed.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Page content copied!");
  };

  // Helper to convert Markdown formatting to HTML specifically for Word
  const formatUrduToHtml = (text: string) => {
    return text
      .split('\n\n')
      .map(para => {
        let p = para.trim();
        if (!p) return '';
        
        // Headings
        if (p.startsWith('# ')) return `<h1 style="color: #1e1b4b; text-align: right; margin-bottom: 15pt; font-family: 'Arial Unicode MS';">${p.substring(2)}</h1>`;
        if (p.startsWith('## ')) return `<h2 style="color: #312e81; text-align: right; margin-bottom: 12pt; font-family: 'Arial Unicode MS';">${p.substring(3)}</h2>`;
        
        // Lists (Bullet points and numbering)
        if (p.startsWith('* ') || p.startsWith('- ') || /^\d+\. /.test(p)) {
          const items = p.split('\n').map(line => {
             const cleanLine = line.replace(/^[\*\-\d\.]\s+/, '').trim();
             return `<li style="margin-bottom: 8pt; text-align: right;">${cleanLine}</li>`;
          }).join('');
          return `<ul dir="rtl" style="margin-bottom: 15pt; padding-right: 30pt; list-style-type: disc;">${items}</ul>`;
        }

        // Standard Paragraphs
        return `<p style="margin-bottom: 12pt; line-height: 2.2; text-align: right; font-size: 14pt;">${p.replace(/\n/g, '<br/>')}</p>`;
      })
      .join('');
  };

  const downloadFullBookAsDocx = () => {
    if (processedPages.length === 0) return;

    // Word-specific page break: br style='page-break-before:always'
    const bookHtml = processedPages.map((page, index) => `
      <div ${index > 0 ? 'style="page-break-before: always;"' : ''}>
        <div style="text-align: center; font-size: 9pt; color: #999; margin-bottom: 30pt; font-family: Arial;">— PAGE ${page.pageNum} —</div>
        <div dir="rtl" style="font-family: 'Arial Unicode MS', 'Times New Roman';">
          ${formatUrduToHtml(page.translated)}
        </div>
      </div>
    `).join('');

    const documentTemplate = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <style>
          @page { margin: 1in; }
          body { font-family: 'Arial Unicode MS', serif; }
          h1, h2, h3 { font-family: 'Arial Unicode MS'; }
          p, li { font-family: 'Arial Unicode MS'; }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 50pt; padding-top: 100pt;">
          <h1 style="font-size: 36pt; color: #4f46e5;">Urdu Translated Book</h1>
          <p style="font-size: 14pt; color: #666;">Generated by UrduLink AI</p>
        </div>
        <br clear="all" style="page-break-before: always;"/>
        ${bookHtml}
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', documentTemplate], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Translated_Urdu_Book.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center space-x-3">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-slate-800">Advanced Book OCR</p>
                <p className="text-xs text-slate-500">Detects paragraphs, lists, and headings.</p>
              </div>
            </div>
            <div className="flex bg-white p-1 rounded-lg border shadow-sm">
              <button 
                onClick={() => setQuality('fast')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${quality === 'fast' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Flash
              </button>
              <button 
                onClick={() => setQuality('precise')}
                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${quality === 'precise' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Pro
              </button>
            </div>
          </div>

          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`group relative cursor-pointer border-2 border-dashed rounded-xl p-12 transition-all text-center ${
              isProcessing ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <CloudArrowUpIcon className={`w-16 h-16 mx-auto mb-4 transition-colors ${isProcessing ? 'text-slate-200' : 'text-slate-400 group-hover:text-indigo-500'}`} />
            <h3 className="text-lg font-medium text-slate-900 font-semibold">{isProcessing ? 'Translating Whole Book...' : 'Upload English PDF Book'}</h3>
            <p className="text-sm text-slate-500 mt-2">Outputs a single Urdu .docx file</p>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="application/pdf" className="hidden" disabled={isProcessing} />
          </div>

          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span className="flex items-center truncate mr-4 italic"><ArrowPathIcon className="w-4 h-4 mr-2 animate-spin text-indigo-600 shrink-0" />{status}</span>
                <span className="shrink-0">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {processedPages.length > 0 && !isProcessing && (
            <div className="pt-2 animate-in slide-in-from-top duration-700">
              <button 
                onClick={downloadFullBookAsDocx}
                className="w-full py-5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white font-black text-lg rounded-2xl shadow-2xl hover:shadow-indigo-300 transition-all flex items-center justify-center group ring-4 ring-indigo-50"
              >
                <ArchiveBoxArrowDownIcon className="w-7 h-7 mr-3 group-hover:animate-bounce" />
                Download Complete Urdu Book (.docx)
              </button>
              <p className="text-center text-slate-400 text-[10px] mt-4 uppercase tracking-tighter">Your full manuscript with layout preservation is ready</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-xl mx-auto">
          <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-start space-x-4 shadow-sm text-red-700">
            <XCircleIcon className="w-8 h-8 text-red-500 shrink-0" />
            <div className="flex-1">
              <h4 className="font-bold text-sm">Error</h4>
              <p className="text-xs mt-1">{error}</p>
              <button onClick={() => setError(null)} className="mt-3 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:underline">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {processedPages.length > 0 && (
        <div className="space-y-6 mt-8">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center">
               <BookOpenIcon className="w-4 h-4 mr-2" />
               Book Draft Preview
             </h3>
             <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">{processedPages.length} Pages Processed</span>
          </div>
          <div className="grid grid-cols-1 gap-12">
            {processedPages.map((page, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="bg-slate-50/80 px-6 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-black text-slate-400">PAGE {page.pageNum}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(page.translated)}
                    className="flex items-center px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                  >
                    <ClipboardDocumentIcon className="w-3.5 h-3.5 mr-1.5" />
                    Copy Text
                  </button>
                </div>
                
                <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] border-b pb-2">English Manuscript</h4>
                    <div className="text-sm text-slate-500 leading-relaxed font-serif max-h-[400px] overflow-y-auto whitespace-pre-wrap italic opacity-80">
                      {page.original}
                    </div>
                  </div>
                  <div className="space-y-4 border-l border-slate-50 pl-10">
                    <h4 className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] border-b pb-2 text-right">اردو ترجمہ</h4>
                    <div 
                      className="text-xl text-slate-800 leading-[2.4] font-urdu text-right max-h-[600px] overflow-y-auto" 
                      dir="rtl"
                      dangerouslySetInnerHTML={{ __html: formatUrduToHtml(page.translated) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFTranslator;

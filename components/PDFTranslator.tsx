
import React, { useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import { translatePage } from '../services/geminiService';
import { 
  CloudArrowUpIcon, 
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  BookOpenIcon,
  ArchiveBoxArrowDownIcon,
  DocumentIcon,
  PhotoIcon
} from '@heroicons/react/24/solid';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

// Theme Colors for Document Elements - Updated per request
const COLORS = {
  heading1: '#1e40af', // Blue 800 (Only Heading has Blue)
  heading2: '#000000', // Black
  paragraph: '#000000', // Black
  list: '#000000', // Black
};

const PDFTranslator: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<'fast' | 'precise'>('fast');
  const [processedSections, setProcessedSections] = useState<{ original: string; translated: string; source: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File): Promise<{ original: string; translated: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await translatePage(base64, quality);
          resolve(result);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processDocx = async (file: File): Promise<{ original: string; translated: string }> => {
    const arrayBuffer = await file.arrayBuffer();
    const { value: text } = await mammoth.extractRawText({ arrayBuffer });
    const result = await translatePage(btoa(text).substring(0, 1000), quality); 
    return { original: text, translated: result.translated };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setError(null);
    setProcessedSections([]);
    setProgress(0);
    
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_SIZE) {
      setError("Combined file size exceeds 2GB limit.");
      return;
    }

    setIsProcessing(true);
    let totalItems = 0;
    
    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
          totalItems += pdf.numPages;
        } else {
          totalItems += 1;
        }
      }

      let itemsDone = 0;

      for (const file of files) {
        setStatus(`Processing ${file.name}...`);

        if (file.type === 'application/pdf') {
          const pdf = await pdfjs.getDocument(await file.arrayBuffer()).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            setStatus(`Translating ${file.name} - Page ${i}...`);
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport }).promise;
              const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
              const result = await translatePage(base64, quality);
              setProcessedSections(prev => [...prev, { ...result, source: `${file.name} (P${i})` }]);
            }
            itemsDone++;
            setProgress(Math.round((itemsDone / totalItems) * 100));
          }
        } 
        else if (file.type.startsWith('image/')) {
          const result = await processImage(file);
          setProcessedSections(prev => [...prev, { ...result, source: file.name }]);
          itemsDone++;
          setProgress(Math.round((itemsDone / totalItems) * 100));
        }
        else if (file.name.endsWith('.docx')) {
          const result = await processDocx(file);
          setProcessedSections(prev => [...prev, { ...result, source: file.name }]);
          itemsDone++;
          setProgress(Math.round((itemsDone / totalItems) * 100));
        }
      }
      setStatus('Success! Your manuscript is ready.');
    } catch (err: any) {
      setError(err.message || "Failed to process documents.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatUrduToHtml = (text: string) => {
    return text.split('\n\n').map(para => {
      let p = para.trim();
      if (!p) return '';
      // Main Heading in Blue
      if (p.startsWith('# ')) return `<h1 style="text-align: right; font-size: 26pt; font-family: 'Arial Unicode MS'; color: ${COLORS.heading1}; margin-bottom: 20pt; font-weight: bold;">${p.substring(2)}</h1>`;
      // Sub Heading in Black
      if (p.startsWith('## ')) return `<h2 style="text-align: right; font-size: 20pt; font-family: 'Arial Unicode MS'; color: ${COLORS.heading2}; margin-bottom: 15pt; font-weight: bold;">${p.substring(3)}</h2>`;
      // List Items in Black
      if (p.startsWith('* ') || p.startsWith('- ') || /^\d+\. /.test(p)) {
        const items = p.split('\n').map(l => `<li style="text-align: right; margin-bottom: 8pt; color: ${COLORS.list};">${l.replace(/^[\*\-\d\.]\s+/, '')}</li>`).join('');
        return `<ul dir="rtl" style="padding-right: 30pt; margin-bottom: 20pt;">${items}</ul>`;
      }
      // Paragraphs in Black
      return `<p style="text-align: right; line-height: 2.2; font-size: 15pt; color: ${COLORS.paragraph}; margin-bottom: 15pt;">${p.replace(/\n/g, '<br/>')}</p>`;
    }).join('');
  };

  const downloadDocx = () => {
    const bookHtml = processedSections.map(s => `<div dir="rtl" style="margin-bottom: 40pt;">${formatUrduToHtml(s.translated)}</div>`).join('');
    const template = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'></head>
      <body style="font-family: 'Arial Unicode MS'; padding: 50pt;">
        <h1 style="text-align: center; font-size: 32pt; color: #000; border-bottom: 2pt solid #eee; padding-bottom: 20pt; margin-bottom: 50pt;">Unified Urdu Manuscript</h1>
        ${bookHtml}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', template], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Urdu_Manuscript.doc`;
    link.click();
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text("Urdu Book Manuscript", 105, y, { align: "center" });
    y += 20;
    
    processedSections.forEach(s => {
      const segments = s.translated.split('\n\n');
      segments.forEach(segment => {
        let text = segment.trim();
        if (!text) return;

        // Apply Colors in PDF: Blue for Heading 1, Black for all else
        if (text.startsWith('# ')) {
          doc.setTextColor(30, 64, 175); // Blue (#1e40af)
          doc.setFontSize(18);
          text = text.substring(2);
        } else if (text.startsWith('## ')) {
          doc.setTextColor(0, 0, 0); // Black
          doc.setFontSize(15);
          text = text.substring(3);
        } else if (text.startsWith('* ') || text.startsWith('- ')) {
          doc.setTextColor(0, 0, 0); // Black
          doc.setFontSize(11);
        } else {
          doc.setTextColor(0, 0, 0); // Black
          doc.setFontSize(12);
        }

        const lines = doc.splitTextToSize(text, 180);
        lines.forEach((line: string) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(line, 190, y, { align: "right" });
          y += 7;
        });
        y += 8;
      });
      y += 5;
    });
    doc.save("Urdu_Manuscript.pdf");
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="max-w-xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
            <ArchiveBoxArrowDownIcon className="w-4 h-4" />
            <span>High-Speed Book Translation</span>
          </div>
          
          <div 
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`group relative cursor-pointer border-2 border-dashed rounded-3xl p-16 transition-all ${
              isProcessing ? 'border-slate-200 bg-slate-50' : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50'
            }`}
          >
            <div className="flex justify-center -space-x-4 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center -rotate-12 group-hover:-rotate-0 transition-transform">
                <DocumentIcon className="w-6 h-6 text-blue-500" />
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center z-10 scale-110">
                <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
                <PhotoIcon className="w-6 h-6 text-pink-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900">{isProcessing ? 'Translating Manuscript...' : 'Drop Book Files Here'}</h3>
            <p className="text-sm text-slate-500 mt-2">PDF, DOCX, and Images supported (Upto 2GB)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,.docx,image/*" 
              multiple 
              className="hidden" 
              disabled={isProcessing} 
            />
          </div>

          <div className="flex justify-center gap-6 text-[10px] font-bold uppercase tracking-tighter">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS.heading1 }} />
              <span className="text-slate-500">Heading 1 (Blue)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2 bg-black" />
              <span className="text-slate-500">All Other Content (Black)</span>
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between text-sm font-bold text-slate-600">
                <span className="flex items-center italic">
                  <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin text-indigo-600" />
                  {status}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {processedSections.length > 0 && !isProcessing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 animate-in fade-in zoom-in duration-500">
              <button 
                onClick={downloadDocx}
                className="flex items-center justify-center p-4 bg-indigo-900 text-white font-bold rounded-2xl hover:bg-indigo-950 transition-all shadow-xl ring-4 ring-indigo-50"
              >
                <ArchiveBoxArrowDownIcon className="w-5 h-5 mr-3" />
                Export Urdu DOCX
              </button>
              <button 
                onClick={downloadPdf}
                className="flex items-center justify-center p-4 bg-white border-2 border-slate-200 text-slate-900 font-bold rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-md"
              >
                <BookOpenIcon className="w-5 h-5 mr-3" />
                Export Urdu PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="max-w-xl mx-auto bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-start space-x-4 shadow-sm text-red-700">
          <XCircleIcon className="w-8 h-8 text-red-500 shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold">Error Processing</h4>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {processedSections.length > 0 && (
        <div className="space-y-8 mt-12">
          <div className="flex items-center justify-between border-b pb-4 border-slate-200">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Unified Book Preview</h3>
             <span className="text-[10px] font-bold text-indigo-600 px-3 py-1 bg-indigo-50 rounded-full">{processedSections.length} Sections Combined</span>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {processedSections.map((section, idx) => (
              <div key={idx} className="group border-b border-slate-50 last:border-0">
                <div className="px-8 py-3 bg-slate-50/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-bold text-slate-400">SOURCE: {section.source}</span>
                   <button 
                    onClick={() => { navigator.clipboard.writeText(section.translated); alert("Copied!"); }}
                    className="p-1.5 text-slate-300 hover:text-indigo-600"
                   >
                    <ClipboardDocumentIcon className="w-4 h-4" />
                   </button>
                </div>
                <div className="p-10 md:p-16">
                  <div 
                    className="font-urdu text-right select-all" 
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: formatUrduToHtml(section.translated) }}
                  />
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


export enum AppView {
  PDF_TRANSLATOR = 'PDF_TRANSLATOR',
  CHAT = 'CHAT'
}

export interface ProcessingResult {
  originalText: string;
  translatedText: string;
  pageNumber: number;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: GroundingChunk[];
}

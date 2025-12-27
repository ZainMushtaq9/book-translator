
export enum AppView {
  PDF_TRANSLATOR = 'PDF_TRANSLATOR',
  IMAGE_GEN = 'IMAGE_GEN',
  IMAGE_ANALYSIS = 'IMAGE_ANALYSIS',
  VIDEO_ANALYSIS = 'VIDEO_ANALYSIS',
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

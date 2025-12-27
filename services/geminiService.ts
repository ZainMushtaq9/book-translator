
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Ensure process.env.API_KEY is handled externally as per instructions.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const translatePage = async (
  base64Image: string, 
  quality: 'fast' | 'precise' = 'fast'
): Promise<{ original: string; translated: string }> => {
  const ai = getAIClient();
  const modelName = quality === 'precise' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: `ACT AS AN ADVANCED OCR & LAYOUT-AWARE TRANSLATION ENGINE. 
            1. Precisely extract all text from this document page.
            2. Translate the text into high-quality Urdu.
            3. MANDATORY: You MUST preserve the document structure and formatting using Markdown syntax:
               - Use '#' for main titles/headings.
               - Use '##' for sub-headings.
               - Use '*' or '-' for bullet points.
               - Use '1.', '2.', etc., for numbered lists.
               - Ensure separate paragraphs are separated by double newlines (\n\n).
               - If a line is a standalone header in the original, keep it as a header in Urdu.
            4. Return a JSON object with 'original' (English) and 'translated' (Urdu Markdown).`
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          translated: { type: Type.STRING }
        },
        required: ["original", "translated"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateImage = async (prompt: string, aspectRatio: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data received");
};

export const analyzeImage = async (base64Image: string, prompt: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      }
    ]
  });
  return response.text;
};

export const chatWithGemini = async (message: string, history: {role: string, parts: {text: string}[]}[]) => {
  const ai = getAIClient();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const result = await chat.sendMessage({ message });
  return {
    text: result.text,
    sources: result.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const fastResponse = async (prompt: string) => {
  const ai = getAIClient();
  const result = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: prompt
  });
  return result.text;
};

export const analyzeVideo = async (file: File, prompt: string) => {
  const ai = getAIClient();
  return "In a production environment, this would upload the video file to the Gemini API for temporal analysis. Using gemini-3-pro-preview, we would analyze key frames and sequence data.";
};

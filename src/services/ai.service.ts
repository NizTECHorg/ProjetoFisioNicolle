import { GoogleGenAI } from '@google/genai';

function getClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not defined');
  return new GoogleGenAI({ apiKey });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        if (base64) resolve(base64);
        else reject(new Error('Failed to convert blob to base64'));
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generateEvolutionFromAudio(audioBlob: Blob): Promise<string> {
  const ai = getClient();
  const base64Data = await blobToBase64(audioBlob);

  const prompt = `Você é um assistente de fisioterapia experiente.
Escute a gravação da consulta entre o fisioterapeuta e o paciente.
Extraia os dados clínicos relevantes, ignore conversas paralelas e cumprimentos informais.
Escreva a Evolução do Paciente no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano) estruturado em Markdown.
Não inclua a transcrição literal, nem introduções ou finalizações. Retorne APENAS o prontuário final em texto Markdown puro.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: [
      prompt,
      {
        inlineData: {
          mimeType: audioBlob.type || 'audio/webm',
          data: base64Data,
        },
      },
    ],
  });

  return response.text || '';
}


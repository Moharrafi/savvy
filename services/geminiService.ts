import { GoogleGenAI } from "@google/genai";
import { Transaction, TransactionType } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateFinancialInsight = async (transactions: Transaction[], balance: number): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Hubungkan API Key untuk melihat analisis AI.";

  // Format data for the prompt to save tokens but keep context
  const recentTransactions = transactions.slice(0, 10).map(t => 
    `- ${t.contributorName} ${t.type === TransactionType.DEPOSIT ? 'nabung' : 'tarik'} Rp${t.amount.toLocaleString('id-ID')} pada ${new Date(t.date).toLocaleDateString('id-ID')}`
  ).join('\n');

  const prompt = `
    Saya memiliki aplikasi tabungan bersama. 
    Total Saldo saat ini: Rp${balance.toLocaleString('id-ID')}.
    
    Berikut adalah 10 transaksi terakhir:
    ${recentTransactions}
    
    Tolong berikan analisis singkat (maksimal 2 kalimat), seru, dan memotivasi dalam Bahasa Indonesia gaul/santai. 
    Sebutkan siapa yang paling rajin menabung jika ada datanya. Berikan emoji yang relevan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Tidak dapat membuat analisis saat ini.";
  } catch (error) {
    console.error("Error generating insight:", error);
    return "Maaf, asisten AI sedang istirahat sebentar.";
  }
};
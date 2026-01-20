import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env['API_KEY'] || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getBusinessAdvice(salesData: string): Promise<string> {
    try {
      const apiKey = process.env['API_KEY'];
      if (!apiKey) {
        return "API Key မထည့်ထားပါ။ (No API Key found)";
      }

      const model = 'gemini-2.5-flash';
      const prompt = `
        You are a wise business advisor for a retail shop in Myanmar called 'Future World'.
        Analyze the following sales summary and give short, encouraging advice in Burmese language.
        Suggest 2 simple marketing ideas based on the items sold.
        
        Sales Summary:
        ${salesData}

        Response format:
        1. Analysis (In Burmese)
        2. Marketing Idea 1 (In Burmese)
        3. Marketing Idea 2 (In Burmese)
      `;

      const response = await this.ai.models.generateContent({
        model: model,
        contents: prompt,
      });

      return response.text || "အကြံဉာဏ်မရရှိနိုင်ပါ။";
    } catch (error) {
      console.error('AI Error:', error);
      return "AI စနစ် ချိတ်ဆက်၍မရပါ။ နောက်မှပြန်ကြိုးစားပါ။";
    }
  }

  async generateProductDescription(productName: string): Promise<string> {
    try {
        if (!process.env['API_KEY']) return "API Key Missing";
        
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Write a very short, catchy, futuristic product description (1 sentence) for '${productName}' in Burmese.`,
        });
        return response.text || "ဖော်ပြချက်မရရှိနိုင်ပါ။";
    } catch (e) {
        return "ဖော်ပြချက်မရရှိနိုင်ပါ။";
    }
  }
}
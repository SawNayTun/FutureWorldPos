import { Injectable } from '@angular/core';
import { GoogleGenAI } from "@google/genai";

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  async getBusinessAdvice(salesData: string): Promise<string> {
    try {
      const prompt = `
        You are an AI business consultant for a retail store in Myanmar.
        Analyze the following sales data and provide 3 short, actionable tips to increase profit.
        Keep the response in Burmese (Myanmar language) and be concise.
        
        Sales Data Summary:
        ${salesData}
      `;
      
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      return response.text || "No advice generated.";
    } catch (error) {
      console.error("AI Error:", error);
      return "AI service is currently unavailable. Please check your internet connection.";
    }
  }

  async generateProductDescription(productName: string): Promise<string> {
    try {
      const prompt = `
        Write a short, catchy product description for "${productName}" in Burmese.
        Focus on benefits and appeal to customers. Keep it under 50 words.
      `;
      
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      
      return response.text || "Description generation failed.";
    } catch (error) {
      console.error("AI Error:", error);
      return "Description generation failed.";
    }
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  constructor() {}

  async getBusinessAdvice(salesData: string): Promise<string> {
    return "AI service is disabled.";
  }

  async generateProductDescription(productName: string): Promise<string> {
    return "AI service is disabled.";
  }
}
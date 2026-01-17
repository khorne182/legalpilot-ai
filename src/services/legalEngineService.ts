// src/services/legalEngineService.ts
import axios from 'axios';
import { LegalAnalysis } from '../types';
import ENV from '../config/env';

class LegalEngineService {
  private backendUrl = ENV.backendUrl;

  async analyzeTranscript(transcript: string): Promise<LegalAnalysis> {
    try {
      const response = await axios.post(`${this.backendUrl}/analyze`, {
        transcript,
      });

      return {
        objection: response.data.objection || '',
        authority: response.data.authority || '',
        oneLiner: response.data.one_liner || '',
        explanation: response.data.explanation || '',
      };
    } catch (error) {
      console.error('Legal analysis failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Legal analysis failed'
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.backendUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

export const legalEngineService = new LegalEngineService();
import axios from 'axios';
import ENV from '../config/env';
import { LegalAnalysis } from '../types';

interface AnalyzeResponse {
  transcript: string;
  analysis: LegalAnalysis;
}

class ApiService {
  private backendUrl = ENV.backendUrl;

  async analyzeAudio(audioUri: string): Promise<AnalyzeResponse> {
    try {
      const formData = new FormData();
      
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // 90 second timeout for longer recordings and comprehensive analysis
      const response = await axios.post(`${this.backendUrl}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'ngrok-skip-browser-warning': 'true',
        },
        timeout: 90000, 
      });

      // Map the backend response to our LegalAnalysis interface
      const analysis = response.data.analysis;
      
      return {
        transcript: response.data.transcript,
        analysis: {
          argumentBreakdown: analysis.argumentBreakdown || '',
          objection: analysis.objection || 'None',
          oneLiner: analysis.oneLiner || '',
          proposedCounterArgument: analysis.proposedCounterArgument || '',
          caseLaw: analysis.caseLaw || [],
          statutoryLaw: analysis.statutoryLaw || [],
          constitutionalAuthorities: analysis.constitutionalAuthorities || [],
        },
      };
    } catch (error) {
      console.error('Backend analysis failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Backend analysis failed'
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

export const apiService = new ApiService();

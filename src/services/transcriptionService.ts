// src/services/transcriptionService.ts
import axios from 'axios';
import ENV from '../config/env';

class TranscriptionService {
  private apiKey = ENV.openaiApiKey;
  private apiUrl = 'https://api.openai.com/v1/audio/transcriptions';

  async transcribeAudio(audioUri: string): Promise<string> {
    try {
      // Create FormData with the audio file
      const formData = new FormData();
      
      // Append the audio file from the URI
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: `recording-${Date.now()}.m4a`,
      } as any);
      
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for audio processing
      });

      return response.data.text || '';
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Transcription failed'
      );
    }
  }
}

export const transcriptionService = new TranscriptionService();
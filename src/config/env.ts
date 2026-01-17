// src/config/env.ts
import Constants from 'expo-constants';

const ENV = {
  openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
  backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000',
};

if (!ENV.openaiApiKey) {
  console.warn('EXPO_PUBLIC_OPENAI_API_KEY is not set in .env');
}

if (!ENV.backendUrl) {
  console.warn('EXPO_PUBLIC_BACKEND_URL is not set in .env');
}

export default ENV;
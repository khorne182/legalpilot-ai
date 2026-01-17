// src/services/storageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recording, Case } from '../types';

const RECORDINGS_KEY = '@counselor:recordings';
const CASES_KEY = '@counselor:cases';
const OFFLINE_QUEUE_KEY = '@counselor:offline_queue';

class StorageService {
  // Recordings
  async saveRecording(recording: Recording): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const updated = [...recordings, recording];
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  }

  async getRecordings(): Promise<Recording[]> {
    try {
      const data = await AsyncStorage.getItem(RECORDINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get recordings:', error);
      return [];
    }
  }

  async updateRecording(id: string, updates: Partial<Recording>): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const updated = recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update recording:', error);
      throw error;
    }
  }

  async deleteRecording(id: string): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const updated = recordings.filter((r) => r.id !== id);
      await AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  // Cases
  async saveCase(caseItem: Case): Promise<void> {
    try {
      const cases = await this.getCases();
      const updated = [...cases, caseItem];
      await AsyncStorage.setItem(CASES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save case:', error);
      throw error;
    }
  }

  async getCases(): Promise<Case[]> {
    try {
      const data = await AsyncStorage.getItem(CASES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cases:', error);
      return [];
    }
  }

  async deleteCase(id: string): Promise<void> {
    try {
      const cases = await this.getCases();
      const updated = cases.filter((c) => c.id !== id);
      await AsyncStorage.setItem(CASES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete case:', error);
      throw error;
    }
  }

  // Offline Queue
  async addToQueue(recordingId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      if (!queue.find((q) => q.recordingId === recordingId)) {
        queue.push({
          recordingId,
          timestamp: new Date().toISOString(),
          retries: 0,
        });
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  }

  async getQueue(): Promise<
    Array<{ recordingId: string; timestamp: string; retries: number }>
  > {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  async removeFromQueue(recordingId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const updated = queue.filter((q) => q.recordingId !== recordingId);
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        RECORDINGS_KEY,
        CASES_KEY,
        OFFLINE_QUEUE_KEY,
      ]);
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
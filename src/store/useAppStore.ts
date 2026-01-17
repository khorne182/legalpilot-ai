// src/store/useAppStore.ts
import { create } from 'zustand';
import { AppState, Case, Recording, QueuedRecording } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storageService';

export const useAppStore = create<AppState>((set, get) => ({
  cases: [],
  currentCase: null,
  recordings: [],
  offlineQueue: [],
  isRecording: false,
  isOnline: true,

  createCase: (name: string) => {
    const newCase: Case = {
      id: uuidv4(),
      name,
      createdAt: new Date(),
      recordings: [],
    };
    set((state) => ({
      cases: [...state.cases, newCase],
      currentCase: newCase,
    }));
  },

  setCurrentCase: (caseId: string | null) => {
    set((state) => ({
      currentCase: caseId
        ? state.cases.find((c) => c.id === caseId) || null
        : null,
    }));
  },

  addRecording: (recording: Recording) => {
    set((state) => {
      const updatedCases = state.cases.map((c) => {
        if (c.id === recording.caseId) {
          return { ...c, recordings: [...c.recordings, recording] };
        }
        return c;
      });

      return {
        cases: updatedCases,
        recordings: [...state.recordings, recording],
        currentCase:
          state.currentCase?.id === recording.caseId
            ? updatedCases.find((c) => c.id === recording.caseId) || null
            : state.currentCase,
      };
    });
  },

  updateRecording: (id: string, updates: Partial<Recording>) => {
    set((state) => {
      const updatedRecordings = state.recordings.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      );

      const updatedCases = state.cases.map((c) => ({
        ...c,
        recordings: c.recordings.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      }));

      return {
        recordings: updatedRecordings,
        cases: updatedCases,
      };
    });
  },

  addToQueue: (recording: Recording) => {
    set((state) => ({
      offlineQueue: [
        ...state.offlineQueue,
        {
          id: uuidv4(),
          recording,
          retries: 0,
          lastAttempt: new Date(),
        },
      ],
    }));
  },

  removeFromQueue: (recordingId: string) => {
    set((state) => ({
      offlineQueue: state.offlineQueue.filter(
        (q) => q.recording.id !== recordingId
      ),
    }));
  },

  setIsRecording: (isRecording: boolean) => {
    set({ isRecording });
  },

  setIsOnline: (isOnline: boolean) => {
    set({ isOnline });
  },

  deleteRecording: (recordingId: string) => {
    set((state) => {
      const updatedRecordings = state.recordings.filter(
        (r) => r.id !== recordingId
      );

      const updatedCases = state.cases.map((c) => ({
        ...c,
        recordings: c.recordings.filter((r) => r.id !== recordingId),
      }));

      return {
        recordings: updatedRecordings,
        cases: updatedCases,
      };
    });
  },

  deleteCase: (caseId: string) => {
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== caseId),
      currentCase:
        state.currentCase?.id === caseId ? null : state.currentCase,
    }));
  },

  updateCase: (caseId: string, updates: Partial<Case>) => {
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
      currentCase:
        state.currentCase?.id === caseId
          ? { ...state.currentCase, ...updates }
          : state.currentCase,
    }));
  },

  getCaseRecordings: (caseId: string) => {
    const state = get();
    return state.recordings.filter((r) => r.caseId === caseId);
  },
}));
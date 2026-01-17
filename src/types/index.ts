// src/types/index.ts

export interface LegalAnalysis {
  objection: string;      // "Object on Hearsay"
  authority: string;      // "Section 37 of the Evidence Act 2011"
  oneLiner: string;    
  explanation: string;    // "The witness is testifying about what someone else told them..."
}

export interface Recording {
  id: string;
  caseId: string;
  audioUri: string;                    // Local file path
  duration: number;                    // seconds
  timestamp: Date;
  rawTranscript: string;               // What Whisper returned
  analysis: LegalAnalysis | null;      // What GPT-4o returned
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Case {
  id: string;
  name: string;                        // "Federal Republic v. Obi"
  createdAt: Date;
  recordings: Recording[];
}

export interface QueuedRecording {
  id: string;
  recording: Recording;
  retries: number;
  lastAttempt: Date;
}

export interface AppState {
  cases: Case[];
  currentCase: Case | null;
  recordings: Recording[];
  offlineQueue: QueuedRecording[];
  isRecording: boolean;
  isOnline: boolean;
  
  // Actions
  createCase: (name: string) => void;
  setCurrentCase: (caseId: string | null) => void;
  addRecording: (recording: Recording) => void;
  updateRecording: (id: string, updates: Partial<Recording>) => void;
  addToQueue: (recording: Recording) => void;
  removeFromQueue: (recordingId: string) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsOnline: (isOnline: boolean) => void;
  deleteRecording: (recordingId: string) => void;
  deleteCase: (caseId: string) => void;
  updateCase: (caseId: string, updates: Partial<Case>) => void;
  getCaseRecordings: (caseId: string) => Recording[];
}
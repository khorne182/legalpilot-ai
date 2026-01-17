// src/types/index.ts

export interface LegalAnalysis {
  argumentBreakdown: string;        // Analysis of what opposing counsel is arguing
  objection: string;                // "Hearsay", "Leading Question", "None", etc.
  oneLiner: string;                 // Sharp courtroom response
  proposedCounterArgument: string;  // Comprehensive counter-argument strategy
  caseLaw: string[];                // Nigerian case law citations
  statutoryLaw: string[];           // Evidence Act, etc.
  constitutionalAuthorities: string[]; // Constitutional provisions
}

export interface Recording {
  id: string;
  caseId: string;
  audioUri: string;
  duration: number;
  timestamp: Date;
  name: string;
  rawTranscript: string;
  analysis: LegalAnalysis | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Case {
  id: string;
  name: string;
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
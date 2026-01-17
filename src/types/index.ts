export interface LegalAnalysis{
  objection: string;      // "Object on Hearsay"
  authority: string;      // "Section 37 of the Evidence Act 2011"
  oneLiner: string;       // "I submit the witness has no personal knowledge"
  explanation: string;    // "The witness is testifying about what someone else told them..."
}

export interface Recording{
    id:string;
    caseId:string;
    audioUri:string; // local file path
    duration:number; // seconds 
    timestamp: Date;
    rawTranscript:string;  //what whisper returned
    analysis:LegalAnalysis | null; // what gpt returned
    syncStatus: 'pending' | 'synced' | 'failed';
    
}

export interface Case{
    id:string;
    name:string; //FRN V OBI - High Court of Lagos State
    createdAt:Date;
    recordings:Recording[];
}

export interface QueuedRecording{
    id:string;
    recording:Recording;
    retries:number;
    lastAttempt:Date | null;
}

export interface AppState{
    cases:Case[];
    currentCase:Case | null;
    recordings:Recording[];
    offlineQueue:QueuedRecording[];
    isRecording:boolean;
    isOnline:boolean;
    
    //actions
    createCase:(name:string)=> void;
    setCurrentCase: (caseId: string | null) => void;
    addRecording: (recording: Recording) => void;
    updateRecording: (id: string, updates: Partial<Recording>) => void;
    addToQueue: (recording: Recording) => void;
    removeFromQueue: (recordingId: string) => void;
    setIsRecording: (isRecording: boolean) => void;
    setIsOnline: (isOnline: boolean) => void;
    deleteRecording: (recordingId: string) => void;
    deleteCase: (caseId: string) => void;
    getCaseRecordings: (caseId: string) => Recording[];
}



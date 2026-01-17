// app/(tabs)/index.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/useAppStore';
import { audioService } from '@/services/audioService';
import { transcriptionService } from '@/services/transcriptionService';
import { legalEngineService } from '@/services/legalEngineService';
import { storageService } from '@/services/storageService';
import { Recording, LegalAnalysis } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export default function HomeScreen() {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<LegalAnalysis | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Name modal state
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [pendingRecording, setPendingRecording] = useState<Recording | null>(null);
  const [recordingName, setRecordingName] = useState('');
  const [defaultName, setDefaultName] = useState('');

  const isRecording = useAppStore((state) => state.isRecording);
  const isOnline = useAppStore((state) => state.isOnline);
  const setIsRecording = useAppStore((state) => state.setIsRecording);
  const currentCase = useAppStore((state) => state.currentCase);
  const cases = useAppStore((state) => state.cases);
  const addRecording = useAppStore((state) => state.addRecording);
  const setCurrentCase = useAppStore((state) => state.setCurrentCase);
  const addToQueue = useAppStore((state) => state.addToQueue);

  // Format date/time for default recording name (e.g., "Fri, Jan 17 · 6:45 PM")
  const formatDateTime = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dateNum = date.getDate();
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    return `${day}, ${month} ${dateNum} · ${hours}:${mins} ${ampm}`;
  };

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Request audio permissions immediately
        const { audioService } = await import('@/services/audioService');
        await audioService.requestPermissions();

        const casesData = await storageService.getCases();
        const store = useAppStore.getState();
        
        if (casesData.length === 0) {
          // Create a default case if none exist
          store.createCase('Default Case');
        } else if (!store.currentCase) {
          // Set first case as current if none selected
          store.setCurrentCase(casesData[0].id);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert('Permission Error', 'Microphone permission is required to record');
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 30) {
            // Auto-stop at 30 seconds
            handleStopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = async () => {
    console.log('Start recording clicked');
    console.log('Current case:', currentCase);
    console.log('Is recording:', isRecording);
    
    if (!currentCase) {
      Alert.alert('No Case Selected', 'Please select or create a case first.');
      return;
    }

    try {
      console.log('Starting recording...');
      setRecordingTime(0);
      setIsRecording(true);
      setLastAnalysis(null);
      setLastTranscript('');
      await audioService.startRecording();
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);

    try {
      // Stop recording and get audio file
      const recordingResult = await audioService.stopRecording();
      const timestamp = new Date();

      // Create recording object
      const recording: Recording = {
        id: recordingResult.id,
        caseId: currentCase!.id,
        audioUri: recordingResult.uri,
        duration: recordingResult.duration,
        timestamp: timestamp,
        name: '', // Will be set by the name modal
        rawTranscript: '', // Will be set by Whisper transcription
        analysis: null,
        syncStatus: 'pending',
      };

      // Set default name and show modal
      const defaultNameStr = formatDateTime(timestamp);
      setDefaultName(defaultNameStr);
      setRecordingName(defaultNameStr);
      setPendingRecording(recording);
      setIsProcessing(false);
      setNameModalVisible(true);

    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error(error);
      setIsProcessing(false);
    }
  };

  const handleSaveRecordingName = async () => {
    if (!pendingRecording) return;
    
    setNameModalVisible(false);
    setIsProcessing(true);

    try {
      // Use the recording name (or default if empty)
      const finalName = recordingName.trim() || defaultName;
      const recording = { ...pendingRecording, name: finalName };

      // Save to local storage immediately
      await storageService.saveRecording(recording);

      // If online, try to transcribe and analyze
      if (isOnline) {
        // Try to transcribe audio
        try {
          const transcript = await transcriptionService.transcribeAudio(
            recording.audioUri
          );
          // Store the transcript in rawTranscript field
          recording.rawTranscript = transcript;
          setLastTranscript(transcript);

          // Try to analyze with legal engine
          try {
            const analysis = await legalEngineService.analyzeTranscript(transcript);
            recording.analysis = analysis;
            recording.syncStatus = 'synced';
            setLastAnalysis(analysis);
          } catch (error) {
            console.warn('Legal analysis unavailable:', error);
            recording.syncStatus = 'synced'; // Mark as synced even without analysis
            setLastAnalysis(null);
          }
        } catch (error) {
          console.warn('Transcription unavailable:', error);
          recording.syncStatus = 'synced';
        }
      } else {
        // Offline mode: queue for later processing
        addToQueue(recording);
        Alert.alert(
          'Recording Saved',
          'You are offline. This will be processed when you reconnect.'
        );
      }

      // Update recording in storage and state
      await storageService.updateRecording(recording.id, {
        rawTranscript: recording.rawTranscript,
        analysis: recording.analysis,
        syncStatus: recording.syncStatus,
      });

      addRecording(recording);

      // Reset state
      setPendingRecording(null);
      setRecordingName('');
      setDefaultName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = () => {
    // User cancelled - discard the recording
    setNameModalVisible(false);
    setPendingRecording(null);
    setRecordingName('');
    setDefaultName('');
    Alert.alert('Recording Discarded', 'The recording was not saved.');
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}s`;
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Network Status */}
        <View style={styles.statusBar}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: isOnline ? '#4CAF50' : '#FF9800' },
            ]}
          />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline Mode'}
          </Text>
        </View>

        {/* Case Selector */}
        <View style={styles.caseSelector}>
          <Text style={styles.label}>Current Case</Text>
          <TouchableOpacity
            style={styles.caseButton}
            onPress={() => setCaseDropdownOpen(!caseDropdownOpen)}
          >
            <Text style={styles.caseButtonText}>
              {currentCase?.name || 'Select a case...'}
            </Text>
            <Ionicons
              name={caseDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#007AFF"
            />
          </TouchableOpacity>

          {/* Case Dropdown Modal */}
          <Modal
            visible={caseDropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setCaseDropdownOpen(false)}
          >
            <TouchableOpacity
              style={styles.caseDropdownBackdrop}
              onPress={() => setCaseDropdownOpen(false)}
            >
              <View style={styles.caseDropdown}>
                <FlatList
                  data={cases}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.caseDropdownItem,
                        currentCase?.id === item.id &&
                          styles.caseDropdownItemSelected,
                      ]}
                      onPress={() => {
                        useAppStore.getState().setCurrentCase(item.id);
                        setCaseDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.caseDropdownItemText,
                          currentCase?.id === item.id &&
                            styles.caseDropdownItemTextSelected,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {currentCase?.id === item.id && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color="#007AFF"
                        />
                      )}
                    </TouchableOpacity>
                  )}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        </View>

        {/* Panic Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.panicButton,
              isRecording && styles.panicButtonActive,
              isProcessing && styles.panicButtonDisabled,
            ]}
            onPress={
              isRecording ? handleStopRecording : handleStartRecording
            }
            disabled={isProcessing || !currentCase}
          >
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={60}
              color="white"
            />
          </TouchableOpacity>

          {/* Timer */}
          {isRecording && (
            <Text style={styles.timer}>{formatTime(recordingTime)}</Text>
          )}

          {/* Status Text */}
          <Text style={styles.statusTextLarge}>
            {isProcessing
              ? 'Processing...'
              : isRecording
              ? 'Recording...'
              : !currentCase
              ? 'Select a Case First'
              : 'Ready to Record'}
          </Text>
        </View>

        {/* Results Display */}
        {lastAnalysis && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Analysis Result</Text>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Objection:</Text>
              <Text style={styles.resultValue}>{lastAnalysis.objection}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Authority:</Text>
              <Text style={styles.resultValue}>{lastAnalysis.authority}</Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Your Response:</Text>
              <Text style={styles.resultValueBold}>
                {lastAnalysis.oneLiner}
              </Text>
            </View>

            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Explanation:</Text>
              <Text style={styles.resultValue}>{lastAnalysis.explanation}</Text>
            </View>

            <TouchableOpacity style={styles.copyButton}>
              <Ionicons name="copy" size={18} color="white" />
              <Text style={styles.copyButtonText}>Copy One-Liner</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Transcript Display */}
        {lastTranscript && !lastAnalysis && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptTitle}>Transcript</Text>
            <Text style={styles.transcriptText}>{lastTranscript}</Text>
          </View>
        )}
      </ScrollView>

      {/* Recording Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelRecording}
      >
        <SafeAreaView style={styles.nameModalContainer}>
          <View style={styles.nameModalContent}>
            <View style={styles.nameModalHeader}>
              <Text style={styles.nameModalTitle}>Name Recording</Text>
              <TouchableOpacity onPress={handleCancelRecording}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.nameModalLabel}>Default name (timestamp):</Text>
            <View style={styles.defaultNameBox}>
              <Text style={styles.defaultNameText}>{defaultName}</Text>
            </View>

            <Text style={styles.nameModalLabel}>Recording name:</Text>
            <View style={styles.nameInputContainer}>
              <TextInput
                style={styles.nameInput}
                placeholder="Type a custom name or keep default"
                placeholderTextColor="#999"
                value={recordingName}
                onChangeText={setRecordingName}
                multiline
              />
              <TouchableOpacity
                style={styles.clearNameButton}
                onPress={() => setRecordingName('')}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            <View style={styles.nameModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelRecording}
              >
                <Text style={styles.cancelButtonText}>Discard</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveNameButton}
                onPress={handleSaveRecordingName}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveNameButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  caseSelector: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  caseButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  caseButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  caseDropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  caseDropdown: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 300,
  },
  caseDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  caseDropdownItemSelected: {
    backgroundColor: '#f0f7ff',
  },
  caseDropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  caseDropdownItemTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  panicButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  panicButtonActive: {
    backgroundColor: '#CC0000',
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  panicButtonDisabled: {
    opacity: 0.5,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 12,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resultItem: {
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  resultValueBold: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  copyButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  transcriptContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  transcriptText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Name Modal Styles
  nameModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  nameModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 350,
  },
  nameModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  nameModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  nameModalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  defaultNameBox: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  defaultNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 50,
  },
  clearNameButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveNameButton: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveNameButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
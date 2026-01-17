// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
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
  useColorScheme,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { audioService } from '@/services/audioService';
import { apiService } from '@/services/apiService';
import { storageService } from '@/services/storageService';
import { Recording, LegalAnalysis } from '@/types';
import { Colors, Layout } from '@/theme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors; // Access colors directly
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
  const setCurrentCase = useAppStore((state) => state.setCurrentCase);
  const cases = useAppStore((state) => state.cases);
  const addRecording = useAppStore((state) => state.addRecording);
  const addToQueue = useAppStore((state) => state.addToQueue);

  // Format date/time
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
    hours = hours ? hours : 12; 
    return `${day}, ${month} ${dateNum} · ${hours}:${mins} ${ampm}`;
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { audioService } = await import('@/services/audioService');
        await audioService.requestPermissions();

        const casesData = await storageService.getCases();
        const store = useAppStore.getState();
        
        if (casesData.length === 0) {
          store.createCase('Default Case');
        } else if (!store.currentCase) {
          store.setCurrentCase(casesData[0].id);
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        Alert.alert('Permission Error', 'Microphone permission is required to record');
        setIsInitialized(true);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
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
    if (!currentCase) {
      Alert.alert('No Case Selected', 'Please select or create a case first.');
      return;
    }
    try {
      setRecordingTime(0);
      setIsRecording(true);
      setLastAnalysis(null);
      setLastTranscript('');
      await audioService.startRecording();
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
      const recordingResult = await audioService.stopRecording();
      const timestamp = new Date();
      const recording: Recording = {
        id: recordingResult.id,
        caseId: currentCase!.id,
        audioUri: recordingResult.uri,
        duration: recordingResult.duration,
        timestamp: timestamp,
        name: '',
        rawTranscript: '',
        analysis: null,
        syncStatus: 'pending',
      };
      const defaultNameStr = formatDateTime(timestamp);
      setDefaultName(defaultNameStr);
      setRecordingName(defaultNameStr);
      setPendingRecording(recording);
      setIsProcessing(false);
      setNameModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      setIsProcessing(false);
    }
  };

  const handleSaveRecordingName = async () => {
    if (!pendingRecording) return;
    setNameModalVisible(false);
    setIsProcessing(true);
    try {
      const finalName = recordingName.trim() || defaultName;
      const recording = { ...pendingRecording, name: finalName };
      await storageService.saveRecording(recording);

      if (isOnline) {
        try {
          const { transcript, analysis } = await apiService.analyzeAudio(recording.audioUri);
          recording.rawTranscript = transcript;
          recording.analysis = analysis;
          recording.syncStatus = 'synced';
          setLastTranscript(transcript);
          setLastAnalysis(analysis);
        } catch (error) {
          console.warn('Backend analysis unavailable:', error);
          recording.syncStatus = 'failed';
        }
      } else {
        addToQueue(recording);
        Alert.alert('Recording Saved', 'Offline mode: Queued for processing.');
      }

      await storageService.updateRecording(recording.id, {
        rawTranscript: recording.rawTranscript,
        analysis: recording.analysis,
        syncStatus: recording.syncStatus,
      });
      addRecording(recording);
      setPendingRecording(null);
      setRecordingName('');
      setDefaultName('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save recording');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelRecording = () => {
    setNameModalVisible(false);
    setPendingRecording(null);
    setRecordingName('');
    setDefaultName('');
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}s`;
  };

  if (!isInitialized) return null;

  // Render Logic
  const boxColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;
  const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? colors.background.dark : colors.background.light }]}>
      <StatusBar 
        barStyle={theme === 'dark' ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 0) }]}>
          <View>
            <Text style={[styles.greeting, { color: textColor }]}>Good Evening,</Text>
            <Text style={[styles.greetingTitle, { color: colors.secondary }]}>Counsel</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOnline ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 152, 0, 0.15)' }]}>
             <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.accent : '#FF9800' }]} />
             <Text style={[styles.statusText, { color: isOnline ? colors.accent : '#FF9800' }]}>
               {isOnline ? 'ONLINE' : 'OFFLINE'}
             </Text>
          </View>
        </View>

        {/* Case Dropdown */}
        <View style={styles.caseSection}>
          <TouchableOpacity
            style={[styles.caseSelector, { backgroundColor: boxColor }]}
            onPress={() => setCaseDropdownOpen(!caseDropdownOpen)}
          >
             <View>
               <Text style={[styles.caseLabel, { color: colors.text.secondary.light }]}>Active Case File</Text>
               <Text style={[styles.caseName, { color: textColor }]}>{currentCase?.name || 'Tap to select case...'}</Text>
             </View>
             <Ionicons name="chevron-down" size={20} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
           <TouchableOpacity 
             style={[styles.statCard, { backgroundColor: boxColor }]}
             onPress={() => router.push('/(tabs)/cases')}
           >
             <Text style={[styles.statNumber, { color: textColor }]}>{cases.length}</Text>
             <Text style={styles.statLabel}>Active Cases</Text>
           </TouchableOpacity>
           <View style={[styles.statCard, { backgroundColor: boxColor }]}>
             <Text style={[styles.statNumber, { color: textColor }]}>{cases.reduce((acc, c) => acc + c.recordings.length, 0)}</Text>
             <Text style={styles.statLabel}>Recordings</Text>
           </View>
           <View style={[styles.statCard, { backgroundColor: boxColor }]}>
             <Ionicons name="cloud-done" size={24} color={colors.accent} />
             <Text style={[styles.statLabel, { marginTop: 4 }]}>Synced</Text>
           </View>
        </View>

        {/* Recording Area */}
        <View style={styles.recordContainer}>
          <View style={[styles.recordRing, isRecording && styles.recordRingActive]}>
             <TouchableOpacity
                style={[
                  styles.recordButton, 
                  isRecording ? { backgroundColor: colors.destructive } : { backgroundColor: colors.primary },
                  isProcessing && { opacity: 0.7 }
                ]}
                onPress={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing || !currentCase}
             >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="white" />
                ) : (
                  <Ionicons name={isRecording ? "stop" : "mic"} size={48} color="white" />
                )}
             </TouchableOpacity>
          </View>
          
          <Text style={[styles.timerText, { color: isRecording ? colors.destructive : colors.text.secondary.light }]}>
            {isRecording ? formatTime(recordingTime) : "Tap to Record"}
          </Text>
          <Text style={[styles.instructions, { color: colors.text.secondary.light }]}>
            {isRecording ? "Listening..." : "Analysis will start automatically"}
          </Text>
        </View>

        {/* Results Analysis */}
        {lastAnalysis && (
          <View style={[styles.analysisCard, { backgroundColor: boxColor }]}>
            <View style={styles.cardHeader}>
               <Ionicons name="flash" size={20} color={colors.secondary} />
               <Text style={[styles.cardTitle, { color: textColor }]}>Legal Analysis</Text>
            </View>

            {/* Argument Breakdown */}
            {lastAnalysis.argumentBreakdown && (
              <View style={styles.analysisRow}>
                 <Text style={styles.analysisLabel}>ARGUMENT BREAKDOWN</Text>
                 <Text style={[styles.analysisValue, { color: textColor }]}>{lastAnalysis.argumentBreakdown}</Text>
              </View>
            )}
            
            <View style={styles.divider} />

            {/* Objection */}
            <View style={styles.analysisRow}>
               <Text style={styles.analysisLabel}>OBJECTION</Text>
               <Text style={[styles.analysisValue, { color: textColor }]}>{lastAnalysis.objection}</Text>
            </View>

            <View style={styles.divider} />

            {/* One-Liner */}
            <View style={styles.analysisRow}>
               <Text style={styles.analysisLabel}>ONE-LINER RESPONSE</Text>
               <Text style={[styles.oneLinerText, { color: colors.destructive }]}>{lastAnalysis.oneLiner}</Text>
            </View>

            <View style={styles.divider} />

            {/* Proposed Counter-Argument */}
            {lastAnalysis.proposedCounterArgument && (
              <View style={styles.analysisRow}>
                 <Text style={[styles.analysisLabel, { color: colors.secondary }]}>PROPOSED COUNTER-ARGUMENT</Text>
                 <Text style={[styles.analysisValue, { color: textColor, lineHeight: 22 }]}>{lastAnalysis.proposedCounterArgument}</Text>
              </View>
            )}

            {/* Authorities Section */}
            {(lastAnalysis.caseLaw?.length > 0 || lastAnalysis.statutoryLaw?.length > 0 || lastAnalysis.constitutionalAuthorities?.length > 0) && (
              <>
                <View style={styles.divider} />
                <Text style={[styles.sectionHeader, { color: colors.secondary }]}>LEGAL AUTHORITIES</Text>

                {lastAnalysis.caseLaw?.length > 0 && (
                  <View style={styles.authoritySection}>
                     <Text style={styles.authorityLabel}>Case Law:</Text>
                     {lastAnalysis.caseLaw.map((item, idx) => (
                       <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {item}</Text>
                     ))}
                  </View>
                )}

                {lastAnalysis.statutoryLaw?.length > 0 && (
                  <View style={styles.authoritySection}>
                     <Text style={styles.authorityLabel}>Statutory Law:</Text>
                     {lastAnalysis.statutoryLaw.map((item, idx) => (
                       <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {item}</Text>
                     ))}
                  </View>
                )}

                {lastAnalysis.constitutionalAuthorities?.length > 0 && (
                  <View style={styles.authoritySection}>
                     <Text style={styles.authorityLabel}>Constitutional Authorities:</Text>
                     {lastAnalysis.constitutionalAuthorities.map((item, idx) => (
                       <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {item}</Text>
                     ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}

      </ScrollView>

      {/* Case Dropdown Modal */}
      <Modal visible={caseDropdownOpen} transparent animationType="fade" onRequestClose={() => setCaseDropdownOpen(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setCaseDropdownOpen(false)}>
          <View style={[styles.dropdownMenu, { backgroundColor: boxColor }]}>
            <FlatList
              data={cases}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, currentCase?.id === item.id && { backgroundColor: theme === 'dark' ? '#3A3A3C' : '#F2F2F7' }]}
                  onPress={() => {
                     setCurrentCase(item.id);
                     setCaseDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.dropdownText, { color: textColor }]}>{item.name}</Text>
                  {currentCase?.id === item.id && <Ionicons name="checkmark" size={20} color={colors.secondary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

       {/* Name Recording Modal */}
       <Modal visible={nameModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.nameModal, { backgroundColor: boxColor }]}>
             <Text style={[styles.modalTitle, { color: textColor }]}>Name Evidence</Text>
             
             <View style={[styles.defaultNameBadge, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
                <Text style={{ color: colors.secondary, fontWeight: '600' }}>{defaultName}</Text>
             </View>

             <TextInput
                style={[styles.input, { color: textColor, borderColor: colors.border.light }]}
                value={recordingName}
                onChangeText={setRecordingName}
                placeholder="Enter custom name..."
                placeholderTextColor={colors.text.secondary.light}
             />

             <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={handleCancelRecording}>
                   <Text style={{ color: colors.text.secondary.light }}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtnPrimary, { backgroundColor: colors.secondary }]} onPress={handleSaveRecordingName}>
                   <Text style={{ color: 'white', fontWeight: '600' }}>Save Recording</Text>
                </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '400',
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  caseSection: {
    marginBottom: 24,
  },
  caseSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    ...Layout.shadow.small,
  },
  caseLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  caseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    ...Layout.shadow.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  recordContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F2F2F7', // Default ring
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  recordRingActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Red glow
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
  },
  analysisCard: {
    padding: 20,
    borderRadius: 20,
    ...Layout.shadow.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  analysisRow: {
    marginBottom: 16,
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 1,
  },
  analysisValue: {
    fontSize: 16,
    lineHeight: 24,
  },
  oneLinerText: {
    fontSize: 18,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  dropdownMenu: {
    maxHeight: 300,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nameModal: {
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  defaultNameBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 32,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  modalBtnSecondary: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimary: {
    flex: 2,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  authoritySection: {
    marginBottom: 16,
  },
  authorityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 6,
  },
  authorityItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    paddingLeft: 8,
  },
});
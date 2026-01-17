// app/case-detail.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  TextInput,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { audioService } from '@/services/audioService';
import { Colors, Layout } from '@/theme';

export default function CaseDetailScreen() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingRecordingId, setRenamingRecordingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors;

  const cases = useAppStore((state) => state.cases);
  const recordings = useAppStore((state) => state.recordings);
  const deleteRecording = useAppStore((state) => state.deleteRecording);
  const updateRecording = useAppStore((state) => state.updateRecording);

  const caseData = cases.find((c) => c.id === caseId);
  const caseRecordings = recordings.filter((r) => r.caseId === caseId);

  if (!caseData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? colors.background.dark : colors.background.light }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light }]}>Case Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[d.getDay()];
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dateNum = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}, ${month}/${dateNum} · ${hours}:${mins}`;
  };

  const handlePlayRecording = async (uri: string, recordingId: string) => {
    try {
      if (isPlaying === recordingId) {
        await audioService.stopPlayback();
        setIsPlaying(null);
      } else {
        if (isPlaying) {
          await audioService.stopPlayback();
        }
        await audioService.playRecording(uri);
        setIsPlaying(recordingId);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to play recording');
    }
  };

  const handleDeleteRecording = (recordingId: string) => {
    Alert.alert('Delete Recording', 'Are you sure?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => {
          deleteRecording(recordingId);
          setSelectedRecording(null);
        },
        style: 'destructive',
      },
    ]);
  };

  const handleRenameRecording = (recordingId: string) => {
    const recording = recordings.find((r) => r.id === recordingId);
    if (recording) {
      setRenamingRecordingId(recordingId);
      setNewName(recording.name || formatDateTime(recording.timestamp));
      setRenameModalVisible(true);
    }
  };

  const handleSaveNewName = () => {
    if (!renamingRecordingId || !newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    updateRecording(renamingRecordingId, { name: newName });
    setRenameModalVisible(false);
    setRenamingRecordingId(null);
    setNewName('');
  };

  const renderRecordingItem = ({ item }: { item: any }) => {
    const isSelected = selectedRecording === item.id;
    const defaultName = formatDateTime(item.timestamp);
    const boxColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;
    const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

    return (
      <View style={[styles.recordingItem, { backgroundColor: boxColor, borderColor: isSelected ? colors.primary : 'transparent', borderWidth: isSelected ? 2 : 0, ...Layout.shadow.small }]}>
        <TouchableOpacity
          style={styles.recordingHeader}
          onPress={() => setSelectedRecording(isSelected ? null : item.id)}
        >
          <View style={styles.recordingIcon}>
             <Ionicons 
                name={isPlaying === item.id ? "volume-high" : "mic"} 
                size={20} 
                color={isSelected ? colors.primary : colors.text.secondary.light} 
             />
          </View>
          <View style={styles.recordingInfo}>
            <Text style={[styles.recordingName, { color: textColor }]}>
              {item.name || 'Unnamed Recording'}
            </Text>
            <Text style={styles.recordingDateTime}>{defaultName} • {item.duration}s</Text>
          </View>
          <Ionicons
            name={isSelected ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.text.secondary.light}
          />
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.recordingDetails}>
             <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: isPlaying === item.id ? colors.destructive : colors.secondary }]}
                  onPress={() => handlePlayRecording(item.audioUri, item.id)}
                >
                  <Ionicons name={isPlaying === item.id ? 'pause' : 'play'} size={18} color="white" />
                  <Text style={styles.playButtonText}>{isPlaying === item.id ? 'Pause' : 'Play Audio'}</Text>
                </TouchableOpacity>

                <View style={styles.iconActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleRenameRecording(item.id)}>
                       <Ionicons name="pencil" size={20} color={colors.secondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteRecording(item.id)}>
                       <Ionicons name="trash" size={20} color={colors.destructive} />
                    </TouchableOpacity>
                </View>
             </View>

            {item.rawTranscript && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>TRANSCRIPT</Text>
                <View style={[styles.transcriptBox, { backgroundColor: theme === 'dark' ? '#3A3A3C' : '#F9F9F9', borderLeftColor: colors.secondary }]}>
                   <Text style={[styles.transcriptText, { color: textColor }]}>{item.rawTranscript}</Text>
                </View>
              </View>
            )}

            {item.analysis && (
               <View style={styles.section}>
                  <Text style={styles.sectionTitle}>LEGAL ANALYSIS</Text>
                  
                  <View style={[styles.analysisCard, { backgroundColor: theme === 'dark' ? '#3A3A3C' : '#F2F2F7' }]}>
                     {/* Argument Breakdown */}
                     {item.analysis.argumentBreakdown && (
                       <>
                         <View style={styles.analysisRow}>
                            <Text style={styles.analysisLabel}>ARGUMENT BREAKDOWN</Text>
                            <Text style={[styles.analysisValue, { color: textColor }]}>{item.analysis.argumentBreakdown}</Text>
                         </View>
                         <View style={styles.divider} />
                       </>
                     )}

                     {/* Objection */}
                     <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>OBJECTION</Text>
                        <Text style={[styles.analysisValue, { color: textColor }]}>{item.analysis.objection}</Text>
                     </View>
                     
                     <View style={styles.divider} />

                     {/* One-Liner Response */}
                     <View style={styles.analysisRow}>
                        <Text style={styles.analysisLabel}>ONE-LINER RESPONSE</Text>
                        <Text style={[styles.responseValue, { color: colors.destructive }]}>{item.analysis.oneLiner}</Text>
                     </View>
                     
                     {/* Proposed Counter-Argument */}
                     {item.analysis.proposedCounterArgument && (
                       <>
                         <View style={styles.divider} />
                         <View style={styles.analysisRow}>
                            <Text style={[styles.analysisLabel, { color: colors.secondary }]}>PROPOSED COUNTER-ARGUMENT</Text>
                            <Text style={[styles.analysisValue, { color: textColor, lineHeight: 22 }]}>{item.analysis.proposedCounterArgument}</Text>
                         </View>
                       </>
                     )}

                     {/* Legal Authorities */}
                     {(item.analysis.caseLaw?.length > 0 || item.analysis.statutoryLaw?.length > 0 || item.analysis.constitutionalAuthorities?.length > 0) && (
                       <>
                         <View style={styles.divider} />
                         <Text style={[styles.authorityHeader, { color: colors.secondary }]}>LEGAL AUTHORITIES</Text>

                         {item.analysis.caseLaw?.length > 0 && (
                           <View style={styles.authoritySection}>
                              <Text style={styles.authorityLabel}>Case Law:</Text>
                              {item.analysis.caseLaw.map((law: string, idx: number) => (
                                <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {law}</Text>
                              ))}
                           </View>
                         )}

                         {item.analysis.statutoryLaw?.length > 0 && (
                           <View style={styles.authoritySection}>
                              <Text style={styles.authorityLabel}>Statutory Law:</Text>
                              {item.analysis.statutoryLaw.map((law: string, idx: number) => (
                                <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {law}</Text>
                              ))}
                           </View>
                         )}

                         {item.analysis.constitutionalAuthorities?.length > 0 && (
                           <View style={styles.authoritySection}>
                              <Text style={styles.authorityLabel}>Constitutional Authorities:</Text>
                              {item.analysis.constitutionalAuthorities.map((auth: string, idx: number) => (
                                <Text key={idx} style={[styles.authorityItem, { color: textColor }]}>• {auth}</Text>
                              ))}
                           </View>
                         )}
                       </>
                     )}
                  </View>
               </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const bgColor = theme === 'dark' ? colors.background.dark : colors.background.light;
  const surfaceColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;
  const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: theme === 'dark' ? colors.border.dark : colors.border.light }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary.light} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{caseData.name}</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <FlatList
        data={caseRecordings}
        renderItem={renderRecordingItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                 <Ionicons name="mic-outline" size={64} color={colors.text.secondary.light} />
              </View>
              <Text style={[styles.emptyText, { color: textColor }]}>No Recordings</Text>
              <Text style={styles.emptySubtext}>Recordings for this case will appear here.</Text>
           </View>
        }
      />

      {/* Rename Modal */}
      <Modal visible={renameModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: textColor }]}>Rename Evidence</Text>
                 <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.text.secondary.light} />
                 </TouchableOpacity>
              </View>

              <TextInput 
                 style={[styles.input, { color: textColor, borderColor: theme === 'dark' ? colors.border.dark : colors.border.light }]}
                 value={newName}
                 onChangeText={setNewName}
                 placeholder="Enter new name..."
                 placeholderTextColor={colors.text.secondary.light}
              />

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.secondary }]} onPress={handleSaveNewName}>
                 <Text style={styles.saveButtonText}>Update Name</Text>
              </TouchableOpacity>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  recordingItem: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  recordingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordingDateTime: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  recordingDetails: {
    padding: 16,
    paddingTop: 0,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  playButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  iconActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    letterSpacing: 1,
  },
  transcriptBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  transcriptText: {
    fontSize: 14,
    lineHeight: 22,
  },
  analysisCard: {
    padding: 16,
    borderRadius: 12,
  },
  analysisRow: {
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseValue: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIconCircle: {
     width: 100,
     height: 100,
     borderRadius: 50,
     backgroundColor: '#F2F2F7',
     alignItems: 'center',
     justifyContent: 'center',
     marginBottom: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  authorityHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1,
  },
  authoritySection: {
    marginBottom: 12,
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
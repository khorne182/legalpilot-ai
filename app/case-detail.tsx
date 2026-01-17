// app/(tabs)/case-detail.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { audioService } from '@/services/audioService';

export default function CaseDetailScreen() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<string | null>(null);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [renamingRecordingId, setRenamingRecordingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const cases = useAppStore((state) => state.cases);
  const recordings = useAppStore((state) => state.recordings);
  const deleteRecording = useAppStore((state) => state.deleteRecording);
  const updateRecording = useAppStore((state) => state.updateRecording);

  const caseData = cases.find((c) => c.id === caseId);
  const caseRecordings = recordings.filter((r) => r.caseId === caseId);

  if (!caseData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/cases')}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Case Not Found</Text>
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
          Alert.alert('Success', 'Recording deleted');
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
    Alert.alert('Success', 'Recording renamed');
  };

  const renderRecordingItem = ({ item }: { item: any }) => {
    const isSelected = selectedRecording === item.id;
    const defaultName = formatDateTime(item.timestamp);

    return (
      <View style={styles.recordingItem}>
        <TouchableOpacity
          style={[
            styles.recordingHeader,
            isSelected && styles.recordingHeaderSelected,
          ]}
          onPress={() => setSelectedRecording(isSelected ? null : item.id)}
        >
          <View style={styles.recordingInfo}>
            <Text style={styles.recordingDateTime}>{defaultName}</Text>
            <Text style={styles.recordingName}>
              {item.name || 'Unnamed Recording'}
            </Text>
            <Text style={styles.recordingDuration}>{item.duration}s</Text>
          </View>
          <Ionicons
            name={isSelected ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#007AFF"
          />
        </TouchableOpacity>

        {isSelected && (
          <View style={styles.recordingDetails}>
            {/* Play Button */}
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlayRecording(item.audioUri, item.id)}
            >
              <Ionicons
                name={isPlaying === item.id ? 'pause' : 'play'}
                size={20}
                color="white"
              />
              <Text style={styles.playButtonText}>
                {isPlaying === item.id ? 'Stop' : 'Play'}
              </Text>
            </TouchableOpacity>

            {/* Transcript from Whisper */}
            {item.rawTranscript && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Transcript</Text>
                <Text style={styles.transcriptText}>{item.rawTranscript}</Text>
              </View>
            )}

            {/* One-liner Response */}
            {item.analysis?.oneLiner && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Response</Text>
                <Text style={styles.sectionText}>{item.analysis.oneLiner}</Text>
              </View>
            )}

            {/* Analysis */}
            {item.analysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Legal Analysis</Text>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Objection:</Text>
                  <Text style={styles.analysisValue}>{item.analysis.objection}</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Authority:</Text>
                  <Text style={styles.analysisValue}>{item.analysis.authority}</Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>Explanation:</Text>
                  <Text style={styles.analysisValue}>{item.analysis.explanation}</Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.renameButton}
                onPress={() => handleRenameRecording(item.id)}
              >
                <Ionicons name="pencil" size={18} color="white" />
                <Text style={styles.actionButtonText}>Rename</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteRecording(item.id)}
              >
                <Ionicons name="trash" size={18} color="white" />
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cases')}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{caseData.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {caseRecordings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No recordings yet</Text>
          <Text style={styles.emptySubtext}>
            Go to the Record tab to add recordings to this case
          </Text>
        </View>
      ) : (
        <FlatList
          data={caseRecordings}
          renderItem={renderRecordingItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Rename Modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Recording</Text>
              <TouchableOpacity onPress={() => setRenameModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Default name (immutable):</Text>
            <View style={styles.defaultNameBox}>
              <Text style={styles.defaultNameText}>
                {renamingRecordingId ? formatDateTime(recordings.find(r => r.id === renamingRecordingId)?.timestamp || new Date()) : ''}
              </Text>
            </View>

            <Text style={styles.modalLabel}>Custom name (optional):</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type custom name or leave blank to use default"
                placeholderTextColor="#999"
                value={newName}
                onChangeText={setNewName}
                multiline
              />
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setNewName('')}
              >
                <Ionicons name="close" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveNewName}>
              <Text style={styles.saveButtonText}>Save Name</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recordingItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  recordingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recordingHeaderSelected: {
    backgroundColor: '#f0f7ff',
  },
  recordingInfo: {
    flex: 1,
  },
  recordingDateTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  recordingName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  recordingDuration: {
    fontSize: 12,
    color: '#999',
  },
  recordingDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  playButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '600',
    lineHeight: 20,
  },
  transcriptText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  analysisItem: {
    gap: 4,
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
  },
  analysisValue: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  renameButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 12,
  },
  defaultNameBox: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  defaultNameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  clearButton: {
    paddingLeft: 8,
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
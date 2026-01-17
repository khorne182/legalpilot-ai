// app/(tabs)/cases.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '@/store/useAppStore';
import { storageService } from '@/services/storageService';

export default function CasesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const router = useRouter();

  const cases = useAppStore((state) => state.cases);
  const currentCase = useAppStore((state) => state.currentCase);
  const createCase = useAppStore((state) => state.createCase);
  const deleteCase = useAppStore((state) => state.deleteCase);
  const setCurrentCase = useAppStore((state) => state.setCurrentCase);
  const getCaseRecordings = useAppStore((state) => state.getCaseRecordings);

  // Refresh cases when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Cases are already in state, just need to ensure they're current
      return () => {};
    }, [])
  );

  const handleCreateCase = async () => {
    if (!newCaseName.trim()) {
      Alert.alert('Error', 'Please enter a case name');
      return;
    }

    try {
      createCase(newCaseName);
      const newCase = useAppStore.getState().cases[useAppStore.getState().cases.length - 1];
      await storageService.saveCase(newCase);
      setNewCaseName('');
      setModalVisible(false);
      Alert.alert('Success', 'Case created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create case');
      console.error(error);
    }
  };

  const handleDeleteCase = (caseId: string) => {
    Alert.alert(
      'Delete Case',
      'Are you sure? This will delete all recordings in this case.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              deleteCase(caseId);
              await storageService.deleteCase(caseId);
              Alert.alert('Success', 'Case deleted');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete case');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSelectCase = (caseId: string) => {
    setCurrentCase(caseId);
    setSelectedCaseId(caseId);
  };

  const renderCaseItem = ({ item }: { item: any }) => {
    const recordings = getCaseRecordings(item.id);
    const isSelected = currentCase?.id === item.id;

    return (
      <TouchableOpacity
        style={[styles.caseItem, isSelected && styles.caseItemSelected]}
        onPress={() => router.push(`/case-detail?caseId=${item.id}`)}
      >
        <View style={styles.caseInfo}>
          <Text style={styles.caseName}>{item.name}</Text>
          <Text style={styles.caseDetails}>
            {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.caseDate}>
            Created {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.caseActions}>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteCase(item.id)}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cases</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {cases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No cases yet</Text>
          <Text style={styles.emptySubtext}>Create your first case to start recording</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Create Case</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          scrollEnabled={false}
        />
      )}

      {/* Create Case Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Case</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Case name (e.g., Federal Republic v. Obi)"
              placeholderTextColor="#999"
              value={newCaseName}
              onChangeText={setNewCaseName}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateCase}
            >
              <Text style={styles.submitButtonText}>Create Case</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    padding: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  caseItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  caseItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  caseInfo: {
    flex: 1,
  },
  caseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  caseDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  caseDate: {
    fontSize: 12,
    color: '#999',
  },
  caseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedBadge: {
    padding: 4,
  },
  deleteButton: {
    padding: 8,
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
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
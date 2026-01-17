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
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '@/store/useAppStore';
import { storageService } from '@/services/storageService';
import { Colors, Layout } from '@/theme';

export default function CasesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [newCaseName, setNewCaseName] = useState('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors;

  const cases = useAppStore((state) => state.cases);
  const currentCase = useAppStore((state) => state.currentCase);
  const createCase = useAppStore((state) => state.createCase);
  const deleteCase = useAppStore((state) => state.deleteCase);
  const setCurrentCase = useAppStore((state) => state.setCurrentCase);
  const getCaseRecordings = useAppStore((state) => state.getCaseRecordings);

  useFocusEffect(
    useCallback(() => {
      // Refresh logic potentially here
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
    } catch (error) {
      Alert.alert('Error', 'Failed to create case');
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
            } catch (error) {
              Alert.alert('Error', 'Failed to delete case');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderCaseItem = ({ item }: { item: any }) => {
    const recordings = getCaseRecordings(item.id);
    const isSelected = currentCase?.id === item.id;
    const boxColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;
    const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;

    return (
      <TouchableOpacity
        style={[styles.caseItem, { backgroundColor: boxColor, borderColor: isSelected ? colors.primary : 'transparent' }]}
        onPress={() => router.push(`/case-detail?caseId=${item.id}`)}
      >
        <View style={styles.caseHeader}>
           <View style={[styles.iconBox, { backgroundColor: isSelected ? colors.primary : '#E1E1E6' }]}>
              <Ionicons name="briefcase" size={20} color={isSelected ? 'white' : colors.text.secondary.light} />
           </View>
           <View style={styles.caseInfo}>
             <Text style={[styles.caseName, { color: textColor }]}>{item.name}</Text>
             <Text style={styles.caseDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
           </View>
           {isSelected && (
              <View style={styles.activeBadge}>
                 <Text style={styles.activeText}>ACTIVE</Text>
              </View>
           )}
        </View>

        <View style={styles.caseStats}>
           <Text style={styles.statText}>{recordings.length} Recordings</Text>
           <TouchableOpacity onPress={() => handleDeleteCase(item.id)} style={styles.deleteAction}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
           </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const bgColor = theme === 'dark' ? colors.background.dark : colors.background.light;
  const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const surfaceColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: theme === 'dark' ? colors.border.dark : colors.border.light }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Case Files</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {cases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="folder-open-outline" size={64} color={colors.text.secondary.light} />
          </View>
          <Text style={[styles.emptyText, { color: textColor }]}>No Case Files Found</Text>
          <Text style={styles.emptySubtext}>Create a new case file to verify evidence and manage recordings.</Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: colors.secondary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.emptyButtonText}>Create New Case</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Create Case Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>New Case File</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.secondary.light} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>CASE REFERENCE / NAME</Text>
            <TextInput
              style={[styles.input, { color: textColor, borderColor: theme === 'dark' ? colors.border.dark : colors.border.light }]}
              placeholder="e.g. Federal Republic v. Obi"
              placeholderTextColor={colors.text.secondary.light}
              value={newCaseName}
              onChangeText={setNewCaseName}
            />

            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.secondary }]} onPress={handleCreateCase}>
              <Text style={styles.submitButtonText}>Create File</Text>
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
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  createButton: {
    padding: 8,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderRadius: 12,
  },
  listContainer: {
    padding: 24,
    gap: 16,
  },
  caseItem: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    ...Layout.shadow.small,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caseInfo: {
    flex: 1,
  },
  caseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  caseDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  activeBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  caseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  deleteAction: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
    ...Layout.shadow.medium,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 32,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Layout.shadow.small,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
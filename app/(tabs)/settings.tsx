// app/(tabs)/settings.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '@/services/storageService';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [storageSize, setStorageSize] = useState('0 MB');

  useEffect(() => {
    // Load current settings
    const loadSettings = async () => {
      try {
        const url = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        setBackendUrl(url);

        // For now, just set a default storage size
        // In a real app, you'd calculate this from recorded files
        setStorageSize('Calculating...');
      } catch (error) {
        console.error('Failed to load settings:', error);
        setStorageSize('N/A');
      }
    };

    loadSettings();
  }, []);

  const handleSaveBackendUrl = () => {
    if (!backendUrl.trim()) {
      Alert.alert('Error', 'Backend URL cannot be empty');
      return;
    }
    Alert.alert('Success', 'Backend URL saved (requires app restart to take effect)');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all cases and recordings. This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await storageService.clearAll();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Backend Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend Configuration</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Backend URL</Text>
            <TextInput
              style={styles.input}
              placeholder="http://localhost:8000"
              placeholderTextColor="#999"
              value={backendUrl}
              onChangeText={setBackendUrl}
              editable={false}
            />
            <Text style={styles.settingHint}>
              Set via environment variable EXPO_PUBLIC_BACKEND_URL
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>API Key</Text>
            <View style={styles.apiKeyContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Not exposed in UI for security"
                placeholderTextColor="#999"
                value={showApiKey ? 'sk-••••••••••' : '••••••••••'}
                editable={false}
                secureTextEntry={!showApiKey}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowApiKey(!showApiKey)}
              >
                <Ionicons
                  name={showApiKey ? 'eye' : 'eye-off'}
                  size={20}
                  color="#007AFF"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.settingHint}>
              Set via .env file EXPO_PUBLIC_OPENAI_API_KEY
            </Text>
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Cache Size</Text>
            <Text style={styles.storageValue}>{storageSize}</Text>
            <Text style={styles.settingHint}>
              Audio recordings and transcripts stored locally
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearData}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>App Name</Text>
            <Text style={styles.infoValue}>LegalPilot AI</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>{appVersion}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Framework</Text>
            <Text style={styles.infoValue}>React Native / Expo</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Built For</Text>
            <Text style={styles.infoValue}>Nigerian Legal System</Text>
          </View>
        </View>

        {/* Help */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <View style={styles.helpItem}>
            <Ionicons name="help-circle" size={20} color="#007AFF" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.helpTitle}>How to Use</Text>
              <Text style={styles.helpText}>
                1. Create or select a case{'\n'}
                2. Tap the red button to record (max 30 seconds){'\n'}
                3. View transcript and legal analysis{'\n'}
                4. Copy one-liner for courtroom response
              </Text>
            </View>
          </View>

          <View style={styles.helpItem}>
            <Ionicons name="wifi" size={20} color="#FF9800" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.helpTitle}>Offline Mode</Text>
              <Text style={styles.helpText}>
                Recordings are saved locally and processed when you reconnect to the internet.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built with 🚀 for Nigerian lawyers
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  settingHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeButton: {
    padding: 8,
  },
  storageValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    marginVertical: 8,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  infoItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  helpItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
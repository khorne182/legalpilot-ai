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
  useColorScheme,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storageService } from '@/services/storageService';
import Constants from 'expo-constants';
import { Colors, Layout } from '@/theme';

export default function SettingsScreen() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [showApiKey, setShowApiKey] = useState(false);
  const [storageSize, setStorageSize] = useState('0 MB');
  
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = Colors;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const url = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        setBackendUrl(url);
        setStorageSize('Calculating...');
        // Mock calculation or actual logic here
        setTimeout(() => setStorageSize('12.4 MB'), 1000); 
      } catch (error) {
        setStorageSize('N/A');
      }
    };
    loadSettings();
  }, []);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all cases and recordings. This cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear Data',
          onPress: async () => {
            try {
              await storageService.clearAll();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const bgColor = theme === 'dark' ? colors.background.dark : colors.background.light;
  const surfaceColor = theme === 'dark' ? colors.surface.dark : colors.surface.light;
  const textColor = theme === 'dark' ? colors.text.primary.dark : colors.text.primary.light;
  const secondaryText = colors.text.secondary.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      
      <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: theme === 'dark' ? colors.border.dark : colors.border.light }]}>
         <Text style={[styles.headerTitle, { color: textColor }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Connection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONNECTION</Text>
          <View style={[styles.card, { backgroundColor: surfaceColor }]}>
             <View style={styles.row}>
                <View style={styles.rowIcon}>
                   <Ionicons name="server-outline" size={20} color={colors.secondary} />
                </View>
                <View style={styles.rowContent}>
                   <Text style={[styles.rowLabel, { color: textColor }]}>Backend URL</Text>
                   <Text style={[styles.rowValue, { color: secondaryText }]}>{backendUrl}</Text>
                </View>
             </View>
             <View style={[styles.divider, { backgroundColor: theme === 'dark' ? colors.border.dark : colors.border.light }]} />
             <View style={styles.row}>
                <View style={styles.rowIcon}>
                   <Ionicons name="key-outline" size={20} color={colors.secondary} />
                </View>
                <View style={[styles.rowContent, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                   <View>
                      <Text style={[styles.rowLabel, { color: textColor }]}>API Key</Text>
                      <Text style={[styles.rowValue, { color: secondaryText }]}>{showApiKey ? 'sk-••••••••••' : '••••••••••'}</Text>
                   </View>
                   <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
                      <Ionicons name={showApiKey ? "eye-off" : "eye"} size={20} color={colors.secondary} />
                   </TouchableOpacity>
                </View>
             </View>
          </View>
          <Text style={styles.hint}>Managed via environment variables for security.</Text>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA MANAGEMENT</Text>
          <View style={[styles.card, { backgroundColor: surfaceColor }]}>
             <View style={styles.row}>
                <View style={styles.rowIcon}>
                   <Ionicons name="save-outline" size={20} color={colors.secondary} />
                </View>
                <View style={styles.rowContent}>
                   <Text style={[styles.rowLabel, { color: textColor }]}>Local Storage Used</Text>
                   <Text style={[styles.rowValue, { color: secondaryText }]}>{storageSize}</Text>
                </View>
             </View>
             <View style={[styles.divider, { backgroundColor: theme === 'dark' ? colors.border.dark : colors.border.light }]} />
             
             <TouchableOpacity style={styles.actionRow} onPress={handleClearData}>
                <Text style={[styles.actionLabel, { color: colors.destructive }]}>Clear All App Data</Text>
                <Ionicons name="trash-outline" size={20} color={colors.destructive} />
             </TouchableOpacity>
          </View>
        </View>

        {/* About & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={[styles.card, { backgroundColor: surfaceColor }]}>
             <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>Version</Text>
                <Text style={[styles.rowValue, { color: secondaryText }]}>{appVersion}</Text>
             </View>
             <View style={[styles.divider, { backgroundColor: theme === 'dark' ? colors.border.dark : colors.border.light }]} />
             <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: textColor }]}>Legal Jurisdiction</Text>
                <Text style={[styles.rowValue, { color: secondaryText }]}>Nigeria (Common Law)</Text>
             </View>
          </View>
        </View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>LegalPilot AI • Empowering Counsel</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    marginBottom: 12,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Layout.shadow.small,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 60,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    marginLeft: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#C7C7CC',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
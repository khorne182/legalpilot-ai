// src/services/audioService.ts
import {Audio} from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

interface RecordingResult {
  uri: string;
  duration: number;
  id: string;
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;

  async requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio permissions not granted');
    }
  }

  async startRecording(): Promise<void> {
    try {
      await this.requestPermissions();

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const recordingInstance = new Audio.Recording();

      // Use the correct recording options format
      await recordingInstance.prepareToRecordAsync({
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MAX,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      await recordingInstance.startAsync();
      this.recording = recordingInstance;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingResult> {
    if (!this.recording) {
      throw new Error('No recording in progress');
    }

    try {
      await this.recording.stopAndUnloadAsync();

      const uri = this.recording.getURI();
      const status = await this.recording.getStatusAsync();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      this.recording = null;

      return {
        uri,
        duration: status.isRecording && status.durationMillis ? status.durationMillis / 1000 : 0,
        id: uuidv4(),
      };
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      await FileSystem.deleteAsync(uri);
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  async getRecordingDuration(uri: string): Promise<number> {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      if (status.isLoaded) {
        return status.durationMillis ? status.durationMillis / 1000 : 0;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      throw error;
    }
  }

  async playRecording(uri: string): Promise<void> {
    try {
      const sound = new Audio.Sound();
      await sound.loadAsync({ uri });
      this.sound = sound;
      await sound.playAsync();
    } catch (error) {
      console.error('Failed to play recording:', error);
      throw error;
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      } catch (error) {
        console.error('Failed to stop playback:', error);
      }
    }
  }

  isRecording(): boolean {
    return this.recording !== null;
  }
}

export const audioService = new AudioService();
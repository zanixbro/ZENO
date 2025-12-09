import React from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type Personality = 'zeno' | 'sarcastic' | 'pirate' | 'shakespeare' | 'custom';

export type NavID =
  | 'ask'
  | 'savor_gallery' // Dedicated page for content gallery
  | 'settings'
  // Individual tool IDs
  | 'creative'
  | 'videoGen'
  | 'videoEdit'
  | 'productivity'
  | 'knowledge'
  | 'voice_conversation'
  | 'web_maker'
  | 'ml_workflow'
  | 'camera_vision'
  | 'code_generator'
  | 'game_maker' // New: Game Maker
  | 'login'; // New: Placeholder Login page

export interface MenuItem<T extends string = NavID> {
  id: T;
  name: string;
  icon: React.FC<{ className?: string }>;
}

export interface MenuGroup {
  category: string;
  items: MenuItem<NavID>[];
}

export type VoiceCommandStatus =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error'
  | 'off';

export type VoiceCommandAction =
  | 'navigateToPage'
  | 'changePersonality';

export interface TranscriptionEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface GeneratedImageEntry {
  id: string; // Unique ID for the entry
  url: string;
  prompt: string;
  timestamp: string;
}

export interface GeneratedVideoEntry {
  id: string; // Unique ID for the entry
  url: string;
  prompt: string;
  timestamp: string;
}

export interface GeneratedAudioEntry {
  id: string; // Unique ID for the entry
  url: string; // Blob URL for the audio
  text: string; // The text that generated the audio
  timestamp: string;
}

export interface GeneratedWebpageEntry {
  id: string; // Unique ID for the entry
  html: string;
  css: string;
  javascript: string;
  prompt: string;
  timestamp: string;
}

export interface GeneratedCodeEntry {
  id: string; // Unique ID for the entry
  code: string;
  language: string; // e.g., 'python', 'javascript', 'html', 'css', '3d-description', 'threejs-game'
  prompt: string;
  timestamp: string;
}
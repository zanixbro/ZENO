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
  | 'game_maker'
  | 'login'
  | 'logout' // New: Logout action
  | 'zeno_connect'; // New: Zeno Connect social platform

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

// New: Social Post interfaces for Zeno Connect
export interface SocialPost {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'webpage' | 'code';
  content: {
    text?: string; // For text posts, audio text
    url?: string;  // For image, video, audio URLs
    thumbnail?: string; // For video/webpage thumbnails
    html?: string; // For webpage content
    css?: string;
    javascript?: string;
    code?: string; // For code content
    language?: string; // For code language
  };
  author: string; // 'You' or AI persona
  prompt: string; // Original prompt used to generate content
  timestamp: string;
  likes: number;
  comments: { author: string; text: string; timestamp: string }[];
}
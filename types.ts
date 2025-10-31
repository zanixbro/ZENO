
import React from 'react';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export type Personality = 'zeno' | 'sarcastic' | 'pirate' | 'shakespeare';

export type PageID =
  | 'ask'
  | 'creative'
  | 'video'
  | 'productivity'
  | 'knowledge'
  | 'ml_workflow'
  | 'settings';

export interface MenuItem {
  id: PageID;
  name: string;
  icon: React.FC<{ className?: string }>;
}

export interface MenuGroup {
  category: string;
  items: MenuItem[];
}

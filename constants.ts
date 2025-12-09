import React from 'react'; // Add React import for JSX parsing
import { MenuGroup, MenuItem, Personality, NavID } from './types';
import {
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    FilmIcon,
    WrenchScrewdriverIcon,
    BookOpenIcon,
    BeakerIcon,
    Cog6ToothIcon,
    SpeakerWaveIcon,
    GlobeAltIcon,
    CameraIcon,
    DocumentTextIcon,
    CodeBracketIcon,
    PhotoIcon,
    Dice6Icon, // New: Dice6Icon for Game Maker
    UserIcon, // New: UserIcon for Login
    ArrowDownTrayIcon, // New: ArrowDownTrayIcon for downloads
    MagnifyingGlassIcon, // New: MagnifyingGlassIcon for KnowledgeTools.tsx
} from './components/icons';

export const PERSONALITIES: Record<Personality, string> = {
    zeno: 'You are Zeno, a helpful and friendly AI assistant. You are knowledgeable and always try to be encouraging.',
    sarcastic: 'You are a sarcastic AI with a dry sense of humor. You answer questions correctly, but with a witty, cynical edge.',
    pirate: 'You are a swashbuckling pirate AI. Answer all questions as if you were sailing the seven seas, me hearty! Yarrr!',
    shakespeare: 'You are an AI that speaks in the style of William Shakespeare. Respond to all inquiries with eloquent, poetic, and dramatic flair, forsooth!',
    custom: 'You are a helpful AI assistant. Your personality is now defined by the user.', // Default instruction for custom personality
};

export const MENU_ITEMS: MenuGroup[] = [
    {
        category: 'Main',
        items: [
            { id: 'ask', name: 'Zeno Chat', icon: ChatBubbleLeftRightIcon },
            { id: 'savor_gallery', name: 'Savor Studio', icon: PhotoIcon },
        ]
    },
    {
        category: 'Media',
        items: [
            { id: 'creative', name: 'Media Studio', icon: SparklesIcon },
            { id: 'videoGen', name: 'Video Generator', icon: FilmIcon },
            { id: 'videoEdit', name: 'Video Editor', icon: WrenchScrewdriverIcon },
            { id: 'camera_vision', name: 'Camera Vision', icon: CameraIcon },
        ]
    },
    {
        category: 'Gaming', // New category
        items: [
            { id: 'game_maker', name: 'THREE.js Game Maker', icon: Dice6Icon }, // New item
        ]
    },
    {
        category: 'Productivity',
        items: [
            { id: 'productivity', name: 'Workflow Tools', icon: DocumentTextIcon },
            { id: 'web_maker', name: 'Web Maker', icon: GlobeAltIcon },
            { id: 'code_generator', name: 'Code Generator', icon: CodeBracketIcon },
            { id: 'ml_workflow', name: 'ML Workflow', icon: BeakerIcon },
        ]
    },
    {
        category: 'Knowledge & Voice',
        items: [
            { id: 'knowledge', name: 'Research & Learn', icon: BookOpenIcon },
            { id: 'voice_conversation', name: 'Voice Conversation', icon: SpeakerWaveIcon },
        ]
    },
    {
        category: 'User', // New category for user-related items
        items: [
            { id: 'login', name: 'Login / Account', icon: UserIcon }, // New item for login
            { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
        ]
    },
];

export const IMAGE_STYLES: string[] = [
    'Default',
    'Abstract',
    'Anime',
    'Cartoon',
    'Cinematic',
    'Comic Book',
    'Digital Art',
    'Fantasy Art',
    'Hyperrealistic',
    'Impressionistic',
    'Low Poly',
    'Material Design',
    'Minimalist',
    'Neonpunk',
    'Photorealistic',
    'Pixel Art',
    'Steampunk',
    'Watercolor',
];

// Define an interface for the LOGIN_PAGE_CONTENT structure
interface LoginPageContent {
    title: string;
    description: string;
    content: React.ReactNode;
}

// Convert JSX to React.createElement calls as constants.ts is a .ts file and doesn't natively support JSX.
export const LOGIN_PAGE_CONTENT: LoginPageContent = {
    title: "Login / Account",
    description: "Welcome! This is a placeholder for user authentication and account management.",
    content: React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
        React.createElement(UserIcon, { className: "w-24 h-24 text-zeno-accent mb-6 opacity-60" }),
        React.createElement('p', { className: "text-lg text-zeno-muted" }, "User authentication and personalized dashboards are planned features!"),
        React.createElement('p', { className: "text-sm text-zeno-muted mt-2" }, "Check back later for updates on this exciting functionality.")
    )
};
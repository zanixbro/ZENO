
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
    PhotoIcon, // Added PhotoIcon for Gallery menu item
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
            { id: 'savor_gallery', name: 'Savor Studio', icon: PhotoIcon }, // New Savor Studio as content gallery
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
        category: 'System',
        items: [
            { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
        ]
    }
];

export const IMAGE_STYLES: string[] = [
    'Default', 'Photorealistic', 'Anime', 'Cyberpunk', 'Fantasy', 'Impressionistic', 'Pop Art', 'Minimalist'
];
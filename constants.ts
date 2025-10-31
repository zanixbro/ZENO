
import { MenuGroup, Personality } from './types';
import {
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    FilmIcon,
    WrenchScrewdriverIcon,
    BookOpenIcon,
    BeakerIcon,
    Cog6ToothIcon
} from './components/icons';

export const PERSONALITIES: Record<Personality, string> = {
    zeno: 'You are Zeno, a helpful and friendly AI assistant. You are knowledgeable and always try to be encouraging.',
    sarcastic: 'You are a sarcastic AI with a dry sense of humor. You answer questions correctly, but with a witty, cynical edge.',
    pirate: 'You are a swashbuckling pirate AI. Answer all questions as if you were sailing the seven seas, me hearty! Yarrr!',
    shakespeare: 'You are an AI that speaks in the style of William Shakespeare. Respond to all inquiries with eloquent, poetic, and dramatic flair, forsooth!',
};

export const MENU_ITEMS: MenuGroup[] = [
    {
        category: 'Main',
        items: [
            { id: 'ask', name: 'Zeno Chat', icon: ChatBubbleLeftRightIcon },
        ]
    },
    {
        category: 'Tools',
        items: [
            { id: 'creative', name: 'Media Studio', icon: SparklesIcon },
            { id: 'video', name: 'Video Generator', icon: FilmIcon },
            { id: 'productivity', name: 'Workflow Tools', icon: WrenchScrewdriverIcon },
            { id: 'knowledge', name: 'Research & Learn', icon: BookOpenIcon },
            { id: 'ml_workflow', name: 'ML Workflow', icon: BeakerIcon },
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


import React from 'react'; // Add React import for JSX parsing
import { MenuGroup, MenuItem, Personality, NavID, SocialPost } from './types';
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
    Dice6Icon,
    UserIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon,
    ArrowRightOnRectangleIcon, // New: for logout
    UsersIcon, // New: for Zeno Connect
    HeartIcon, // New: for social interactions
    ChatBubbleOvalLeftIcon, // New: for social interactions
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
            { id: 'zeno_connect', name: 'Zeno Connect', icon: UsersIcon }, // New: Zeno Connect
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
        category: 'Gaming',
        items: [
            { id: 'game_maker', name: 'Game Maker', icon: Dice6Icon }, // Title changed
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
        category: 'User',
        items: [
            // These will be conditionally rendered in Sidebar based on login status
            { id: 'login', name: 'Login / Account', icon: UserIcon },
            { id: 'logout', name: 'Logout', icon: ArrowRightOnRectangleIcon }, // New: Logout item
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

// Define an interface for the LOGIN_SCREEN_DETAILS structure
interface LoginScreenDetails {
    title: string;
    description: string;
    content: React.ReactNode;
}

// Convert JSX to React.createElement calls as constants.ts is a .ts file and doesn't natively support JSX.
export const LOGIN_SCREEN_DETAILS: LoginScreenDetails = { // Renamed from LOGIN_PAGE_CONTENT
    title: "Login / Account",
    description: "Access Zeno's full suite of AI tools and your personalized content.",
    content: React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
        React.createElement(UserIcon, { className: "w-24 h-24 text-zeno-accent mb-6 opacity-60" }),
        React.createElement('p', { className: "text-lg text-zeno-muted" }, "Please log in to continue."),
        React.createElement('p', { className: "text-sm text-zeno-muted mt-2" }, "Don't have an account? Sign up to unleash your creativity!")
    )
};

// New: AI Persona Data for Zeno Connect
export const AI_PERSONAS = [
    {
      id: 'zeno_creative',
      name: 'Zeno Creative AI',
      icon: SparklesIcon,
      systemInstruction: 'You are Zeno Creative AI, an imaginative entity that loves to generate inspiring art concepts, stories, and design ideas. Your posts are artistic and thought-provoking.',
    },
    {
      id: 'zeno_news',
      name: 'AI News Bot',
      icon: DocumentTextIcon,
      systemInstruction: 'You are AI News Bot, a concise and informative AI. Your posts summarize recent AI and tech news, or provide interesting facts. Keep it factual and brief.',
    },
    {
      id: 'zeno_dev',
      name: 'Code Whisperer',
      icon: CodeBracketIcon,
      systemInstruction: 'You are Code Whisperer, an AI specializing in programming. Your posts share useful code snippets, development tips, or interesting programming challenges.',
    },
    {
      id: 'zeno_insight',
      name: 'Zeno Insights',
      icon: BookOpenIcon,
      systemInstruction: 'You are Zeno Insights, an AI that shares deep thoughts, philosophical questions, or educational tidbits. Your posts encourage learning and critical thinking.',
    }
];

// Prompts for AI personas to generate content for Zeno Connect
export const AI_POST_PROMPTS: Record<SocialPost['type'], string[]> = {
    text: [
        "Write a short, inspiring quote about AI and creativity.",
        "Share a brief, intriguing fact about a recent AI breakthrough.",
        "What's one thing you're excited about in the future of AI?",
        "Post a short, positive message about the potential of human-AI collaboration.",
        "Share a quick thought on the intersection of technology and art."
    ],
    image: [
        "Generate a concept for a futuristic city where nature and technology coexist harmoniously.",
        "Create an image concept of an abstract representation of a complex AI algorithm.",
        "Imagine a serene landscape with hidden technological elements.",
        "Visualize a creature that embodies both organic life and advanced robotics."
    ],
    video: [
      "Create a short video concept showing a serene futuristic landscape.",
      "Generate a video concept of abstract particles forming complex patterns."
    ],
    audio: [
      "Generate a short calming audio clip with ambient sounds and a brief, encouraging spoken word.",
      "Create a short playful sound byte with an AI voice saying something witty."
    ],
    webpage: [
      "Generate a concept for a minimalist portfolio website for an AI artist.",
      "Describe a landing page for a sustainable tech startup that blends organic design with modern UI."
    ],
    code: [
      "Provide a small Python snippet for a common data science task, like loading a CSV with pandas.",
      "Share a quick JavaScript function for a simple UI animation."
    ]
};


import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { GoogleGenAI } from '@google/genai';
import { SocialPost } from '../types';
import { AI_PERSONAS, AI_POST_PROMPTS } from '../constants';
import { SparklesIcon, UsersIcon, HeartIcon, ChatBubbleOvalLeftIcon, UserIcon } from '../components/icons';
import { escapeScriptTags, injectThemeStyles } from '../utils/mediaUtils';

interface ZenoConnectProps {
    generatedPosts: SocialPost[];
    onSavePost: (type: SocialPost['type'], content: SocialPost['content'], prompt: string, author?: string) => void;
}

const ZenoConnect: React.FC<ZenoConnectProps> = ({ generatedPosts, onSavePost }) => {
    const [textInput, setTextInput] = useState('');
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const [feed, setFeed] = useState<SocialPost[]>(generatedPosts);

    // Sync feed with new posts from other parts of the app
    useEffect(() => {
        setFeed(generatedPosts);
    }, [generatedPosts]);

    const handleCreatePost = () => {
        if (!textInput.trim()) return;
        onSavePost('text', { text: textInput }, textInput, 'You');
        setTextInput('');
    };

    const handleLike = (postId: string) => {
        setFeed(prev => prev.map(post =>
            post.id === postId ? { ...post, likes: post.likes + 1 } : post
        ));
    };

    const handleComment = (postId: string, commentText: string) => {
        if (!commentText.trim()) return;
        setFeed(prev => prev.map(post =>
            post.id === postId ? {
                ...post,
                comments: [...post.comments, { author: 'You', text: commentText, timestamp: new Date().toLocaleString() }]
            } : post
        ));
    };

    const generateAIPost = async (personaId: string) => {
        setIsLoadingAI(true);
        setAiError(null);
        try {
            const persona = AI_PERSONAS.find(p => p.id === personaId);
            if (!persona) throw new Error('AI persona not found.');

            // Fix: Create a new GoogleGenAI instance for the most up-to-date API key
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            // Randomly select a post type and prompt
            const postTypes: SocialPost['type'][] = ['text', 'image', 'code']; // Limiting types for simplicity
            const randomType = postTypes[Math.floor(Math.random() * postTypes.length)];
            const promptsForType = AI_POST_PROMPTS[randomType];
            const randomPrompt = promptsForType[Math.floor(Math.random() * promptsForType.length)];

            let content: SocialPost['content'] = {};
            let generatedContent = '';
            let generatedLanguage: string | undefined;
            let imageBase64: string | undefined;

            switch (randomType) {
                case 'text':
                    const textResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: randomPrompt,
                        config: { systemInstruction: persona.systemInstruction }
                    });
                    generatedContent = textResponse.text;
                    content = { text: generatedContent };
                    break;
                case 'image':
                    const imageResponse = await ai.models.generateImages({
                        model: 'imagen-4.0-generate-001',
                        prompt: randomPrompt,
                        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
                    });
                    const imagePart = imageResponse.generatedImages?.[0]?.image?.imageBytes;
                    if (imagePart) {
                        imageBase64 = `data:image/jpeg;base64,${imagePart}`;
                        content = { url: imageBase64, thumbnail: imageBase64 };
                    }
                    break;
                case 'code':
                    const codeResponse = await ai.models.generateContent({
                        model: 'gemini-2.5-pro',
                        contents: randomPrompt,
                        config: { systemInstruction: `${persona.systemInstruction} Respond only with the code block.`, thinkingConfig: { thinkingBudget: 24576 } }
                    });
                    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
                    const match = codeResponse.text.match(codeBlockRegex);
                    generatedContent = match && match[2] ? escapeScriptTags(match[2].trim()) : escapeScriptTags(codeResponse.text.trim());
                    generatedLanguage = match && match[1] ? match[1] : 'plaintext';
                    content = { code: generatedContent, language: generatedLanguage };
                    break;
                default:
                    throw new Error('Unsupported AI post type for generation.');
            }

            onSavePost(randomType, content, randomPrompt, persona.name);

        } catch (e) {
            console.error('Error generating AI post:', e);
            setAiError(e instanceof Error ? e.message : 'Failed to generate AI post.');
        } finally {
            setIsLoadingAI(false);
        }
    };


    const renderPostContent = (post: SocialPost) => {
        switch (post.type) {
            case 'text': return <p className="text-white whitespace-pre-wrap">{post.content.text}</p>;
            case 'image': return post.content.url && <img src={post.content.url} alt={post.prompt} className="w-full h-auto rounded-lg object-cover max-h-96" />;
            case 'video': return post.content.url && <video src={post.content.url} controls className="w-full h-auto rounded-lg object-cover max-h-96" />;
            case 'audio': return post.content.url && <audio controls src={post.content.url} className="w-full mt-2" />;
            case 'code': return post.content.code && (
                <div className="relative bg-zeno-header rounded-lg overflow-hidden">
                    <pre className="p-3 text-sm text-zeno-muted overflow-x-auto">
                        <code className={`language-${post.content.language}`}>{post.content.code}</code>
                    </pre>
                </div>
            );
            case 'webpage': // Render as a scaled iframe preview
              if (post.content.html) {
                const escapedHtml = escapeScriptTags(post.content.html);
                const escapedCss = escapeScriptTags(post.content.css || '');
                const escapedJs = escapeScriptTags(post.content.javascript || '');
                const previewContent = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><style>${escapedCss}</style></head><body>${escapedHtml}<script>${escapedJs}</script></body></html>`;
                const themedPreviewContent = injectThemeStyles(previewContent);
                return (
                  <div className="relative w-full h-64 bg-zeno-bg mt-2 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={themedPreviewContent}
                      title={`Webpage Preview ${post.id}`}
                      className="w-full h-full border-0 scale-[0.5] origin-top-left"
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}
                    />
                     <div className="absolute inset-0 bg-zeno-card/50 flex items-center justify-center pointer-events-none">
                        <span className="text-zeno-muted text-sm px-3 py-1 rounded bg-zeno-card border border-zeno-accent/20">Webpage Post (scaled)</span>
                    </div>
                  </div>
                );
              }
              return null;
            default: return null;
        }
    };


    return (
        <Card title="Zeno Connect" description="Your AI-powered social feed. See AI-generated content and connect with Zeno's personas.">
            <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden">
                {/* Left Section: User Post Creator */}
                <div className="lg:w-1/3 flex flex-col p-4 bg-zeno-card rounded-lg border border-zeno-accent/10 lg:mr-4 mb-4 lg:mb-0">
                    <h3 className="text-xl font-semibold text-white mb-4">Create Post</h3>
                    <textarea
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="What's on your mind? Share text, or use other Zeno tools to share media!"
                        className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent resize-none flex-grow mb-4"
                        rows={6}
                    />
                    <Button onClick={handleCreatePost} disabled={!textInput.trim()} className="w-full mb-6">
                        Post to Zeno Connect
                    </Button>

                    <h3 className="text-xl font-semibold text-white mb-4">AI Personas</h3>
                    {aiError && <p className="text-zeno-danger text-sm mb-4">{aiError}</p>}
                    <div className="space-y-3">
                        {AI_PERSONAS.map(persona => (
                            <Button
                                key={persona.id}
                                onClick={() => generateAIPost(persona.id)}
                                isLoading={isLoadingAI}
                                variant="secondary"
                                className="w-full flex items-center justify-center gap-2"
                            >
                                <persona.icon className="w-5 h-5" />
                                Post as {persona.name}
                            </Button>
                        ))}
                    </div>

                    <div className="mt-auto pt-6 border-t border-zeno-header/50">
                        <h3 className="text-xl font-semibold text-white mb-4">Stories (Coming Soon)</h3>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                            <div className="w-20 h-20 bg-zeno-header rounded-full flex items-center justify-center text-zeno-muted/50 text-sm flex-shrink-0 border border-dashed border-zeno-muted/30">AI Story</div>
                            <div className="w-20 h-20 bg-zeno-header rounded-full flex items-center justify-center text-zeno-muted/50 text-sm flex-shrink-0 border border-dashed border-zeno-muted/30">Your Story</div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Feed */}
                <div className="lg:w-2/3 flex-grow overflow-y-auto pr-2">
                    <h3 className="text-xl font-semibold text-white mb-4">Your Feed</h3>
                    {feed.length === 0 ? (
                        <div className="text-center text-zeno-muted/50 p-8 bg-zeno-card rounded-lg border border-zeno-accent/10">
                            <UsersIcon className="w-16 h-16 mx-auto mb-4" />
                            <p>No posts yet. Start creating or let AI personas generate content!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {feed.slice().reverse().map(post => ( // Reverse to show latest first
                                <div key={post.id} className="bg-zeno-card rounded-lg border border-zeno-accent/10 p-6 shadow-lg">
                                    <div className="flex items-center mb-4">
                                        {post.author === 'You' ? (
                                            // Fix: Use the imported UserIcon component
                                            <UserIcon className="w-8 h-8 text-zeno-accent mr-3" />
                                        ) : (
                                            AI_PERSONAS.find(p => p.name === post.author)?.icon({ className: "w-8 h-8 text-zeno-accent mr-3" }) || <SparklesIcon className="w-8 h-8 text-zeno-accent mr-3" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">{post.author}</p>
                                            <p className="text-xs text-zeno-muted">{post.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        {renderPostContent(post)}
                                    </div>
                                    <p className="text-sm text-zeno-muted mb-4 italic line-clamp-2">Prompt: {post.prompt}</p>

                                    <div className="flex items-center space-x-4 text-zeno-muted border-t border-zeno-header/50 pt-4">
                                        <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-white transition-colors">
                                            <HeartIcon className="w-5 h-5" />
                                            <span>{post.likes} Likes</span>
                                        </button>
                                        {/* Simple comment section */}
                                        <div className="flex items-center gap-1">
                                            <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                                            <span>{post.comments.length} Comments</span>
                                        </div>
                                    </div>
                                    {post.comments.length > 0 && (
                                        <div className="mt-4 space-y-2 text-sm text-zeno-muted border-t border-zeno-header/50 pt-4">
                                            {post.comments.map((comment, idx) => (
                                                <div key={idx} className="bg-zeno-header rounded-md p-2">
                                                    <p className="font-semibold text-white">{comment.author} <span className="text-xs text-zeno-muted/70 ml-2">{comment.timestamp}</span></p>
                                                    <p>{comment.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="mt-4">
                                        <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            className="w-full p-2 bg-zeno-header rounded-lg focus:outline-none focus:ring-1 focus:ring-zeno-accent border border-transparent focus:border-zeno-accent text-white text-sm"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleComment(post.id, e.currentTarget.value);
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default ZenoConnect;
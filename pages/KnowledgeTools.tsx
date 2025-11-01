import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { MagnifyingGlassIcon, BookOpenIcon, PaperAirplaneIcon } from '../components/icons';
import { ChatMessage } from '../types';

type GroundingChunk = { web?: { uri: string; title: string; } };

// --- WEB SEARCH ---
const WebSearch: React.FC = () => {
    const [prompt, setPrompt] = useState('What are the latest advancements in AI?');
    const [result, setResult] =useState('');
    const [sources, setSources] = useState<GroundingChunk[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult('');
        setSources([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { tools: [{googleSearch: {}}] },
            });
            setResult(response.text);
            const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
            if (groundingMetadata?.groundingChunks) {
                setSources(groundingMetadata.groundingChunks as GroundingChunk[]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center space-x-2 mb-4">
                <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSearch()} placeholder="Ask about recent events, news, or any up-to-date topic..." className="flex-1 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent" />
                <Button onClick={handleSearch} isLoading={isLoading}>Search</Button>
            </div>
            {error && <p className="text-zeno-danger text-sm my-2">{error}</p>}
            <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10">
                {isLoading && <p>Searching the web...</p>}
                {result && (
                    <div>
                        <p className="whitespace-pre-wrap text-white">{result}</p>
                        {sources.length > 0 && (
                            <div className="mt-6 border-t border-zeno-header pt-4">
                                <h4 className="font-semibold text-zeno-accent mb-2">Sources:</h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {sources.map((source, index) => (
                                        source.web && <li key={index}><a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-zeno-muted hover:text-zeno-accent hover:underline">{source.web.title}</a></li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
                 {!result && !isLoading && <p className="text-zeno-muted/50">Search results appear here.</p>}
            </div>
        </div>
    );
};

// --- AI TUTOR ---
const AITutor: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('Explain the theory of relativity like I\'m five.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatInstance = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatInstance.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction: "You are a patient and knowledgeable AI Tutor. Your goal is to explain complex topics simply and effectively. Adapt your teaching style to the user's level of understanding. Encourage questions and provide step-by-step guidance." }
            });
            setHistory([]);
            setError(null);
        } catch (e) { 
            setError('Failed to initialize the AI model. Please check your API key.'); 
            console.error(e);
        }
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isLoading]);

    const handleSend = async () => {
        if (!input.trim() || !chatInstance.current) return;
        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setHistory(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);
        setError(null);
        try {
            const response = await chatInstance.current.sendMessage({ message: currentInput });
            setHistory(prev => [...prev, { role: 'model', parts: [{ text: response.text }] }]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
            setHistory(prev => prev.slice(0, -1)); // Remove user message if model fails
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col overflow-hidden bg-zeno-bg p-4 rounded-lg border border-zeno-accent/10">
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {history.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-3xl px-5 py-3 rounded-xl shadow-md whitespace-pre-wrap ${msg.role === 'user' ? 'bg-zeno-accent text-zeno-bg' : 'bg-zeno-header text-zeno-muted'}`}>
                                {msg.parts[0].text}
                            </div>
                        </div>
                    ))}
                    {isLoading && history[history.length-1]?.role !== 'model' && (
                        <div className="flex justify-start">
                            <div className="max-w-xl px-4 py-2 rounded-xl bg-zeno-header">
                                <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse [animation-delay:0.4s]"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {error && <p className="text-zeno-danger text-sm mt-2">{error}</p>}
                <div className="mt-4 flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                        placeholder="Ask Zeno Tutor a question..."
                        className="flex-1 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent border border-transparent focus:border-zeno-accent"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}><PaperAirplaneIcon className="w-5 h-5"/></Button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const KnowledgeTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState('webSearch'); // Default to Web Search

    const renderContent = () => {
        switch (activeTab) {
            case 'webSearch': return <WebSearch />;
            case 'aiTutor': return <AITutor />;
            default: return <WebSearch />; // Fallback to Web Search
        }
    };

    return (
        <Card title="Research & Learn" description="Expand your knowledge with web search and an AI tutor.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('webSearch')} className={`${activeTab === 'webSearch' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><MagnifyingGlassIcon className="w-5 h-5"/>Web Search</button>
                        <button onClick={() => setActiveTab('aiTutor')} className={`${activeTab === 'aiTutor' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><BookOpenIcon className="w-5 h-5"/>AI Tutor</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </Card>
    );
};

export default KnowledgeTools;
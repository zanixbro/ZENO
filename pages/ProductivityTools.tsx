
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, Part } from '@google/genai';
import { fileToBase64, fileToText } from '../utils/mediaUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon, DocumentTextIcon, CodeBracketIcon } from '../components/icons';

// --- FILE ANALYZER ---
const FileAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Summarize this document in three bullet points.');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult('');
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file || !prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let filePart: Part;
            if (file.type.startsWith('image/')) {
                filePart = { inlineData: { data: await fileToBase64(file), mimeType: file.type } };
            } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
                 filePart = { text: `File content of "${file.name}":\n\n${await fileToText(file)}` };
            } else {
                throw new Error("Unsupported file type. Please upload an image, text, or CSV file.");
            }
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [filePart, { text: prompt }] }
            });
            setResult(response.text);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                <div className="flex flex-col space-y-4">
                    <input type="file" accept="image/*,text/*,application/pdf,.csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50">
                        {file ? `Selected: ${file.name}` : 'Upload File (.txt, .csv, .pdf, .png, etc.)'}
                    </button>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Summarize this file' or 'Extract key data points from this CSV'" className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow" disabled={!file}/>
                    <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!file || !prompt} className="w-full">Analyze</Button>
                </div>
                <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10">
                    {error && <p className="text-zeno-danger text-sm">{error}</p>}
                    {isLoading ? <p>Analyzing...</p> : result ? <p className="whitespace-pre-wrap text-white">{result}</p> : <p className="text-zeno-muted/50">Analysis results will appear here.</p>}
                </div>
            </div>
        </div>
    );
};

// --- CODE ASSISTANT ---
const CodeAssistant: React.FC = () => {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('Write a python function that returns the fibonacci sequence');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const chatInstance = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            chatInstance.current = ai.chats.create({
                model: 'gemini-2.5-pro',
                config: { systemInstruction: "You are an expert programmer and code assistant. Provide clear, concise, and accurate code examples and explanations. Use markdown for code blocks." }
            });
        } catch (e) { setError('Failed to initialize the AI model.'); }
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

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
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            setHistory(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-zeno-bg p-4 rounded-lg border border-zeno-accent/10">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {history.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-3xl px-5 py-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-zeno-accent text-zeno-bg' : 'bg-zeno-header text-zeno-muted'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center space-x-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()} placeholder="Ask a coding question or request a script..." className="flex-1 p-3 bg-zeno-header rounded-lg" disabled={isLoading} />
                <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}><PaperAirplaneIcon className="w-5 h-5"/></Button>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ProductivityTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState('fileAnalyzer');
    return (
        <Card title="Workflow Tools" description="Enhance your productivity with AI-powered file analysis and a dedicated coding assistant.">
            <div className="flex flex-col h-full">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('fileAnalyzer')} className={`${activeTab === 'fileAnalyzer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><DocumentTextIcon className="w-5 h-5"/>File Analyzer</button>
                        <button onClick={() => setActiveTab('codeAssistant')} className={`${activeTab === 'codeAssistant' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><CodeBracketIcon className="w-5 h-5"/>Code Assistant</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {activeTab === 'fileAnalyzer' ? <FileAnalyzer /> : <CodeAssistant />}
                </div>
            </div>
        </Card>
    );
};

export default ProductivityTools;

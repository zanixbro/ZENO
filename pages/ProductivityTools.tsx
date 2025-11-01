import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import { fileToBase64, fileToText } from '../utils/mediaUtils';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { ChatMessage } from '../types';
import { PaperAirplaneIcon, DocumentTextIcon, CodeBracketIcon, GlobeAltIcon } from '../components/icons';

// --- FILE ANALYZER ---
const FileAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Summarize this document in three bullet points.');
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = (selectedFile: File | undefined) => {
        if (selectedFile) {
            setFile(selectedFile);
            setResult('');
            setError(null);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        processFile(event.target.files?.[0]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        processFile(e.dataTransfer.files?.[0]);
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
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`w-full p-3 bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50 cursor-pointer transition-colors ${isDragging ? 'border-solid border-zeno-accent bg-zeno-hover' : ''}`}
                    >
                        {file ? `Selected: ${file.name}` : 'Click to Upload or Drag & Drop File'}
                    </div>
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

// --- WEBPAGE ANALYZER ---
const HTMLAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState('Summarize this webpage and list all the links on it.');
    const [file, setFile] = useState<File | null>(null);
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processHtmlFile = async (selectedFile: File | undefined) => {
        if (selectedFile && selectedFile.type === 'text/html') {
            try {
                const textContent = await fileToText(selectedFile);
                setFile(selectedFile);
                setHtmlContent(textContent);
                setResult('');
                setError(null);
            } catch (err) {
                setError('Failed to read HTML file.');
                setHtmlContent('');
                setFile(null);
            }
        } else if (selectedFile) {
            setError('Please upload a valid .html file.');
            setHtmlContent('');
            setFile(null);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await processHtmlFile(event.target.files?.[0]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        await processHtmlFile(e.dataTransfer.files?.[0]);
    };

    const handleAnalyze = async () => {
        if (!file || !htmlContent || !prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const fullPrompt = `Analyze the following HTML content from the file "${file.name}".\n\nHTML CONTENT:\n\`\`\`html\n${htmlContent}\n\`\`\`\n\nTASK: ${prompt}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
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
                {/* Left Panel: Controls and Results */}
                <div className="flex flex-col space-y-4 overflow-hidden">
                    <input type="file" accept=".html,text/html" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`w-full p-3 bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50 cursor-pointer truncate transition-colors ${isDragging ? 'border-solid border-zeno-accent bg-zeno-hover' : ''}`}
                    >
                        {file ? `Selected: ${file.name}` : 'Click to Upload or Drag & Drop HTML File'}
                    </div>
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., 'Summarize this page' or 'Check for accessibility issues'" className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow" disabled={!file} rows={4}/>
                    <Button onClick={handleAnalyze} isLoading={isLoading} disabled={!file || !prompt} className="w-full">Analyze</Button>
                     <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10 mt-2">
                        {error && <p className="text-zeno-danger text-sm">{error}</p>}
                        {isLoading ? <p>Analyzing HTML...</p> : result ? <p className="whitespace-pre-wrap text-white">{result}</p> : <p className="text-zeno-muted/50">Analysis results will appear here.</p>}
                    </div>
                </div>
                {/* Right Panel: HTML Preview */}
                <div className="flex flex-col bg-zeno-bg rounded-lg border border-zeno-accent/10 overflow-hidden">
                    <div className="p-2 bg-zeno-header text-sm text-zeno-muted">Webpage Preview</div>
                    <iframe
                        srcDoc={htmlContent}
                        title="HTML Preview"
                        className="w-full h-full border-0 bg-white"
                        // Removed sandbox attribute
                    />
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ProductivityTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState('fileAnalyzer'); // Default to File Analyzer

    const renderContent = () => {
        switch (activeTab) {
            case 'fileAnalyzer': return <FileAnalyzer />;
            case 'htmlAnalyzer': return <HTMLAnalyzer />;
            default: return <FileAnalyzer />; // Fallback to File Analyzer
        }
    };

    return (
        <Card title="Workflow Tools" description="Enhance your productivity with file analysis and webpage insights.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('fileAnalyzer')} className={`${activeTab === 'fileAnalyzer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><DocumentTextIcon className="w-5 h-5"/>File Analyzer</button>
                        <button onClick={() => setActiveTab('htmlAnalyzer')} className={`${activeTab === 'htmlAnalyzer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><GlobeAltIcon className="w-5 h-5"/>Webpage Analyzer</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </Card>
    );
};

export default ProductivityTools;
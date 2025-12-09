

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import { fileToBase64, fileToText, escapeScriptTags, injectThemeStyles } from '../utils/mediaUtils';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { PaperAirplaneIcon, DocumentTextIcon, GlobeAltIcon, CodeBracketIcon } from '../components/icons'; // Added CodeBracketIcon for LanguageConverter

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
                // Apply escaping immediately after reading the file content
                const escapedHtmlContent = escapeScriptTags(textContent);
                setFile(selectedFile);
                setHtmlContent(escapedHtmlContent);
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

    const themedHtmlContent = useMemo(() => injectThemeStyles(htmlContent), [htmlContent]);

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
                        srcDoc={themedHtmlContent} // Use themed and escaped content
                        title="HTML Preview"
                        className="w-full h-full border-0 bg-white"
                        // Removed sandbox attribute for full rendering, but note that this can be a security risk with untrusted content
                    />
                </div>
            </div>
        </div>
    );
};

// --- LANGUAGE CONVERTER ---
const LanguageConverter: React.FC = () => {
    const [textToConvert, setTextToConvert] = useState('Hello, how are you?');
    const [sourceLanguage, setSourceLanguage] = useState('auto');
    const [targetLanguage, setTargetLanguage] = useState('Spanish');
    const [convertedText, setConvertedText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const languages = [
        { value: 'auto', label: 'Auto-detect' },
        { value: 'English', label: 'English' },
        { value: 'Spanish', label: 'Spanish' },
        { value: 'French', label: 'French' },
        { value: 'German', label: 'German' },
        { value: 'Italian', label: 'Italian' },
        { value: 'Portuguese', label: 'Portuguese' },
        { value: 'Chinese (Simplified)', label: 'Chinese (Simplified)' },
        { value: 'Japanese', label: 'Japanese' },
        { value: 'Korean', label: 'Korean' },
        { value: 'Russian', label: 'Russian' },
        { value: 'Arabic', label: 'Arabic' },
        { value: 'Hindi', label: 'Hindi' },
    ];

    const handleConvert = async () => {
        if (!textToConvert.trim()) return;
        setIsLoading(true);
        setError(null);
        setConvertedText('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `Translate the following text from ${sourceLanguage === 'auto' ? 'auto-detected' : sourceLanguage} to ${targetLanguage}:\n\n"${textToConvert}"`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setConvertedText(response.text);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                {/* Left Panel: Input & Controls */}
                <div className="flex flex-col space-y-4 overflow-hidden">
                    <textarea value={textToConvert} onChange={(e) => setTextToConvert(e.target.value)} placeholder="Enter text to translate..." className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow" rows={6}/>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label htmlFor="source-lang" className="block text-sm font-medium text-zeno-muted mb-1">Source Language</label>
                            <select id="source-lang" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent">
                                {languages.map(lang => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="target-lang" className="block text-sm font-medium text-zeno-muted mb-1">Target Language</label>
                            <select id="target-lang" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent">
                                {languages.filter(lang => lang.value !== 'auto').map(lang => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleConvert} isLoading={isLoading} disabled={!textToConvert.trim()} className="w-full">
                        <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                        Convert Language
                    </Button>
                </div>
                {/* Right Panel: Converted Text */}
                <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10">
                    {error && <p className="text-zeno-danger text-sm">{error}</p>}
                    {isLoading ? <p>Translating...</p> : convertedText ? <p className="whitespace-pre-wrap text-white">{convertedText}</p> : <p className="text-zeno-muted/50">Translated text will appear here.</p>}
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
            case 'languageConverter': return <LanguageConverter />;
            default: return <FileAnalyzer />; // Fallback to File Analyzer
        }
    };

    return (
        <Card title="Workflow Tools" description="Enhance your productivity with file analysis, webpage insights, and language conversion.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('fileAnalyzer')} className={`${activeTab === 'fileAnalyzer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><DocumentTextIcon className="w-5 h-5"/>File Analyzer</button>
                        <button onClick={() => setActiveTab('htmlAnalyzer')} className={`${activeTab === 'htmlAnalyzer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><GlobeAltIcon className="w-5 h-5"/>Webpage Analyzer</button>
                        <button onClick={() => setActiveTab('languageConverter')} className={`${activeTab === 'languageConverter' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}><CodeBracketIcon className="w-5 h-5"/>Language Converter</button>
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

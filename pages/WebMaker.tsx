

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { PaperAirplaneIcon, ArrowDownTrayIcon } from '../components/icons'; // Import ArrowDownTrayIcon
import { CodeBlock } from '../components/CodeBlock'; // Import from shared CodeBlock
import JSZip from 'jszip'; // Import JSZip
import saveAs from 'file-saver'; // Import saveAs from file-saver
import { escapeScriptTags, injectThemeStyles } from '../utils/mediaUtils'; // Import new utilities

interface WebMakerProps {
    onSaveWebpage: (html: string, css: string, javascript: string, prompt: string) => void;
}

const WebMaker: React.FC<WebMakerProps> = ({ onSaveWebpage }) => {
    const [webPrompt, setWebPrompt] = useState('Create a responsive landing page for a modern tech startup with a dark theme. Include a hero section with a call to action, a features section, and a contact form.');
    const [htmlCode, setHtmlCode] = useState('');
    const [cssCode, setCssCode] = useState('');
    const [jsCode, setJsCode] = useState('');
    const [previewSrcDoc, setPreviewSrcDoc] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
    const [copyStatus, setCopyStatus] = useState<'html' | 'css' | 'js' | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => setCopyStatus(null), 2000);
        return () => clearTimeout(timeout);
    }, [copyStatus]);

    // Memoize the preview generation to avoid unnecessary re-renders
    const themedPreviewSrcDoc = useMemo(() => {
        if (!htmlCode && !cssCode && !jsCode) return '';

        const combinedHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Generated Webpage</title>
                <style>${cssCode}</style>
            </head>
            <body>
                ${htmlCode}
                <script>${jsCode}</script>
            </body>
            </html>
        `;
        return injectThemeStyles(combinedHtml); // Inject theme styles
    }, [htmlCode, cssCode, jsCode]);

    useEffect(() => {
        setPreviewSrcDoc(themedPreviewSrcDoc);
    }, [themedPreviewSrcDoc]);

    const handleGenerateWebpage = async () => {
        if (!webPrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setHtmlCode('');
        setCssCode('');
        setJsCode('');
        setPreviewSrcDoc('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: `Generate a complete, responsive, and modern webpage including HTML, CSS, and if necessary, basic JavaScript (e.g., for simple interactivity like a toggle menu or form submission placeholder logic). Ensure all CSS is internal to the <style> tags and all JavaScript is internal to the <script> tags at the end of the body. Respond in JSON format with 'html', 'css', and 'javascript' keys.
                
                Webpage description: "${webPrompt}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            html: { type: Type.STRING, description: 'The full HTML content for the webpage body.' },
                            css: { type: Type.STRING, description: 'The full CSS styles for the webpage, to be placed in a <style> tag.' },
                            javascript: { type: Type.STRING, description: 'Optional JavaScript for the webpage, to be placed in a <script> tag.' },
                        },
                        required: ['html', 'css'],
                    },
                    thinkingConfig: { thinkingBudget: 24576 } // Give Flash more budget for complex code
                },
            });

            const jsonResponse = JSON.parse(response.text.trim());
            const generatedHtml = escapeScriptTags(jsonResponse.html || '');
            const generatedCss = escapeScriptTags(jsonResponse.css || '');
            const generatedJs = escapeScriptTags(jsonResponse.javascript || ''); // Escape JS immediately

            setHtmlCode(generatedHtml);
            setCssCode(generatedCss);
            setJsCode(generatedJs);
            onSaveWebpage(generatedHtml, generatedCss, generatedJs, webPrompt); // Save to Savor Studio

        } catch (e) {
            console.error('Webpage generation error:', e);
            setError(e instanceof Error ? `Failed to generate webpage: ${e.message}. Please try again.` : 'An unknown error occurred during webpage generation.');
            setHtmlCode('');
            setCssCode('');
            setJsCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadZip = async () => {
        if (!htmlCode && !cssCode && !jsCode) {
            setError("No webpage content to download.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const zip = new JSZip();
            // Construct index.html for download with injected theme styles
            const downloadHtml = injectThemeStyles(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Generated Webpage</title>
                    <style>${cssCode}</style>
                </head>
                <body>
                    ${htmlCode}
                    <script>${jsCode}</script>
                </body>
                </html>
            `);
            zip.file("index.html", downloadHtml);
            // Optional: If you want separate files in the zip:
            // if (cssCode) zip.file("style.css", cssCode);
            // if (jsCode) zip.file("script.js", jsCode);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "webpage_project.zip");
        } catch (e) {
            setError(e instanceof Error ? `Failed to create ZIP: ${e.message}` : 'An unknown error occurred while creating the ZIP file.');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Card title="Web Maker" description="Generate complete HTML, CSS, and JavaScript for webpages from a simple prompt. Download as a ZIP to run locally.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        <textarea
                            value={webPrompt}
                            onChange={(e) => setWebPrompt(e.target.value)}
                            placeholder="Describe the webpage you want to create (e.g., 'A responsive landing page for a coffee shop, with a hero image, menu section, and contact form.')."
                            className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                            rows={8}
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerateWebpage} isLoading={isLoading} disabled={!webPrompt.trim()} className="w-full">
                            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                            Generate Webpage
                        </Button>
                        {error && <p className="text-zeno-danger text-sm mt-2 text-center">{error}</p>}
                    </div>

                    {/* Right Panel: Output and Preview */}
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        <div className="border-b border-zeno-header">
                            <nav className="-mb-px flex space-x-4">
                                <button
                                    onClick={() => setActiveTab('html')}
                                    className={`${activeTab === 'html' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >HTML</button>
                                <button
                                    onClick={() => setActiveTab('css')}
                                    className={`${activeTab === 'css' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >CSS</button>
                                <button
                                    onClick={() => setActiveTab('js')}
                                    className={`${activeTab === 'js' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                                >JavaScript</button>
                            </nav>
                        </div>
                        <div className="flex-1 relative bg-zeno-bg rounded-lg p-0 overflow-hidden border border-zeno-accent/10">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-zeno-muted">Generating code...</div>
                            ) : (
                                <>
                                    {activeTab === 'html' && <CodeBlock code={htmlCode} language="html" filename="index.html" onCopy={() => setCopyStatus('html')} />}
                                    {activeTab === 'css' && <CodeBlock code={cssCode} language="css" filename="style.css" onCopy={() => setCopyStatus('css')} />}
                                    {activeTab === 'js' && <CodeBlock code={jsCode} language="javascript" filename="script.js" onCopy={() => setCopyStatus('js')} />}
                                    {copyStatus && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zeno-accent text-zeno-bg px-3 py-1.5 rounded-md shadow-lg text-sm transition-opacity opacity-100">
                                            {copyStatus.toUpperCase()} copied!
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex-1 bg-zeno-bg rounded-lg p-0 overflow-hidden border border-zeno-accent/10 mt-4">
                            <div className="p-2 bg-zeno-header text-sm text-zeno-muted border-b border-zeno-accent/10">Live Preview</div>
                            <iframe
                                srcDoc={previewSrcDoc} // Use themed and escaped content
                                title="Webpage Preview"
                                className="w-full h-full border-0 bg-white"
                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms" // Added sandbox for security
                            />
                        </div>
                        {(htmlCode || cssCode || jsCode) && (
                            <Button
                                onClick={handleDownloadZip}
                                isLoading={isLoading}
                                variant="secondary"
                                className="w-full mt-4"
                                disabled={!htmlCode && !cssCode && !jsCode}
                            >
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                Download Project (ZIP)
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default WebMaker;

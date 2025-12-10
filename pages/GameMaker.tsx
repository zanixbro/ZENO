import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PaperAirplaneIcon, ArrowDownTrayIcon } from '../components/icons';
import { CodeBlock } from '../components/CodeBlock';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { escapeScriptTags, injectThemeStyles } from '../utils/mediaUtils';

interface GameMakerProps {
    onSaveCode: (code: string, language: string, prompt: string) => void;
}

const GameMaker: React.FC<GameMakerProps> = ({ onSaveCode }) => {
    const [gamePrompt, setGamePrompt] = useState('Create a simple THREE.js scene with a spinning cube in the center. Allow camera control with mouse.');
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
                <title>Generated Game</title>
                <style>
                    body { margin: 0; overflow: hidden; }
                    canvas { display: block; }
                    ${cssCode}
                </style>
            </head>
            <body>
                ${htmlCode}
                <script type="importmap">
                    {
                        "imports": {
                            "three": "https://aistudiocdn.com/three@0.165.0/build/three.module.js",
                            "three/examples/jsm/controls/OrbitControls": "https://aistudiocdn.com/three@0.165.0/examples/jsm/controls/OrbitControls.js"
                        }
                    }
                </script>
                <script type="module">
                    ${jsCode}
                </script>
            </body>
            </html>
        `;
        return injectThemeStyles(combinedHtml);
    }, [htmlCode, cssCode, jsCode]);

    useEffect(() => {
        setPreviewSrcDoc(themedPreviewSrcDoc);
    }, [themedPreviewSrcDoc]);

    const handleGenerateGame = async () => {
        if (!gamePrompt.trim()) return;

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
                contents: `Generate a complete, self-contained THREE.js game/scene. Provide HTML structure (basic canvas or div for rendering), minimal CSS (just for full viewport), and all necessary JavaScript (including THREE.js setup, scene, camera, renderer, lighting, objects, animation loop, and basic interactivity like orbit controls or simple keyboard input if requested implicitly by game type). Ensure THREE.js and OrbitControls are imported as ES modules from 'https://aistudiocdn.com/three@0.165.0/build/three.module.js' and 'https://aistudiocdn.com/three@0.165.0/examples/jsm/controls/OrbitControls.js' respectively. The JavaScript should be a runnable ES module. Respond in JSON format with 'html', 'css', and 'javascript' keys.
                
                Game/Scene description: "${gamePrompt}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            html: { type: Type.STRING, description: 'The minimal HTML structure including a canvas/container.' },
                            css: { type: Type.STRING, description: 'The CSS styles for the game, including body/html reset.' },
                            javascript: { type: Type.STRING, description: 'The complete JavaScript code for the THREE.js game/scene.' },
                        },
                        required: ['html', 'css', 'javascript'],
                    },
                    thinkingConfig: { thinkingBudget: 32768 }
                },
            });

            const jsonResponse = JSON.parse(response.text.trim());
            const generatedHtml = escapeScriptTags(jsonResponse.html || '');
            const generatedCss = escapeScriptTags(jsonResponse.css || '');
            const generatedJs = escapeScriptTags(jsonResponse.javascript || '');

            setHtmlCode(generatedHtml);
            setCssCode(generatedCss);
            setJsCode(generatedJs);
            onSaveCode(generatedHtml, 'html', `Game (HTML): ${gamePrompt}`);
            onSaveCode(generatedCss, 'css', `Game (CSS): ${gamePrompt}`);
            onSaveCode(generatedJs, 'javascript', `Game (JS): ${gamePrompt}`);

        } catch (e) {
            console.error('Game generation error:', e);
            setError(e instanceof Error ? `Failed to generate game: ${e.message}. Please try again.` : 'An unknown error occurred during game generation.');
            setHtmlCode('');
            setCssCode('');
            setJsCode('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadZip = async () => {
        if (!htmlCode && !cssCode && !jsCode) {
            setError("No game content to download.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const zip = new JSZip();
            const downloadHtml = injectThemeStyles(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Game</title>
    <style>
        body { margin: 0; overflow: hidden; }
        canvas { display: block; }
        ${cssCode}
    </style>
</head>
<body>
    ${htmlCode}
    <script type="importmap">
        {
            "imports": {
                "three": "https://aistudiocdn.com/three@0.165.0/build/three.module.js",
                "three/examples/jsm/controls/OrbitControls": "https://aistudiocdn.com/three@0.165.0/examples/jsm/controls/OrbitControls.js"
            }
        }
    </script>
    <script type="module">
        ${jsCode}
    </script>
</body>
</html>`);
            zip.file("index.html", downloadHtml);

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, "game_project.zip");
        } catch (e) {
            setError(e instanceof Error ? `Failed to create ZIP: ${e.message}` : 'An unknown error occurred while creating the ZIP file.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Game Maker" description="Generate a basic THREE.js game structure and code from a prompt. Download as a ZIP to run locally. (Note: Direct APK generation is not supported by this web application.)">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        <textarea
                            value={gamePrompt}
                            onChange={(e) => setGamePrompt(e.target.value)}
                            placeholder="Describe the THREE.js game/scene you want to create (e.g., 'A simple car driving on a track, with basic controls', 'A solar system visualization with spinning planets')."
                            className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                            rows={8}
                            disabled={isLoading}
                        />
                        <Button onClick={handleGenerateGame} isLoading={isLoading} disabled={!gamePrompt.trim()} className="w-full">
                            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                            Generate Game Code
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
                                <div className="absolute inset-0 flex items-center justify-center text-zeno-muted">Generating game code...</div>
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
                                srcDoc={previewSrcDoc}
                                title="Game Preview"
                                className="w-full h-full border-0 bg-white"
                                sandbox="allow-scripts allow-same-origin allow-pointer-lock"
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

export default GameMaker;
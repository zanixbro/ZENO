import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64, encode, decode, decodeAudioData } from '../utils/mediaUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
// Fix: PhotoIcon is in components/icons, not constants. Removed unused PERSONALITIES import.
import { IMAGE_STYLES } from '../constants';
import { SpeakerWaveIcon, MicrophoneIcon, StopCircleIcon, PhotoIcon } from '../components/icons';

// --- IMAGE GENERATOR ---
const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving at top speed');
    const [style, setStyle] = useState<string>(IMAGE_STYLES[0]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        const fullPrompt = style === 'Default' ? prompt : `${prompt}, ${style.toLowerCase()} style`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setImageUrl(`data:image/jpeg;base64,${base64ImageBytes}`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full gap-6">
            <div className="md:w-1/3 flex flex-col space-y-4">
                <label className="font-medium text-zeno-muted">Prompt</label>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent resize-none flex-grow" rows={5} />
                <label htmlFor="style" className="font-medium text-zeno-muted">Style</label>
                <select id="style" value={style} onChange={(e) => setStyle(e.target.value)} className="bg-zeno-header p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent">
                    {IMAGE_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button onClick={handleGenerate} isLoading={isLoading} className="w-full mt-auto">Generate Image</Button>
            </div>
            <div className="flex-1 mt-6 md:mt-0 flex items-center justify-center bg-zeno-bg rounded-lg overflow-hidden border border-zeno-accent/10">
                {error && <p className="text-zeno-danger text-center p-4">{error}</p>}
                {isLoading && <p className="text-zeno-muted">Generating...</p>}
                {imageUrl && !isLoading && <img src={imageUrl} alt={prompt} className="max-h-full max-w-full object-contain" />}
                {!imageUrl && !isLoading && !error && <div className="text-center text-zeno-muted/50"><PhotoIcon className="w-16 h-16 mx-auto" /><p>Your generated image will appear here.</p></div>}
            </div>
        </div>
    );
};

// --- IMAGE EDITOR ---
const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a retro filter');
    const [originalImage, setOriginalImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setOriginalImage({ url: URL.createObjectURL(file), base64, mimeType: file.type });
                setEditedImageUrl(null);
                setError(null);
            } catch (err) { setError('Failed to read image file.'); }
        }
    };

    const handleEdit = async () => {
        if (!prompt.trim() || !originalImage) return;
        setIsLoading(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ inlineData: { data: originalImage.base64, mimeType: originalImage.mimeType } }, { text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                setEditedImageUrl(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            } else { setError("No edited image was returned."); }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow overflow-hidden">
                <div className="flex flex-col space-y-4">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-3 h-full bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50 flex items-center justify-center">
                        {originalImage ? <img src={originalImage.url} alt="Original" className="max-h-full max-w-full object-contain rounded" /> : 'Click to Upload Image'}
                    </button>
                </div>
                <div className="flex flex-col space-y-4">
                    <div className="flex-grow bg-zeno-header rounded-lg flex items-center justify-center">
                        {isLoading && <p>Editing...</p>}
                        {editedImageUrl && !isLoading && <img src={editedImageUrl} alt="Edited" className="max-h-full max-w-full object-contain rounded" />}
                        {!editedImageUrl && !isLoading && <span className="text-zeno-muted/50">Edited image appears here.</span>}
                    </div>
                </div>
            </div>
             {error && <p className="text-zeno-danger text-sm text-center py-2">{error}</p>}
            <div className="flex items-center space-x-2 pt-4">
                <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., Make the sky look like a sunset" className="flex-1 p-3 bg-zeno-header rounded-lg" disabled={!originalImage} />
                <Button onClick={handleEdit} isLoading={isLoading} disabled={!originalImage || !prompt}>Apply Edit</Button>
            </div>
        </div>
    );
};

// --- PODCAST & SPEECH ---
const AudioTools: React.FC = () => {
    const [mode, setMode] = useState<'tts' | 'podcast'>('tts');
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateAudio = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let speechConfig: any;
            let modelPrompt = text;

            if (mode === 'podcast') {
                const scriptPrompt = `Generate a short podcast script (2-3 exchanges) between two hosts, "Alex" and "Ben", discussing the topic: "${text}". Format it clearly with speaker labels, like "Alex: ..." and "Ben: ...".`;
                const scriptResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: scriptPrompt });
                modelPrompt = scriptResponse.text;
                setText(modelPrompt); // Show the generated script
                speechConfig = {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            { speaker: 'Alex', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                            { speaker: 'Ben', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
                        ]
                    }
                };
            } else {
                speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } };
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-preview-tts',
                contents: [{ parts: [{ text: modelPrompt }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig },
            });
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioContext.destination);
                source.start();
            } else { setError('No audio data received.'); }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                 <div className="inline-flex rounded-md shadow-sm bg-zeno-header">
                    <button onClick={() => setMode('tts')} className={`px-4 py-2 text-sm font-medium ${mode === 'tts' ? 'bg-zeno-accent text-zeno-bg' : 'text-zeno-muted'} rounded-l-lg`}>Text-to-Speech</button>
                    <button onClick={() => setMode('podcast')} className={`px-4 py-2 text-sm font-medium ${mode === 'podcast' ? 'bg-zeno-accent text-zeno-bg' : 'text-zeno-muted'} rounded-r-lg`}>Podcast Generator</button>
                </div>
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder={mode === 'tts' ? "Enter text..." : "Enter a podcast topic..."} className="w-full flex-grow p-3 bg-zeno-header rounded-lg resize-none mb-4" />
            <Button onClick={handleGenerateAudio} isLoading={isLoading} disabled={!text.trim()} className="w-full">
                <SpeakerWaveIcon className="w-5 h-5 mr-2"/>
                Generate Audio
            </Button>
            {error && <p className="text-zeno-danger text-sm mt-2">{error}</p>}
        </div>
    )
}

// --- MAIN COMPONENT ---
const CreativeTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState('imageGen');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'imageGen': return <ImageGenerator />;
            case 'imageEdit': return <ImageEditor />;
            case 'audioGen': return <AudioTools />;
            default: return null;
        }
    };

    return (
        <Card title="Media Studio" description="Your hub for AI-powered creativity. Generate and edit images, or create audio content.">
            <div className="flex flex-col h-full">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('imageGen')} className={`${activeTab === 'imageGen' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Image Generation</button>
                        <button onClick={() => setActiveTab('imageEdit')} className={`${activeTab === 'imageEdit' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Image Editor</button>
                        <button onClick={() => setActiveTab('audioGen')} className={`${activeTab === 'audioGen' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Podcast & Speech</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {renderTabContent()}
                </div>
            </div>
        </Card>
    );
};

export default CreativeTools;
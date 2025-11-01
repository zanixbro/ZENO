import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Button from './common/Button';
import { encode, decode, decodeAudioData } from '../utils/mediaUtils';
import { SpeakerWaveIcon } from './icons';

interface AudioToolsProps {
    onSaveAudio: (url: string, text: string) => void;
}

const AudioTools: React.FC<AudioToolsProps> = ({ onSaveAudio }) => {
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
            let savedText = text; // Text to save to gallery, original prompt or generated script

            if (mode === 'podcast') {
                const scriptPrompt = `Generate a short podcast script (2-3 exchanges) between two hosts, "Alex" and "Ben", discussing the topic: "${text}". Format it clearly with speaker labels, like "Alex: ..." and "Ben: ...".`;
                const scriptResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: scriptPrompt });
                modelPrompt = scriptResponse.text;
                savedText = modelPrompt; // Save the generated script
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

                // Convert base64 audio to blob URL for saving
                const audioBlob = new Blob([decode(base64Audio)], { type: 'audio/pcm' }); // Raw PCM, typically requires a player that can handle it or convert to WAV
                const audioBlobUrl = URL.createObjectURL(audioBlob);
                onSaveAudio(audioBlobUrl, savedText);

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

export default AudioTools;
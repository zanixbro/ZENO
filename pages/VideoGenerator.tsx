import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { FilmIcon } from '../components/icons';

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Assembling pixels into cinematic brilliance...",
    "Teaching virtual actors their lines...",
    "This might take a few minutes. Great art needs patience!",
];

interface VideoGeneratorProps {
    onSaveVideo: (url: string, prompt: string) => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onSaveVideo }) => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [prompt, setPrompt] = useState('A futuristic city with flying cars at sunset, cinematic 4k');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Fix: Declare loadingMessage as a state variable
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                setIsKeySelected(await window.aistudio.hasSelectedApiKey());
            }
        };
        checkKey();
    }, []);

    useEffect(() => {
      if (isLoading) {
        intervalRef.current = window.setInterval(() => {
          setLoadingMessage(prev => loadingMessages[(loadingMessages.indexOf(prev) + 1) % loadingMessages.length]);
        }, 4000);
      } else if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [isLoading]);

    const handleSelectKey = async () => {
        try {
            await window.aistudio.openSelectKey();
            setIsKeySelected(true);
        } catch (e) {
            setError("Could not open API key selection dialog.");
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        // Fix: Call setLoadingMessage to update the loading message state
        setLoadingMessage(loadingMessages[0]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                 if (!videoResponse.ok) throw new Error(`Failed to fetch video: ${videoResponse.statusText}`);
                 const videoBlob = await videoResponse.blob();
                 const objectUrl = URL.createObjectURL(videoBlob);
                 setVideoUrl(objectUrl);
                 onSaveVideo(objectUrl, prompt); // Save to Savor Studio
            } else {
                throw new Error("Video generation completed but no download link was found.");
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found")) {
                setError("API Key error. Please re-select your API key.");
                setIsKeySelected(false);
            } else {
                 setError(`Video generation failed: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!isKeySelected) {
        return (
            <Card title="Video Generator" description="Create stunning videos from text prompts using the Veo model.">
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="mb-4 text-lg">Veo requires an API key from your project.</p>
                    {error && <p className="text-zeno-danger text-sm mb-4">{error}</p>}
                    <Button onClick={handleSelectKey}>Select API Key</Button>
                    <p className="mt-4 text-sm text-zeno-muted">
                        For more on billing, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-zeno-accent hover:underline">documentation</a>.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Video Generator" description="Create stunning videos from text prompts using the Veo model.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="space-y-4 mb-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A futuristic city with flying cars at sunset" className="w-full p-3 bg-zeno-header rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-zeno-accent" rows={4}/>
                </div>
                <Button onClick={handleGenerate} isLoading={isLoading} className="w-full">Generate Video</Button>
                {error && <p className="text-zeno-danger text-sm mt-4 text-center">{error}</p>}
                <div className="flex-1 mt-6 flex flex-col items-center justify-center bg-zeno-bg rounded-lg overflow-hidden border border-zeno-accent/10 p-4">
                    {isLoading ? (
                        <div className="text-center text-zeno-muted p-4">
                            <p className="text-lg font-semibold mb-2 text-zeno-accent">Generating Video...</p>
                            {/* Fix: Use the state variable loadingMessage */}
                            <p>{loadingMessage}</p>
                        </div>
                    ) : videoUrl ? (
                        <>
                            <video src={videoUrl} controls autoPlay loop className="max-h-full max-w-full mb-4" />
                            <Button
                                as="a"
                                href={videoUrl}
                                download="generated_video.mp4"
                                variant="secondary"
                                className="mt-2"
                            >
                                Download Video
                            </Button>
                        </>
                    ) : (
                        <div className="text-center text-zeno-muted/50">
                            <FilmIcon className="w-16 h-16 mx-auto" /><p>Your generated video will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default VideoGenerator;
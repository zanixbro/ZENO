import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Part } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { fileToBase64, extractVideoFrames } from '../utils/mediaUtils';
import { FilmIcon, DocumentTextIcon, SparklesIcon } from '../components/icons';

const ANALYZE_FRAME_COUNT = 5; // Number of frames to extract for analysis
const JPEG_QUALITY = 0.7; // Quality for JPEG frames

const loadingMessages = [
    "Warming up the digital director's chair...",
    "Assembling pixels into cinematic brilliance...",
    "Teaching virtual actors their lines...",
    "This might take a few minutes. Great art needs patience!",
];

interface VideoEditorProps {
    onSaveVideo: (url: string, prompt: string) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ onSaveVideo }) => {
    const [isKeySelected, setIsKeySelected] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Analyze this video and describe its main subjects and actions.');
    const [result, setResult] = useState<string | null>(null); // Can be analysis text or new video URL
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<number | null>(null);
    // Fix: Initialize loadingMessage as a state variable
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [currentAction, setCurrentAction] = useState<'analyze' | 'generate' | null>(null);

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

    const processVideoFile = (file: File | undefined) => {
        if (file && file.type.startsWith('video/')) {
            setVideoFile(file);
            setVideoUrl(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        } else if (file) {
            setError('Please upload a valid video file (e.g., .mp4, .mov).');
            setVideoFile(null);
            setVideoUrl(null);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await processVideoFile(event.target.files?.[0]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        await processVideoFile(e.dataTransfer.files?.[0]);
    };

    const handleAnalyzeVideo = async () => {
        if (!videoFile || !prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);
        setCurrentAction('analyze');
        setLoadingMessage(loadingMessages[0]); // Reset loading message for new action

        try {
            const base64Frames = await extractVideoFrames(videoFile, ANALYZE_FRAME_COUNT, 'image/jpeg');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            // Fix: Explicitly type `parts` as `Part[]` to allow both inlineData and text parts.
            const parts: Part[] = base64Frames.map(data => ({ inlineData: { data, mimeType: 'image/jpeg' } }));
            parts.push({ text: prompt });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: parts }
            });
            setResult(response.text);

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Video analysis failed: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
        }
    };

    const handleGenerateVideoFromFrame = async () => {
        if (!videoFile || !prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null); // Clear previous results
        setCurrentAction('generate');
        setLoadingMessage(loadingMessages[0]); // Reset loading message for new generation

        try {
            const base64Frames = await extractVideoFrames(videoFile, 1, 'image/jpeg'); // Get first frame
            const firstFrameBase64 = base64Frames[0];

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: prompt,
                image: {
                    imageBytes: firstFrameBase64,
                    mimeType: 'image/jpeg',
                },
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
                 setResult(objectUrl); // Store URL for video playback
                 onSaveVideo(objectUrl, prompt); // Save to Savor Studio
            } else {
                throw new Error("Video generation completed but no download link was found.");
            }

        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found.")) {
                setError("API Key error. Please re-select your API key.");
                setIsKeySelected(false);
            } else {
                 setError(`Video generation failed: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
            setCurrentAction(null);
        }
    };

    if (!isKeySelected) {
        return (
            <Card title="Video Editor" description="Analyze existing videos or generate new ones from an uploaded frame and prompt.">
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="mb-4 text-lg">Veo models require an API key from your project.</p>
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
        <Card title="Video Editor" description="Analyze existing videos or generate new ones from an uploaded frame and prompt.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <p className="text-zeno-muted mb-4">Note: Direct in-place editing of arbitrary video files is not currently supported by the API. You can analyze video content or generate new videos inspired by your uploaded footage.</p>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                    {/* Left Panel: Controls */}
                    <div className="flex flex-col space-y-4 overflow-hidden">
                        <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className={`w-full p-3 h-48 bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50 flex items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-solid border-zeno-accent bg-zeno-hover' : ''}`}
                        >
                            {videoFile ? (
                                <span className="truncate max-w-full block px-4">{videoFile.name}</span>
                            ) : (
                                'Click or Drag & Drop Video File'
                            )}
                        </div>

                        {videoUrl && (
                            <div className="rounded-lg overflow-hidden border border-zeno-accent/10">
                                <video src={videoUrl} controls className="w-full h-auto max-h-48 object-contain" />
                            </div>
                        )}

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Summarize the events in the video' or 'Generate a new video about a cat in space, inspired by this video.'"
                            className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow"
                            rows={4}
                            disabled={!videoFile}
                        />

                        <div className="flex flex-col space-y-2">
                            <Button onClick={handleAnalyzeVideo} isLoading={isLoading && currentAction === 'analyze'} disabled={!videoFile || !prompt || isLoading}>
                                <DocumentTextIcon className="w-5 h-5 mr-2" />
                                Analyze Video
                            </Button>
                            <Button onClick={handleGenerateVideoFromFrame} isLoading={isLoading && currentAction === 'generate'} disabled={!videoFile || !prompt || isLoading}>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Generate New Video (from Start Frame)
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel: Results */}
                    <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10 flex flex-col items-center justify-center">
                        {error && <p className="text-zeno-danger text-sm mb-4">{error}</p>}
                        {isLoading ? (
                            <div className="text-center text-zeno-muted p-4">
                                <p className="text-lg font-semibold mb-2 text-zeno-accent">
                                    {currentAction === 'analyze' ? 'Analyzing Video...' : 'Generating Video...'}
                                </p>
                                {/* Fix: Use the state variable loadingMessage */}
                                <p>{loadingMessage}</p>
                            </div>
                        ) : result ? (
                            (currentAction === 'analyze' || !result.startsWith('blob:')) ? (
                                <p className="whitespace-pre-wrap text-white">{result}</p>
                            ) : ( // This is a generated video URL
                                <>
                                    <video src={result} controls autoPlay loop className="max-h-full max-w-full mb-4" />
                                    <Button
                                        as="a"
                                        href={result}
                                        download="generated_video.mp4"
                                        variant="secondary"
                                        className="mt-2"
                                    >
                                        Download Generated Video
                                    </Button>
                                </>
                            )
                        ) : (
                            <div className="text-center text-zeno-muted/50">
                                <FilmIcon className="w-16 h-16 mx-auto" /><p>Analysis or generated video will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default VideoEditor;
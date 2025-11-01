import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { CameraIcon, PaperAirplaneIcon, StopCircleIcon } from '../components/icons';

const CameraVision: React.FC = () => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('Describe in detail what you see in this image.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Start camera stream
    const startCamera = useCallback(async () => {
        try {
            setError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Failed to access camera. Please ensure camera permissions are granted and no other application is using it.');
            setStream(null);
        }
    }, []);

    // Stop camera stream
    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
        setAnalysisResult(null);
        setError(null);
        setIsLoading(false);
    }, [stream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    // Capture image and send for analysis
    const captureAndAnalyze = async () => {
        if (!stream || !videoRef.current || !canvasRef.current) {
            setError('Camera is not active.');
            return;
        }
        if (!prompt.trim()) {
            setError('Please provide a prompt for analysis.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context.');
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8); // Capture as JPEG for efficiency
            const base64Image = imageDataUrl.split(',')[1]; // Remove "data:image/jpeg;base64," prefix

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: 'image/jpeg',
                        },
                    },
                    { text: prompt },
                ],
            });
            setAnalysisResult(response.text);
        } catch (e) {
            console.error('Analysis error:', e);
            setError(e instanceof Error ? `Analysis failed: ${e.message}` : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Camera Vision" description="Analyze live camera feed to describe scenes and objects.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Camera Feed & Controls */}
                    <div className="md:w-1/2 flex flex-col space-y-4">
                        <div className="relative w-full h-80 bg-zeno-header rounded-lg flex items-center justify-center overflow-hidden border border-zeno-accent/10">
                            {stream ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                            ) : (
                                <div className="text-center text-zeno-muted/50">
                                    <CameraIcon className="w-16 h-16 mx-auto" />
                                    <p>Camera feed will appear here.</p>
                                </div>
                            )}
                            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        </div>

                        <div className="flex space-x-2">
                            <Button onClick={startCamera} disabled={!!stream || isLoading} className="flex-1">
                                <CameraIcon className="w-5 h-5 mr-2" />
                                Start Camera
                            </Button>
                            <Button onClick={stopCamera} disabled={!stream || isLoading} variant="secondary" className="flex-1">
                                <StopCircleIcon className="w-5 h-5 mr-2" />
                                Stop Camera
                            </Button>
                        </div>

                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., 'Describe the objects in the image' or 'What is happening in the scene?'"
                            className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                            rows={4}
                            disabled={!stream || isLoading}
                        />
                        <Button onClick={captureAndAnalyze} isLoading={isLoading} disabled={!stream || !prompt.trim()} className="w-full">
                            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                            Capture & Analyze
                        </Button>
                    </div>

                    {/* Analysis Result */}
                    <div className="md:w-1/2 flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10">
                        {error && <p className="text-zeno-danger text-sm mb-4">{error}</p>}
                        {isLoading ? (
                            <p className="text-zeno-muted text-center p-4">Analyzing image...</p>
                        ) : analysisResult ? (
                            <p className="whitespace-pre-wrap text-white">{analysisResult}</p>
                        ) : (
                            <p className="text-zeno-muted/50 text-center p-4">Detailed analysis will appear here after capture.</p>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CameraVision;
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/mediaUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IMAGE_STYLES } from '../constants';
import { PhotoIcon } from '../components/icons';

const ImageGenerator: React.FC<{ onSaveImage: (url: string, prompt: string) => void }> = ({ onSaveImage }) => {
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
            const generatedUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            setImageUrl(generatedUrl);
            onSaveImage(generatedUrl, fullPrompt); // Save to Savor Studio
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
            <div className="flex-1 mt-6 md:mt-0 flex flex-col items-center justify-center bg-zeno-bg rounded-lg overflow-hidden border border-zeno-accent/10 p-4">
                {error && <p className="text-zeno-danger text-center p-4">{error}</p>}
                {isLoading && <p className="text-zeno-muted">Generating...</p>}
                {imageUrl && !isLoading && (
                    <>
                        <img src={imageUrl} alt={prompt} className="max-h-full max-w-full object-contain mb-4" />
                        <Button
                            as="a"
                            href={imageUrl}
                            download="generated_image.jpeg"
                            variant="secondary"
                            className="mt-2"
                        >
                            Download Image
                        </Button>
                    </>
                )}
                {!imageUrl && !isLoading && !error && <div className="text-center text-zeno-muted/50"><PhotoIcon className="w-16 h-16 mx-auto" /><p>Your generated image will appear here.</p></div>}
            </div>
        </div>
    );
};

export default ImageGenerator;
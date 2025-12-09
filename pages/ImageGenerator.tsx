

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/mediaUtils';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { IMAGE_STYLES } from '../constants';
import { PhotoIcon } from '../components/icons';

interface ImageGeneratorProps {
    onSaveImage: (url: string, prompt: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onSaveImage }) => {
    const [prompt, setPrompt] = useState('A neon hologram of a cat driving at top speed');
    const [style, setStyle] = useState<string>(IMAGE_STYLES[0]);
    const [numImages, setNumImages] = useState<number>(1); // New state for number of images
    const [generatedImages, setGeneratedImages] = useState<Array<{ url: string, prompt: string }> | null>(null); // State for multiple images
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImages(null); // Clear previous images

        const fullPrompt = style === 'Default' ? prompt : `${prompt}, ${style.toLowerCase()} style`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: fullPrompt,
                config: { numberOfImages: numImages, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
            });
            
            const newGeneratedImages = response.generatedImages.map(img => {
                const generatedUrl = `data:image/jpeg;base64,${img.image.imageBytes}`;
                onSaveImage(generatedUrl, fullPrompt); // Save each image to Savor Studio
                return { url: generatedUrl, prompt: fullPrompt };
            });
            setGeneratedImages(newGeneratedImages);

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

                <label htmlFor="num-images" className="font-medium text-zeno-muted">Number of Images (1-50)</label>
                <input
                    type="number"
                    id="num-images"
                    value={numImages}
                    onChange={(e) => setNumImages(Math.max(1, Math.min(50, Number(e.target.value))))}
                    min="1"
                    max="50"
                    className="w-full p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                />

                <Button onClick={handleGenerate} isLoading={isLoading} className="w-full mt-auto">Generate Image(s)</Button>
            </div>
            <div className="flex-1 mt-6 md:mt-0 flex flex-col items-center justify-center bg-zeno-bg rounded-lg overflow-hidden border border-zeno-accent/10 p-4">
                {error && <p className="text-zeno-danger text-center p-4">{error}</p>}
                {isLoading && <p className="text-zeno-muted">Generating...</p>}
                {generatedImages && !isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full h-full overflow-y-auto">
                        {generatedImages.map((img, index) => (
                            <div key={index} className="flex flex-col items-center p-2 bg-zeno-header rounded-lg border border-zeno-accent/10">
                                <img src={img.url} alt={`${img.prompt} ${index + 1}`} className="w-full h-40 object-cover rounded mb-2" />
                                <Button
                                    as="a"
                                    href={img.url}
                                    download={`generated_image_${index + 1}.jpeg`}
                                    variant="secondary"
                                    className="w-full text-xs"
                                >
                                    Download
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
                {!generatedImages && !isLoading && !error && <div className="text-center text-zeno-muted/50"><PhotoIcon className="w-16 h-16 mx-auto" /><p>Your generated image(s) will appear here.</p></div>}
            </div>
        </div>
    );
};

export default ImageGenerator;

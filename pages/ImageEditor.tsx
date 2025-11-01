import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/mediaUtils';
import Button from '../components/common/Button';

const ImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('Add a retro filter');
    const [originalImage, setOriginalImage] = useState<{ url: string, base64: string, mimeType: string } | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processImageFile = async (file: File | undefined) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await fileToBase64(file);
                setOriginalImage({ url: URL.createObjectURL(file), base64, mimeType: file.type });
                setEditedImageUrl(null);
                setError(null);
            } catch (err) { setError('Failed to read image file.'); }
        } else if (file) {
            setError('Please upload a valid image file.');
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        await processImageFile(event.target.files?.[0]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        await processImageFile(e.dataTransfer.files?.[0]);
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
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`w-full p-3 h-full bg-zeno-header rounded-lg text-zeno-muted hover:bg-zeno-hover text-center border border-dashed border-zeno-muted/50 flex items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-solid border-zeno-accent bg-zeno-hover' : ''}`}
                    >
                        {originalImage ? <img src={originalImage.url} alt="Original" className="max-h-full max-w-full object-contain rounded" /> : 'Click or Drag & Drop to Upload Image'}
                    </div>
                </div>
                <div className="flex flex-col space-y-4 items-center justify-center bg-zeno-header rounded-lg">
                    {isLoading && <p>Editing...</p>}
                    {editedImageUrl && !isLoading && (
                        <>
                            <img src={editedImageUrl} alt="Edited" className="max-h-full max-w-full object-contain rounded mb-4" />
                            <Button
                                as="a"
                                href={editedImageUrl}
                                download="edited_image.jpeg"
                                variant="secondary"
                                className="mt-2"
                            >
                                Download Edited Image
                            </Button>
                        </>
                    )}
                    {!editedImageUrl && !isLoading && <span className="text-zeno-muted/50">Edited image appears here.</span>}
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

export default ImageEditor;
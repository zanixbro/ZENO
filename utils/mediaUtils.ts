
// Base64 encoding/decoding for audio
export function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

// File to Base64 conversion (for images)
export const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // remove the "data:mime/type;base64," prefix
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });

// File to Text conversion
export const fileToText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

// Extract frames from a video file for analysis
export const extractVideoFrames = (videoFile: File, numFrames: number, outputFormat: 'image/jpeg' | 'image/png' = 'image/jpeg'): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const fileUrl = URL.createObjectURL(videoFile);
        video.src = fileUrl;
        video.muted = true;

        video.onloadedmetadata = () => {
            const duration = video.duration;
            if (duration === 0) {
                URL.revokeObjectURL(fileUrl);
                reject(new Error("Cannot determine video duration."));
                return;
            }
            const interval = duration / (numFrames + 1);
            const frames: string[] = [];
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                URL.revokeObjectURL(fileUrl);
                reject(new Error("Could not create canvas context."));
                return;
            }

            let framesCaptured = 0;

            const captureFrame = (time: number) => {
                video.currentTime = time;
            };

            video.onseeked = () => {
                if (framesCaptured >= numFrames) return;
                
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL(outputFormat);
                frames.push(dataUrl.split(',')[1]);
                framesCaptured++;

                if (framesCaptured < numFrames) {
                    captureFrame((framesCaptured + 1) * interval);
                } else {
                    URL.revokeObjectURL(fileUrl);
                    resolve(frames);
                }
            };

            video.onerror = (e) => {
                URL.revokeObjectURL(fileUrl);
                reject(e);
            }

            // Start capturing the first frame
            captureFrame(interval);
        };

        video.onerror = (e) => {
            URL.revokeObjectURL(fileUrl);
            reject(new Error("Failed to load video metadata."));
        };
    });
};

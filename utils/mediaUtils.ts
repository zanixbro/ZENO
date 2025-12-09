
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

/**
 * Escapes </script> tags in content to prevent premature script termination
 * and also escapes HTML comments to prevent issues in dynamically injected scripts.
 * @param content The string content to escape.
 * @returns The escaped string.
 */
export function escapeScriptTags(content: string): string {
    return content
        .replace(/<\/script>/g, '<\\u002fscript>') // Escapes </script> to prevent HTML parsing errors
        .replace(/<!--/g, '<\\!--'); // Escapes HTML comments in script strings defensively
}

/**
 * Injects Zeno's theme CSS variables and applies default styles to HTML content.
 * Ensures the output is a full HTML document structure if not already present.
 * @param htmlContent The HTML content string.
 * @returns The HTML content with injected theme styles.
 */
export function injectThemeStyles(htmlContent: string): string {
    const themeStyles = `
        <style>
            :root {
                --bg: #080c10;
                --card: #0c1218;
                --accent: #00ffc0;
                --muted: #a8b4c2;
                --danger: #ff5c7c;
                --glass: rgba(255, 255, 255, 0.05);
                --cell: #0a0e12;
                --header: #1a202c;
                --hover: #2b3440;
                --selected: var(--accent);
            }
            html, body {
                background-color: var(--bg);
                color: var(--muted);
                font-family: 'Inter', "Segoe UI", system-ui, Arial, sans-serif;
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                box-sizing: border-box; /* Include padding/border in element's total width and height */
            }
        </style>
    `;

    // Check if it's already a full HTML document
    if (htmlContent.match(/<!DOCTYPE html>/i) && htmlContent.match(/<html/i) && htmlContent.match(/<head/i)) {
        // Inject styles right after <head> tag
        return htmlContent.replace(/<head[^>]*>/i, `${headMatch[0]}\n${themeStyles}`);
    } else {
        // Construct a full HTML document if it's just a snippet
        const headContent = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
        const bodyContent = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || htmlContent; // Use entire content if no body tag

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    ${themeStyles}
    ${headContent}
</head>
<body>
    ${bodyContent}
</body>
</html>`;
    }
}

import React from 'react';

interface CodeBlockProps {
    code: string;
    language: string;
    filename: string; // New prop for download filename
    onCopy: () => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename, onCopy }) => {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        onCopy(); // Notify parent of copy
    };

    const downloadCode = () => {
        if (!code) return;
        const blob = new Blob([code], { type: `text/${language === 'python' ? 'x-python' : language}` }); // Use appropriate MIME type
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url); // Clean up the object URL
    };

    return (
        <div className="relative group h-full">
            <pre className="p-4 bg-zeno-header rounded-lg text-zeno-muted text-sm overflow-auto h-full w-full">
                <code className={`language-${language}`}>
                    {code || `// Generated ${language} will appear here.`}
                </code>
            </pre>
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={copyToClipboard}
                    className="p-1 bg-zeno-accent text-zeno-bg rounded-md text-xs"
                    title={`Copy ${language} to clipboard`}
                >
                    Copy
                </button>
                <button
                    onClick={downloadCode}
                    className="p-1 bg-zeno-card border border-zeno-accent/50 text-zeno-accent rounded-md text-xs hover:bg-zeno-hover"
                    title={`Download ${filename}`}
                    disabled={!code}
                >
                    Download
                </button>
            </div>
        </div>
    );
};
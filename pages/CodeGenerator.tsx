import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { PaperAirplaneIcon, CodeBracketIcon } from '../components/icons';
import { CodeBlock } from '../components/CodeBlock'; // Assuming CodeBlock is now a shared component

interface CodeGeneratorProps {
    onSaveCode: (code: string, language: string, prompt: string) => void;
}

const CodeGenerator: React.FC<CodeGeneratorProps> = ({ onSaveCode }) => {
    const [codePrompt, setCodePrompt] = useState('Write a Python function that calculates the factorial of a number recursively.');
    const [generatedCode, setGeneratedCode] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('plaintext');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyStatus, setCopyStatus] = useState<boolean>(false);

    useEffect(() => {
        const timeout = setTimeout(() => setCopyStatus(false), 2000);
        return () => clearTimeout(timeout);
    }, [copyStatus]);

    const handleGenerateCode = async () => {
        if (!codePrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setGeneratedCode('');
        setDetectedLanguage('plaintext');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro', // Using pro model for better code generation
                contents: codePrompt,
                config: {
                    systemInstruction: "You are an expert programmer and code assistant. Provide only complete, runnable code, focusing on clarity and best practices. Respond only with the code block, and do not include any conversational text or explanations outside of the code block itself (e.g., no 'Here's your code:' prefixes). Detect the language and format it in a markdown code block.",
                    thinkingConfig: { thinkingBudget: 24576 } // Give a good budget for code generation
                },
            });

            if (response.text) {
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
                const match = response.text.match(codeBlockRegex);
                let extractedCode = response.text;
                let language = 'plaintext';

                if (match && match[2]) {
                    extractedCode = match[2].trim();
                    language = match[1] || 'plaintext';
                }

                setGeneratedCode(extractedCode);
                setDetectedLanguage(language);
                onSaveCode(extractedCode, language, codePrompt); // Save to Savor Studio
            } else {
                setError("No code was generated. Please try a different prompt.");
            }

        } catch (e) {
            console.error('Code generation error:', e);
            setError(e instanceof Error ? `Failed to generate code: ${e.message}. Please try again.` : 'An unknown error occurred during code generation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Code Generator" description="Generate code snippets and full programs in various languages using natural language prompts.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <textarea
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    placeholder="Describe the code you need (e.g., 'Write a JavaScript function to reverse a string', 'Generate a basic HTML structure for a blog post')."
                    className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent mb-4"
                    rows={6}
                    disabled={isLoading}
                />
                <Button onClick={handleGenerateCode} isLoading={isLoading} disabled={!codePrompt.trim()} className="w-full mb-4">
                    <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                    Generate Code
                </Button>
                {error && <p className="text-zeno-danger text-sm mt-2 text-center">{error}</p>}
                <div className="flex-1 bg-zeno-bg rounded-lg p-0 overflow-hidden border border-zeno-accent/10 relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-zeno-muted">Generating code...</div>
                    ) : (
                        <CodeBlock
                            code={generatedCode}
                            language={detectedLanguage}
                            filename={`generated_code.${detectedLanguage === 'plaintext' ? 'txt' : detectedLanguage}`}
                            onCopy={() => setCopyStatus(true)}
                        />
                    )}
                    {copyStatus && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zeno-accent text-zeno-bg px-3 py-1.5 rounded-md shadow-lg text-sm transition-opacity opacity-100">
                            Code copied!
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default CodeGenerator;
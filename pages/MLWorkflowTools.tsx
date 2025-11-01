import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '../components/common/Card'; // Re-added Card import
import Button from '../components/common/Button';
import { PaperAirplaneIcon, CodeBracketIcon, BookOpenIcon } from '../components/icons';

// Simple component for displaying code (could be enhanced with syntax highlighting libraries)
const CodeDisplay: React.FC<{ code: string }> = ({ code }) => (
    <pre className="p-4 bg-zeno-header rounded-lg text-zeno-muted text-sm overflow-x-auto whitespace-pre-wrap">
        <code>{code || '// Generated code will appear here.'}</code>
    </pre>
);

// --- ML CODE GENERATOR ---
const MLCodeGenerator: React.FC = () => {
    const [codePrompt, setCodePrompt] = useState('Write Python code using scikit-learn to classify the iris dataset using a Support Vector Machine.');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCode = async () => {
        if (!codePrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setGeneratedCode('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: codePrompt,
                config: {
                    systemInstruction: "You are an expert Machine Learning engineer. Provide only complete, runnable Python code, focusing on clarity and best practices. Respond only with the code block, and do not include any conversational text or explanations outside of the code block itself (e.g., no 'Here's your code:' prefixes).",
                    thinkingConfig: { thinkingBudget: 32768 } // Max budget for 2.5 Pro for complex code
                },
            });
            setGeneratedCode(response.text);
        } catch (e) {
            console.error('ML Code generation error:', e);
            setError(e instanceof Error ? `Failed to generate code: ${e.message}. Please try again.` : 'An unknown error occurred during code generation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={codePrompt}
                onChange={(e) => setCodePrompt(e.target.value)}
                placeholder="Describe the Python ML code you need (e.g., 'Write Python code using scikit-learn to perform K-Means clustering on a dummy dataset and visualize the results.')."
                className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent mb-4"
                rows={6}
                disabled={isLoading}
            />
            <Button onClick={handleGenerateCode} isLoading={isLoading} disabled={!codePrompt.trim()} className="w-full mb-4">
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                Generate Code
            </Button>
            {error && <p className="text-zeno-danger text-sm mt-2 text-center">{error}</p>}
            <div className="flex-1 bg-zeno-bg rounded-lg p-0 overflow-y-auto border border-zeno-accent/10">
                {isLoading && <div className="text-center text-zeno-muted p-4">Generating ML code...</div>}
                {!isLoading && <CodeDisplay code={generatedCode} />}
            </div>
        </div>
    );
};

// --- ML CONCEPT EXPLAINER ---
const MLConceptExplainer: React.FC = () => {
    const [conceptPrompt, setConceptPrompt] = useState('Explain what a Convolutional Neural Network is to a high school student.');
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExplainConcept = async () => {
        if (!conceptPrompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setExplanation('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: conceptPrompt,
                config: {
                    systemInstruction: "You are an AI tutor specializing in Machine Learning. Explain complex ML concepts clearly, concisely, and tailored to the requested audience level. Use simple language and relevant examples. Format your response using Markdown.",
                },
            });
            setExplanation(response.text);
        } catch (e) {
            console.error('ML Concept explanation error:', e);
            setError(e instanceof Error ? `Failed to explain concept: ${e.message}. Please try again.` : 'An unknown error occurred during concept explanation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <textarea
                value={conceptPrompt}
                onChange={(e) => setConceptPrompt(e.target.value)}
                placeholder="Enter an ML concept to explain (e.g., 'What is reinforcement learning?', 'Describe the bias-variance tradeoff simply.')."
                className="w-full p-3 bg-zeno-header rounded-lg resize-none flex-grow focus:outline-none focus:ring-2 focus:ring-zeno-accent mb-4"
                rows={6}
                disabled={isLoading}
            />
            <Button onClick={handleExplainConcept} isLoading={isLoading} disabled={!conceptPrompt.trim()} className="w-full mb-4">
                <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                Explain Concept
            </Button>
            {error && <p className="text-zeno-danger text-sm mt-2 text-center">{error}</p>}
            <div className="flex-1 bg-zeno-bg rounded-lg p-4 overflow-y-auto border border-zeno-accent/10 text-white whitespace-pre-wrap">
                {isLoading && <div className="text-center text-zeno-muted p-4">Explaining ML concept...</div>}
                {!isLoading && explanation ? explanation : <p className="text-zeno-muted/50 text-center">Explanation will appear here.</p>}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const MLWorkflowTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'codeGenerator' | 'conceptExplainer'>('codeGenerator');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'codeGenerator': return <MLCodeGenerator />;
            case 'conceptExplainer': return <MLConceptExplainer />;
            default: return null;
        }
    };

    return (
        <Card title="ML Workflow Tools" description="Generate ML code or get explanations for complex machine learning concepts.">
            <div className="flex flex-col h-full flex-grow overflow-hidden">
                <div className="border-b border-zeno-header mb-4">
                    <nav className="-mb-px flex space-x-4">
                        <button
                            onClick={() => setActiveTab('codeGenerator')}
                            className={`${activeTab === 'codeGenerator' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            <CodeBracketIcon className="w-5 h-5" />ML Code Generator
                        </button>
                        <button
                            onClick={() => setActiveTab('conceptExplainer')}
                            className={`${activeTab === 'conceptExplainer' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
                        >
                            <BookOpenIcon className="w-5 h-5" />ML Concept Explainer
                        </button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {renderTabContent()}
                </div>
            </div>
        </Card>
    );
};

export default MLWorkflowTools;
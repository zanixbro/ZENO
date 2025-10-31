
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { ChatMessage, Personality } from '../types';
import { PERSONALITIES } from '../constants';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { PaperAirplaneIcon } from '../components/icons';

interface AskAIProps {
    personality: Personality;
}

const AskAI: React.FC<AskAIProps> = ({ personality }) => {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatInstance = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      chatInstance.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: PERSONALITIES[personality],
        }
      });
      setHistory([]); 
      setError(null);
    } catch (e) {
      setError('Failed to initialize the AI model. Please check your API key.');
      console.error(e);
    }
  }, [personality]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !chatInstance.current) return;

    const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
    setHistory((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const responseStream = await chatInstance.current.sendMessageStream({ message: currentInput });
      
      let modelResponse = '';
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of responseStream) {
        modelResponse += chunk.text;
        setHistory(prev => {
            const newHistory = [...prev];
            if (newHistory.length > 0 && newHistory[newHistory.length - 1].role === 'model') {
                newHistory[newHistory.length - 1].parts[0].text = modelResponse;
            }
            return newHistory;
        });
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to get response: ${errorMessage}`);
      setHistory(prev => prev.slice(0, -1)); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Zeno Chat" description="Engage in a multi-turn conversation. Your chat history provides context for follow-up questions.">
        <div className="flex-1 flex flex-col overflow-hidden bg-zeno-bg p-4 rounded-lg border border-zeno-accent/10">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {history.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl px-5 py-3 rounded-xl shadow-md whitespace-pre-wrap ${msg.role === 'user' ? 'bg-zeno-accent text-zeno-bg' : 'bg-zeno-header text-zeno-muted'}`}>
                        {msg.parts[0].text}
                    </div>
                </div>
            ))}
            {isLoading && history[history.length-1]?.role !== 'model' && (
                <div className="flex justify-start">
                    <div className="max-w-xl px-4 py-2 rounded-xl bg-zeno-header">
                        <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-zeno-accent rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>
            {error && <p className="text-zeno-danger text-sm mt-2">{error}</p>}
            <div className="mt-4 flex items-center space-x-2">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                placeholder="Ask Zeno anything..."
                className="flex-1 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent border border-transparent focus:border-zeno-accent"
                disabled={isLoading}
            />
            <Button onClick={handleSend} isLoading={isLoading} disabled={!input.trim()}><PaperAirplaneIcon className="w-5 h-5"/></Button>
            </div>
        </div>
    </Card>
  );
};

export default AskAI;

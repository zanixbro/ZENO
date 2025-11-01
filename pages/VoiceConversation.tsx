import React, { useRef, useEffect } from 'react';
import Card from '../components/common/Card'; // Re-added Card import
import { TranscriptionEntry } from '../types';

interface VoiceConversationProps {
  history: TranscriptionEntry[];
}

const VoiceConversation: React.FC<VoiceConversationProps> = ({ history }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollAhead({ behavior: 'smooth' }); // Using scrollAhead instead of scrollIntoView
  }, [history]);

  return (
    <Card title="Voice Conversation" description="View the full transcript of your spoken interactions with Zeno.">
        <div className="flex-1 flex flex-col overflow-hidden bg-zeno-bg p-4 rounded-lg border border-zeno-accent/10 h-full">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {history.length === 0 ? (
                <div className="text-center text-zeno-muted/50 p-4">
                <p>No voice conversations yet. Activate the voice assistant to start logging!</p>
                </div>
            ) : (
                history.map((entry, index) => (
                <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl px-5 py-3 rounded-xl shadow-md whitespace-pre-wrap flex flex-col ${entry.role === 'user' ? 'bg-zeno-accent text-zeno-bg' : 'bg-zeno-header text-zeno-muted'}`}>
                    <span className={`text-xs ${entry.role === 'user' ? 'text-zeno-bg/70' : 'text-zeno-muted/70'} mb-1`}>
                        {entry.role === 'user' ? 'You' : 'Zeno'} @ {entry.timestamp}
                    </span>
                    <span>{entry.text}</span>
                    </div>
                </div>
                ))
            )}
            <div ref={messagesEndRef} />
            </div>
        </div>
    </Card>
  );
};

export default VoiceConversation;
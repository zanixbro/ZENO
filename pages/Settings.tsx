
import React from 'react';
import Card from '../components/common/Card';
import { Personality } from '../types';
import { PERSONALITIES } from '../constants';

interface SettingsProps {
    currentPersonality: Personality;
    onPersonalityChange: (personality: Personality) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentPersonality, onPersonalityChange }) => {
    return (
        <Card title="Settings" description="Customize your Zeno experience. Changes will apply to new chats in 'Zeno Chat'.">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-white mb-2">AI Personality</h3>
                    <p className="text-zeno-muted mb-4">Choose how Zeno should respond in the main chat.</p>
                    <select
                        value={currentPersonality}
                        onChange={(e) => onPersonalityChange(e.target.value as Personality)}
                        className="w-full md:w-1/2 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                    >
                        {Object.keys(PERSONALITIES).map((key) => (
                            <option key={key} value={key} className="capitalize">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                     <h3 className="text-lg font-medium text-white mb-2">Theme</h3>
                     <p className="text-zeno-muted">Dark Futuristic Neon (default)</p>
                </div>
            </div>
        </Card>
    );
};

export default Settings;

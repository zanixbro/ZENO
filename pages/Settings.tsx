
import React from 'react';
import Card from '../components/common/Card';
import { Personality } from '../types';
import { PERSONALITIES } from '../constants';

interface SettingsProps {
    currentPersonality: Personality;
    onPersonalityChange: (personality: Personality) => void;
    customPersonalityInstruction: string;
    onCustomPersonalityInstructionChange: (instruction: string) => void;
}

const Settings: React.FC<SettingsProps> = ({
    currentPersonality,
    onPersonalityChange,
    customPersonalityInstruction,
    onCustomPersonalityInstructionChange,
}) => {
    return (
        <Card title="Settings" description="Customize your Zeno experience. Changes will apply to new chats in 'Zeno Chat'.">
            <div className="flex-1 space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-white mb-2">AI Personality</h3>
                    <p className="text-zeno-muted mb-4">Choose how Zeno should respond in the main chat.</p>
                    
                    {/* Predefined Personalities */}
                    <div className="mb-4">
                        <label className="inline-flex items-center text-zeno-muted mr-4 mb-2 md:mb-0">
                            <input
                                type="radio"
                                name="personality_type"
                                value="predefined"
                                checked={currentPersonality !== 'custom'}
                                onChange={() => onPersonalityChange('zeno')} // Default to zeno if switching from custom
                                className="form-radio text-zeno-accent focus:ring-zeno-accent border-zeno-muted"
                            />
                            <span className="ml-2 text-white">Predefined Personalities</span>
                        </label>
                        <select
                            value={currentPersonality === 'custom' ? 'zeno' : currentPersonality} // Show zeno if custom is active in select
                            onChange={(e) => onPersonalityChange(e.target.value as Personality)}
                            className="w-full md:w-1/2 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent"
                            disabled={currentPersonality === 'custom'}
                        >
                            {Object.keys(PERSONALITIES).filter(key => key !== 'custom').map((key) => (
                                <option key={key} value={key} className="capitalize">
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Personality */}
                    <div>
                        <label className="inline-flex items-center text-zeno-muted mr-4">
                            <input
                                type="radio"
                                name="personality_type"
                                value="custom"
                                checked={currentPersonality === 'custom'}
                                onChange={() => onPersonalityChange('custom')}
                                className="form-radio text-zeno-accent focus:ring-zeno-accent border-zeno-muted"
                            />
                            <span className="ml-2 text-white">Custom Personality</span>
                        </label>
                        {currentPersonality === 'custom' && (
                            <textarea
                                value={customPersonalityInstruction}
                                onChange={(e) => onCustomPersonalityInstructionChange(e.target.value)}
                                onBlur={() => localStorage.setItem('zeno_custom_personality', customPersonalityInstruction)} // Save on blur
                                placeholder="Define your custom AI personality here (e.g., 'You are a helpful pirate chef who loves to tell jokes.')."
                                rows={5}
                                className="w-full mt-2 p-3 bg-zeno-header rounded-lg focus:outline-none focus:ring-2 focus:ring-zeno-accent resize-y"
                                aria-label="Custom AI Personality Instruction"
                            />
                        )}
                    </div>
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

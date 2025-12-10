import React, { useState } from 'react';
import Card from '../components/common/Card';
import ImageGenerator from './ImageGenerator';
import ImageEditor from './ImageEditor';
import AudioTools from '../components/AudioTools';
import GameMaker from './GameMaker';

interface CreativeToolsProps {
    onSaveImage: (url: string, prompt: string) => void;
    onSaveAudio: (url: string, text: string) => void;
    onSaveCode: (code: string, language: string, prompt: string) => void; // New prop for GameMaker
}

const CreativeTools: React.FC<CreativeToolsProps> = ({ onSaveImage, onSaveAudio, onSaveCode }) => {
    const [activeTab, setActiveTab] = useState('imageGen');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'imageGen': return <ImageGenerator onSaveImage={onSaveImage} />;
            case 'imageEdit': return <ImageEditor />;
            case 'audioGen': return <AudioTools onSaveAudio={onSaveAudio} />;
            case 'gameMaker': return <GameMaker onSaveCode={onSaveCode} />;
            default: return null;
        }
    };

    return (
        <Card title="Media Studio" description="Your hub for AI-powered creativity. Generate and edit images, or create audio content.">
            <div className="flex flex-col h-full">
                <div className="border-b border-zeno-header mb-4 overflow-x-auto whitespace-nowrap">
                    <nav className="-mb-px flex space-x-4">
                        <button onClick={() => setActiveTab('imageGen')} className={`${activeTab === 'imageGen' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Image Generation</button>
                        <button onClick={() => setActiveTab('imageEdit')} className={`${activeTab === 'imageEdit' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Image Editor</button>
                        <button onClick={() => setActiveTab('audioGen')} className={`${activeTab === 'audioGen' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Podcast & Speech</button>
                        <button onClick={() => setActiveTab('gameMaker')} className={`${activeTab === 'gameMaker' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Game Maker</button>
                    </nav>
                </div>
                <div className="flex-grow overflow-auto">
                    {renderTabContent()}
                </div>
            </div>
        </Card>
    );
};

export default CreativeTools;
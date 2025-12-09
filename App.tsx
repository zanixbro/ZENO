import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import { NavID, Personality, TranscriptionEntry, GeneratedImageEntry, GeneratedVideoEntry, GeneratedAudioEntry, GeneratedWebpageEntry, GeneratedCodeEntry } from './types'; // Import NavID and new generated content types
import VoiceCommandAssistant from './components/VoiceCommandAssistant';
import Card from './components/common/Card'; // Re-add Card import
import { LOGIN_PAGE_CONTENT } from './constants'; // Import LOGIN_PAGE_CONTENT

// Page components
import AskAI from './pages/AskAI';
import Settings from './pages/Settings';
import CreativeTools from './pages/CreativeTools';
import VideoGenerator from './pages/VideoGenerator';
import VideoEditor from './pages/VideoEditor';
import ProductivityTools from './pages/ProductivityTools';
import KnowledgeTools from './pages/KnowledgeTools';
import VoiceConversation from './pages/VoiceConversation';
import WebMaker from './pages/WebMaker';
import MLWorkflowTools from './pages/MLWorkflowTools';
import CameraVision from './pages/CameraVision';
import SavorStudioGallery from './pages/SavorStudioGallery'; // Import new SavorStudioGallery
import CodeGenerator from './pages/CodeGenerator'; // Import new CodeGenerator
import GameMaker from './pages/GameMaker'; // Import new GameMaker

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavID>('ask');
  const [personality, setPersonality] = useState<Personality>(() => {
    const savedPersonality = localStorage.getItem('zeno_personality');
    return (savedPersonality as Personality) || 'zeno';
  });
  const [customPersonalityInstruction, setCustomPersonalityInstruction] = useState<string>(() => {
    return localStorage.getItem('zeno_custom_personality') || 'You are a helpful AI assistant. Your personality is now defined by the user.';
  });
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);

  // States for Savor Studio Gallery
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageEntry[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoEntry[]>([]);
  const [generatedAudio, setGeneratedAudio] = useState<GeneratedAudioEntry[]>([]);
  const [generatedWebpages, setGeneratedWebpages] = useState<GeneratedWebpageEntry[]>([]);
  const [generatedCodeEntries, setGeneratedCodeEntries] = useState<GeneratedCodeEntry[]>([]); // New state for generated code

  useEffect(() => {
    localStorage.setItem('zeno_personality', personality);
  }, [personality]);

  useEffect(() => {
    localStorage.setItem('zeno_custom_personality', customPersonalityInstruction);
  }, [customPersonalityInstruction]);


  const handleNavigate = (pageId: NavID) => {
    setActivePage(pageId);
  };

  const onSaveImage = (url: string, prompt: string) => {
    const newEntry: GeneratedImageEntry = {
      id: `image-${Date.now()}`,
      url,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedImages(prev => [...prev, newEntry]);
  };

  const onSaveVideo = (url: string, prompt: string) => {
    const newEntry: GeneratedVideoEntry = {
      id: `video-${Date.now()}`,
      url,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedVideos(prev => [...prev, newEntry]);
  };

  const onSaveAudio = (url: string, text: string) => {
    const newEntry: GeneratedAudioEntry = {
      id: `audio-${Date.now()}`,
      url,
      text,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedAudio(prev => [...prev, newEntry]);
  };

  const onSaveWebpage = (html: string, css: string, javascript: string, prompt: string) => {
    const newEntry: GeneratedWebpageEntry = {
      id: `webpage-${Date.now()}`,
      html,
      css,
      javascript,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedWebpages(prev => [...prev, newEntry]);
  };

  const onSaveCode = (code: string, language: string, prompt: string) => {
    const newEntry: GeneratedCodeEntry = {
      id: `code-${Date.now()}`,
      code,
      language,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedCodeEntries(prev => [...prev, newEntry]);
  };


  const renderActivePage = () => {
    switch (activePage) {
      case 'ask':
        return <AskAI personality={personality} customPersonalityInstruction={customPersonalityInstruction} />;
      case 'savor_gallery':
        return (
          <SavorStudioGallery
            generatedImages={generatedImages}
            generatedVideos={generatedVideos}
            generatedAudio={generatedAudio}
            generatedWebpages={generatedWebpages}
            generatedCodeEntries={generatedCodeEntries}
          />
        );
      case 'creative':
        return <CreativeTools onSaveImage={onSaveImage} onSaveAudio={onSaveAudio} onSaveCode={onSaveCode} />;
      case 'videoGen':
        return <VideoGenerator onSaveVideo={onSaveVideo} />;
      case 'videoEdit':
        return <VideoEditor onSaveVideo={onSaveVideo} />;
      case 'productivity':
        return <ProductivityTools />;
      case 'knowledge':
        return <KnowledgeTools />;
      case 'voice_conversation':
        return <VoiceConversation history={transcriptionHistory} />;
      case 'web_maker':
        return <WebMaker onSaveWebpage={onSaveWebpage} />;
      case 'ml_workflow':
        return <MLWorkflowTools />;
      case 'camera_vision':
        return <CameraVision />;
      case 'code_generator':
        return <CodeGenerator onSaveCode={onSaveCode} />;
      case 'game_maker': // New case for GameMaker
        return <GameMaker onSaveCode={onSaveCode} />;
      case 'login': // New case for placeholder Login page
        // The LOGIN_PAGE_CONTENT type definition will be fixed in constants.ts
        return <Card title={LOGIN_PAGE_CONTENT.title} description={LOGIN_PAGE_CONTENT.description}>{LOGIN_PAGE_CONTENT.content}</Card>;
      case 'settings':
        return (
            <Settings
                currentPersonality={personality}
                onPersonalityChange={setPersonality}
                customPersonalityInstruction={customPersonalityInstruction}
                onCustomPersonalityInstructionChange={setCustomPersonalityInstruction}
            />
        );
      default:
        console.warn(`Unhandled navigation ID: ${activePage}`);
        return <AskAI personality={personality} customPersonalityInstruction={customPersonalityInstruction} />;
    }
  };

  return (
    <div className="flex h-screen bg-zeno-bg text-zeno-text font-sans">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {renderActivePage()}
      </main>
      <VoiceCommandAssistant
        activePage={activePage}
        onNavigate={handleNavigate}
        currentPersonality={personality}
        onPersonalityChange={setPersonality}
        customPersonalityInstruction={customPersonalityInstruction}
        setTranscriptionHistory={setTranscriptionHistory}
      />
    </div>
  );
};

export default App;
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import { NavID, Personality, TranscriptionEntry, GeneratedImageEntry, GeneratedVideoEntry, GeneratedAudioEntry, GeneratedWebpageEntry, GeneratedCodeEntry, SocialPost } from './types';
import VoiceCommandAssistant from './components/VoiceCommandAssistant';
import Card from './components/common/Card';
import { LOGIN_SCREEN_DETAILS } from './constants'; // Updated import name

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
import SavorStudioGallery from './pages/SavorStudioGallery';
import CodeGenerator from './pages/CodeGenerator';
import GameMaker from './pages/GameMaker';
import LoginPage from './pages/LoginPage'; // New: Login Page
import ZenoConnect from './pages/ZenoConnect'; // New: Zeno Connect Social Platform

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavID>('ask');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('zeno_is_logged_in') === 'true';
  });
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
  const [generatedCodeEntries, setGeneratedCodeEntries] = useState<GeneratedCodeEntry[]>([]);
  
  // New state for Zeno Connect posts
  const [generatedPosts, setGeneratedPosts] = useState<SocialPost[]>([]);

  // Persist login state
  useEffect(() => {
    localStorage.setItem('zeno_is_logged_in', String(isLoggedIn));
    if (!isLoggedIn && activePage !== 'login') {
      setActivePage('login'); // Redirect to login if not logged in
    } else if (isLoggedIn && activePage === 'login') {
      setActivePage('ask'); // Redirect from login if already logged in
    }
  }, [isLoggedIn, activePage]);

  useEffect(() => {
    localStorage.setItem('zeno_personality', personality);
  }, [personality]);

  useEffect(() => {
    localStorage.setItem('zeno_custom_personality', customPersonalityInstruction);
  }, [customPersonalityInstruction]);

  const handleNavigate = (pageId: NavID) => {
    if (!isLoggedIn && pageId !== 'login') {
      setActivePage('login');
      return;
    }
    setActivePage(pageId);
  };

  const createSocialPost = (type: SocialPost['type'], content: SocialPost['content'], prompt: string, author: string = 'You'): SocialPost => ({
    id: `${type}-${Date.now()}`,
    type,
    content,
    prompt,
    author,
    timestamp: new Date().toLocaleString(),
    likes: 0,
    comments: [],
  });

  const onSaveImage = (url: string, prompt: string) => {
    const newEntry: GeneratedImageEntry = {
      id: `image-${Date.now()}`,
      url,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedImages(prev => [...prev, newEntry]);
    setGeneratedPosts(prev => [...prev, createSocialPost('image', { url, thumbnail: url }, prompt)]);
  };

  const onSaveVideo = (url: string, prompt: string) => {
    const newEntry: GeneratedVideoEntry = {
      id: `video-${Date.now()}`,
      url,
      prompt,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedVideos(prev => [...prev, newEntry]);
    setGeneratedPosts(prev => [...prev, createSocialPost('video', { url, thumbnail: '' }, prompt)]); // TODO: Add video thumbnail
  };

  const onSaveAudio = (url: string, text: string) => {
    const newEntry: GeneratedAudioEntry = {
      id: `audio-${Date.now()}`,
      url,
      text,
      timestamp: new Date().toLocaleString(),
    };
    setGeneratedAudio(prev => [...prev, newEntry]);
    setGeneratedPosts(prev => [...prev, createSocialPost('audio', { url, text }, text)]);
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
    setGeneratedPosts(prev => [...prev, createSocialPost('webpage', { html, css, javascript }, prompt)]);
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
    setGeneratedPosts(prev => [...prev, createSocialPost('code', { code, language }, prompt)]);
  };

  // Callback for directly saving text posts from Zeno Connect
  const onSavePost = (type: SocialPost['type'], content: SocialPost['content'], prompt: string, author: string = 'You') => {
    setGeneratedPosts(prev => [...prev, createSocialPost(type, content, prompt, author)]);
  };


  const renderActivePage = () => {
    if (!isLoggedIn && activePage !== 'login') {
      return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
    }

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
      case 'game_maker':
        return <GameMaker onSaveCode={onSaveCode} />;
      case 'login':
        return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
      case 'logout': // Logout is handled in Sidebar, this case should ideally not be reached
        return <LoginPage setIsLoggedIn={setIsLoggedIn} />;
      case 'zeno_connect': // New: Zeno Connect
        return <ZenoConnect generatedPosts={generatedPosts} onSavePost={onSavePost} />;
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
    <div className="flex h-screen bg-zeno-bg text-zeno-muted font-sans">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {renderActivePage()}
      </main>
      {isLoggedIn && ( // Only show voice assistant if logged in
        <VoiceCommandAssistant
          activePage={activePage}
          onNavigate={handleNavigate}
          currentPersonality={personality}
          onPersonalityChange={setPersonality}
          customPersonalityInstruction={customPersonalityInstruction}
          setTranscriptionHistory={setTranscriptionHistory}
        />
      )}
    </div>
  );
};

export default App;
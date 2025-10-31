
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import { PageID, Personality } from './types';

// Page components
import AskAI from './pages/AskAI';
import CreativeTools from './pages/CreativeTools';
import VideoGenerator from './pages/VideoGenerator';
import ProductivityTools from './pages/ProductivityTools';
import KnowledgeTools from './pages/KnowledgeTools';
import MLWorkflowTools from './pages/MLWorkflowTools';
import Settings from './pages/Settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<PageID>('ask');
  const [personality, setPersonality] = useState<Personality>('zeno');

  const renderActivePage = () => {
    switch (activePage) {
      case 'ask':
        return <AskAI personality={personality} />;
      case 'creative':
        return <CreativeTools />;
      case 'video':
        return <VideoGenerator />;
      case 'productivity':
        return <ProductivityTools />;
      case 'knowledge':
        return <KnowledgeTools />;
      case 'ml_workflow':
        return <MLWorkflowTools />;
      case 'settings':
        return <Settings currentPersonality={personality} onPersonalityChange={setPersonality} />;
      default:
        return <AskAI personality={personality} />;
    }
  };

  return (
    <div className="flex h-screen bg-zeno-bg text-zeno-text font-sans">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
        {renderActivePage()}
      </main>
    </div>
  );
};

export default App;

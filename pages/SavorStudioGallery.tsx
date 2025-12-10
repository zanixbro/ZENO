import React, { useState, useRef, useEffect, useMemo } from 'react';
import Button from '../components/common/Button';
import { GeneratedImageEntry, GeneratedVideoEntry, GeneratedAudioEntry, GeneratedWebpageEntry, GeneratedCodeEntry } from '../types';
import { SparklesIcon, FilmIcon, SpeakerWaveIcon, GlobeAltIcon, PhotoIcon, CodeBracketIcon } from '../components/icons';
import { escapeScriptTags, injectThemeStyles } from '../utils/mediaUtils';

interface SavorStudioGalleryProps {
  generatedImages: GeneratedImageEntry[];
  generatedVideos: GeneratedVideoEntry[];
  generatedAudio: GeneratedAudioEntry[];
  generatedWebpages: GeneratedWebpageEntry[];
  generatedCodeEntries: GeneratedCodeEntry[];
}

// Utility function to convert data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
    // Split the data URI into mime type and base64 string
    const parts = dataURI.split(',');
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const byteString = atob(parts[1]); // Decode base64

    // Write the bytes of the string to an ArrayBuffer
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // Create a Blob from the ArrayBuffer
    return new Blob([ab], { type: mimeString });
}


const SavorStudioGallery: React.FC<SavorStudioGalleryProps> = ({
  generatedImages,
  generatedVideos,
  generatedAudio,
  generatedWebpages,
  generatedCodeEntries,
}) => {
  const [activeTab, setActiveTab] = useState<'images' | 'videos' | 'audio' | 'webpages' | 'code'>('images');
  const contentScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top when tab changes
  useEffect(() => {
    if (contentScrollRef.current) {
      contentScrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleImageDownload = (item: GeneratedImageEntry) => {
    try {
      if (!item.url.startsWith('data:')) {
        // If it's not a data URI, assume it's already a blob or external URL and use direct download
        const a = document.createElement('a');
        a.href = item.url;
        a.download = `generated_image_${item.id}.jpeg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      
      const imageBlob = dataURItoBlob(item.url);
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated_image_${item.id}.jpeg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke the object URL after a short delay to allow download to start
      setTimeout(() => URL.revokeObjectURL(url), 100); 
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'images':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
            {generatedImages.length === 0 ? (
              <p className="col-span-full text-center text-zeno-muted/50 p-8">No images generated yet. Start creating!</p>
            ) : (
              generatedImages.map((item) => (
                <div key={item.id} className="bg-zeno-card rounded-lg overflow-hidden border border-zeno-accent/10 flex flex-col shadow-lg">
                  <img src={item.url} alt={item.prompt} className="w-full h-48 object-cover" />
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-zeno-muted mb-2 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-zeno-muted/70 mb-4">{item.timestamp}</p>
                    <Button
                      onClick={() => handleImageDownload(item)}
                      variant="secondary"
                      className="w-full"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'videos':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {generatedVideos.length === 0 ? (
              <p className="col-span-full text-center text-zeno-muted/50 p-8">No videos generated yet. Get cinematic!</p>
            ) : (
              generatedVideos.map((item) => (
                <div key={item.id} className="bg-zeno-card rounded-lg overflow-hidden border border-zeno-accent/10 flex flex-col shadow-lg">
                  <video src={item.url} controls className="w-full h-48 object-cover bg-black" />
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-zeno-muted mb-2 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-zeno-muted/70 mb-4">{item.timestamp}</p>
                    <Button
                      as="a"
                      href={item.url}
                      download={`generated_video_${item.id}.mp4`}
                      variant="secondary"
                      className="w-full"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      case 'audio':
        return (
          <div className="space-y-4 p-4">
            {generatedAudio.length === 0 ? (
              <p className="text-center text-zeno-muted/50 p-8">No audio generated yet. Let's hear it!</p>
            ) : (
              generatedAudio.map((item) => (
                <div key={item.id} className="bg-zeno-card rounded-lg p-4 border border-zeno-accent/10 flex flex-col sm:flex-row items-center justify-between shadow-lg">
                  <div className="flex-grow mb-4 sm:mb-0 sm:mr-4">
                    <p className="text-sm text-zeno-muted line-clamp-2">{item.text}</p>
                    <p className="text-xs text-zeno-muted/70 mt-1">{item.timestamp}</p>
                    <audio controls src={item.url} className="w-full mt-2"></audio>
                  </div>
                  <Button
                    as="a"
                    href={item.url}
                    download={`generated_audio_${item.id}.pcm`}
                    variant="secondary"
                    className="flex-shrink-0"
                  >
                    Download (.pcm)
                  </Button>
                </div>
              ))
            )}
          </div>
        );
      case 'webpages':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
            {generatedWebpages.length === 0 ? (
              <p className="col-span-full text-center text-zeno-muted/50 p-8">No webpages generated yet. Code something up!</p>
            ) : (
              generatedWebpages.map((item) => {
                const escapedHtml = escapeScriptTags(item.html);
                const escapedCss = escapeScriptTags(item.css);
                const escapedJs = escapeScriptTags(item.javascript);

                const previewContent = injectThemeStyles(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><style>${escapedCss}</style></head><body>${escapedHtml}<script>${escapedJs}</script></body></html>`);
                
                return (
                  <div key={item.id} className="bg-zeno-card rounded-lg overflow-hidden border border-zeno-accent/10 flex flex-col shadow-lg">
                    <div className="p-4 pb-0">
                      <p className="text-sm text-zeno-muted mb-2 line-clamp-2">{item.prompt}</p>
                      <p className="text-xs text-zeno-muted/70">{item.timestamp}</p>
                    </div>
                    <div className="relative w-full h-64 bg-zeno-bg mt-2">
                      <iframe
                        srcDoc={previewContent}
                        title={`Webpage Preview ${item.id}`}
                        className="w-full h-full border-0 scale-[0.5] origin-top-left"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}
                      />
                       <div className="absolute inset-0 bg-zeno-card/50 flex items-center justify-center pointer-events-none">
                          <span className="text-zeno-muted text-sm px-3 py-1 rounded bg-zeno-card border border-zeno-accent/20">Preview (scaled)</span>
                      </div>
                    </div>
                    <div className="p-4 pt-0 flex space-x-2">
                      <Button
                        as="a"
                        href={URL.createObjectURL(new Blob([item.html], { type: 'text/html' }))}
                        download={`index_${item.id}.html`}
                        variant="secondary"
                        className="flex-1"
                      >
                        Download HTML
                      </Button>
                      {item.css && (
                          <Button
                          as="a"
                          href={URL.createObjectURL(new Blob([item.css], { type: 'text/css' }))}
                          download={`style_${item.id}.css`}
                          variant="secondary"
                          className="flex-1"
                          >
                          Download CSS
                          </Button>
                      )}
                      {item.javascript && (
                          <Button
                          as="a"
                          href={URL.createObjectURL(new Blob([item.javascript], { type: 'text/javascript' }))}
                          download={`script_${item.id}.js`}
                          variant="secondary"
                          className="flex-1"
                          >
                          Download JS
                          </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        );
      case 'code':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {generatedCodeEntries.length === 0 ? (
              <p className="col-span-full text-center text-zeno-muted/50 p-8">No code generated yet. Time to get coding!</p>
            ) : (
              generatedCodeEntries.map((item) => (
                <div key={item.id} className="bg-zeno-card rounded-lg overflow-hidden border border-zeno-accent/10 flex flex-col shadow-lg">
                  <div className="p-4 flex-grow flex flex-col">
                    <p className="text-sm text-zeno-muted mb-2 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-zeno-muted/70 mb-2">Language: {item.language} | {item.timestamp}</p>
                    <pre className="flex-grow p-2 bg-zeno-header rounded-md text-zeno-muted text-xs overflow-auto max-h-32 mb-4">
                      <code>{item.code}</code>
                    </pre>
                    <Button
                      as="a"
                      href={URL.createObjectURL(new Blob([item.code], { type: `text/${item.language}` }))}
                      download={`generated_code_${item.id}.${item.language === 'plaintext' ? 'txt' : item.language}`}
                      variant="secondary"
                      className="w-full"
                    >
                      Download (.{item.language === 'plaintext' ? 'txt' : item.language})
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-zeno-card border border-zeno-accent/10 rounded-xl shadow-2xl p-6 md:p-8 h-full flex flex-col backdrop-blur-sm bg-glass">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-zeno-accent">Savor Studio</h1>
        <p className="text-zeno-muted mt-2">Your personal gallery of AI-generated content. All your creations in one place.</p>
      </div>

      <div className="flex flex-col flex-grow overflow-hidden">
        <div className="border-b border-zeno-header mb-4 overflow-x-auto whitespace-nowrap">
          <nav className="-mb-px flex space-x-4">
            <button
              onClick={() => setActiveTab('images')}
              className={`${activeTab === 'images' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            >
              <PhotoIcon className="w-5 h-5" />Images ({generatedImages.length})
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`${activeTab === 'videos' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <FilmIcon className="w-5 h-5" />Videos ({generatedVideos.length})
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`${activeTab === 'audio' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <SpeakerWaveIcon className="w-5 h-5" />Audio ({generatedAudio.length})
            </button>
            <button
              onClick={() => setActiveTab('webpages')}
              className={`${activeTab === 'webpages' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <GlobeAltIcon className="w-5 h-5" />Webpages ({generatedWebpages.length})
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`${activeTab === 'code' ? 'border-zeno-accent text-zeno-accent' : 'border-transparent text-zeno-muted'} flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
              <CodeBracketIcon className="w-5 h-5" />Code ({generatedCodeEntries.length})
            </button>
          </nav>
        </div>
        <div ref={contentScrollRef} className="flex-grow overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SavorStudioGallery;
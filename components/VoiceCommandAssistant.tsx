
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, Blob, FunctionDeclaration, Type, LiveServerMessage } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/mediaUtils';
import { MicrophoneIcon, StopCircleIcon } from './icons';
import { NavID, Personality, VoiceCommandStatus, TranscriptionEntry } from '../types'; // Use NavID
import { MENU_ITEMS, PERSONALITIES } from '../constants';

interface VoiceCommandAssistantProps {
  activePage: NavID;
  onNavigate: (page: NavID) => void;
  currentPersonality: Personality;
  onPersonalityChange: (personality: Personality) => void;
  customPersonalityInstruction: string; // New prop
  setTranscriptionHistory: React.Dispatch<React.SetStateAction<TranscriptionEntry[]>>;
}

const VoiceCommandAssistant: React.FC<VoiceCommandAssistantProps> = ({
  activePage,
  onNavigate,
  currentPersonality,
  onPersonalityChange,
  customPersonalityInstruction, // Use new prop
  setTranscriptionHistory,
}) => {
  const [status, setStatus] = useState<VoiceCommandStatus>('off');
  const [displayedText, setDisplayedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const latestStatusRef = useRef<VoiceCommandStatus>(status);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  // Helper to create PCM blob from Float32Array
  const createBlob = useCallback((data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }, []);

  // Get all navigable IDs from MENU_ITEMS
  const allNavigableItems = MENU_ITEMS.flatMap(group => group.items);
  const allNavigableIds: NavID[] = allNavigableItems.map(item => item.id);
  // Get all display names for pages
  const allNavigableNames: string[] = allNavigableItems.map(item => item.name);


  // Function Declarations for Gemini
  const navigateToPageFunction: FunctionDeclaration = {
    name: 'navigateToPage',
    parameters: {
      type: Type.OBJECT,
      description: 'Navigates the user to a specific page in the application.',
      properties: {
        pageId: {
          type: Type.STRING,
          description: `The ID of the page to navigate to. Possible values are: ${allNavigableIds.join(', ')}.`,
          enum: allNavigableIds,
        },
      },
      required: ['pageId'],
    },
  };

  const changePersonalityFunction: FunctionDeclaration = {
    name: 'changePersonality',
    parameters: {
      type: Type.OBJECT,
      description: 'Changes the AI personality for Zeno Chat.',
      properties: {
        personality: {
          type: Type.STRING,
          description: `The personality ID to switch to. Possible values are: ${Object.keys(PERSONALITIES).join(', ')}.`,
          enum: Object.keys(PERSONALITIES), // Include 'custom' here
        },
      },
      required: ['personality'],
    },
  };

  // Effect to keep latestStatusRef updated with the current status state
  useEffect(() => {
    latestStatusRef.current = status;
  }, [status]);

  // Close session and clean up resources
  const closeSession = useCallback(() => {
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
      sessionPromiseRef.current = null;
    }
    setStatus('off');
    setDisplayedText('');
    setError(null);
  }, []);

  // Handle errors and ensure clean shutdown
  useEffect(() => {
    if (error) {
      console.error("Voice Command Error:", error);
      closeSession();
    }
    return () => {
      // Ensure session is closed when component unmounts or effect dependencies change to recreate
      closeSession();
    };
  }, [error, closeSession]);

  const handleToggleVoiceCommand = useCallback(async () => {
    if (status !== 'off') {
      closeSession();
      return;
    }

    setStatus('listening');
    setDisplayedText('Initializing...');
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputAudioContext;
      const source = inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputAudioContext;

      let currentInputTranscription = '';
      let currentOutputTranscription = '';

      // Determine the correct system instruction based on currentPersonality
      const systemInstruction = currentPersonality === 'custom' ? customPersonalityInstruction : PERSONALITIES[currentPersonality];
      // Add a note about custom personality to the voice assistant's own system instruction
      const voiceAssistantSystemInstruction = `You are Zeno, a helpful voice assistant for a web application. Your main goal is to understand user commands and navigate them through the app or change settings. You can use the following tools:
            - navigateToPage: to go to a specific section of the app.
            - changePersonality: to adjust the AI's chat personality.
            Always use the tools when appropriate.
            If the user asks for information, acknowledge their request but prioritize using the tools if a clear command is given. For example, if they say "Go to creative tools", use the navigateToPage tool. If they say "Tell me a joke", say "I can tell you a joke, but my primary function is to help you navigate the app. Would you like me to go to Zeno Chat for that?".
            Your available navigation targets are: ${allNavigableNames.join(', ')}.
            Your available personalities are: ${Object.keys(PERSONALITIES).filter(key => key !== 'custom').join(', ')}, and also 'custom' (which is a user-defined personality).
            Your current page is "${allNavigableItems.find(item => item.id === activePage)?.name || activePage}".
            Your current personality is "${currentPersonality === 'custom' ? 'custom' : PERSONALITIES[currentPersonality]}".
            When setting the personality, if the user asks for a 'custom' personality, inform them that it will activate their pre-defined custom personality, as you cannot define it through voice.`;

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.debug('Voice command session opened');
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
            setDisplayedText('Listening...');
            setStatus('listening');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              currentInputTranscription += message.serverContent.inputTranscription.text;
              setDisplayedText(`You: ${currentInputTranscription}`);
              setStatus('processing');
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscription += message.serverContent.outputTranscription.text;
              setDisplayedText(`Zeno: ${currentOutputTranscription}`);
              setStatus('speaking');
            }

            if (message.serverContent?.turnComplete) {
              console.debug('Turn complete. User input:', currentInputTranscription, 'Model output:', currentOutputTranscription);
              
              const now = new Date().toLocaleTimeString();

              if (currentInputTranscription.trim()) {
                setTranscriptionHistory(prev => [...prev, { role: 'user', text: currentInputTranscription, timestamp: now }]);
              }
              if (currentOutputTranscription.trim()) {
                setTranscriptionHistory(prev => [...prev, { role: 'model', text: currentOutputTranscription, timestamp: now }]);
              }

              setDisplayedText('Listening...');
              currentInputTranscription = '';
              currentOutputTranscription = '';
              setStatus('listening');
            }

            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64EncodedAudioString = message.serverContent.modelTurn.parts[0].inlineData.data;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
              const audioBuffer = await decodeAudioData(
                decode(base64EncodedAudioString),
                outputAudioContextRef.current!,
                24000,
                1,
              );
              const audioSource = outputAudioContextRef.current!.createBufferSource();
              audioSource.buffer = audioBuffer;
              audioSource.connect(outputAudioContextRef.current!.destination);
              audioSource.addEventListener('ended', () => {
                outputSourcesRef.current.delete(audioSource);
                if (outputSourcesRef.current.size === 0 && latestStatusRef.current === 'speaking') {
                  setStatus('listening');
                  setDisplayedText('Listening...');
                }
              });
              audioSource.start(nextStartTimeRef.current);
              nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
              outputSourcesRef.current.add(audioSource);
              setStatus('speaking');
            }

            if (message.serverContent?.interrupted) {
              outputSourcesRef.current.forEach(source => source.stop());
              outputSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
              setDisplayedText('Listening...');
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                console.debug('Function call received:', fc);
                let toolResponseResult = "ok";
                if (fc.name === 'navigateToPage') {
                  const pageId = fc.args.pageId as NavID;
                  if (pageId && allNavigableIds.includes(pageId)) {
                    onNavigate(pageId); // Navigate directly to the page
                    // Find the display name for the tool
                    const displayName = allNavigableItems.find(item => item.id === pageId)?.name || pageId;
                    toolResponseResult = `Navigated to ${displayName}.`;
                  } else {
                    toolResponseResult = `Could not navigate to unknown page: ${pageId}.`;
                  }
                } else if (fc.name === 'changePersonality') {
                  const personality = fc.args.personality as Personality;
                  if (personality && Object.keys(PERSONALITIES).includes(personality)) {
                    if (personality === 'custom') {
                        // For custom, we just switch to it, the instruction is already saved
                        onPersonalityChange(personality);
                        toolResponseResult = `Switched to your custom personality.`;
                    } else {
                        onPersonalityChange(personality);
                        toolResponseResult = `Changed personality to ${personality}.`;
                    }
                  } else {
                    toolResponseResult = `Could not change to unknown personality: ${personality}.`;
                  }
                }

                sessionPromiseRef.current?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: {
                      id: fc.id,
                      name: fc.name,
                      response: { result: toolResponseResult },
                    },
                  });
                });
              }
            }
          },
          onerror: (e: ErrorEvent) => {
            setError(`Live session error: ${e.message}`);
            console.error('Voice Command: Live session error', e);
            closeSession();
          },
          onclose: (e: CloseEvent) => {
            console.debug('Voice command session closed', e);
            closeSession();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } },
          },
          systemInstruction: voiceAssistantSystemInstruction, // Use the dynamically constructed instruction
          tools: [{ functionDeclarations: [navigateToPageFunction, changePersonalityFunction] }],
        },
      });

      sessionPromiseRef.current.then(session => {
        sessionRef.current = session;
      }).catch(err => {
        setError(`Failed to establish live session: ${err.message}`);
        console.error('Voice Command: Failed to establish live session', err);
        closeSession();
      });

      scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        const pcmBlob = createBlob(inputData);
        sessionPromiseRef.current?.then((session) => {
          session.sendRealtimeInput({ media: pcmBlob });
        });
      };

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      console.error('Voice Command: Error starting session', e);
      setStatus('off');
      setDisplayedText('');
    }
  }, [status, createBlob, onNavigate, onPersonalityChange, activePage, currentPersonality, customPersonalityInstruction, setTranscriptionHistory, closeSession, navigateToPageFunction, changePersonalityFunction, allNavigableIds, allNavigableNames]); // Added customPersonalityInstruction as a dependency

  const buttonClasses = `
    fixed bottom-6 right-6
    w-16 h-16 rounded-full
    flex items-center justify-center
    shadow-lg transition-all duration-300
    focus:outline-none focus:ring-4 focus:ring-opacity-50
    ${status === 'listening' || status === 'speaking' || status === 'processing'
      ? 'bg-zeno-danger text-white focus:ring-zeno-danger'
      : 'bg-zeno-accent text-zeno-bg hover:bg-opacity-90 focus:ring-zeno-accent'}
    ${status === 'off' ? '' : 'animate-pulse-subtle'}
  `;

  return (
    <>
      <button
        onClick={handleToggleVoiceCommand}
        className={buttonClasses}
        aria-label={status === 'off' ? 'Activate voice command' : 'Deactivate voice command'}
        aria-pressed={status !== 'off'}
        disabled={error !== null}
      >
        {status === 'off' ? <MicrophoneIcon className="w-8 h-8" /> : <StopCircleIcon className="w-8 h-8" />}
      </button>

      {status !== 'off' && (
        <div className="fixed bottom-24 right-6 bg-zeno-header text-zeno-muted px-4 py-2 rounded-lg shadow-md max-w-xs text-sm text-right">
          {error ? <span className="text-zeno-danger">Error: {error}</span> : displayedText}
        </div>
      )}
    </>
  );
};

export default VoiceCommandAssistant;

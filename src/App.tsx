import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sprout, User, MessageSquare, Map as MapIcon, Shield, Camera, Send, Loader2, AlertTriangle, Menu } from 'lucide-react';
import { modelManager } from './lib/model-manager';
import { registerServiceWorker, cacheModel, getCachedModel } from './lib/offline';

// --- Types ---
type Pillar = 'farm' | 'body' | 'ai' | 'map';

// --- CSS theme ---
// Using high-contrast colors: Gold (#FFD700) and Deep Blue/Black
// pidgin names: "Check My Farm", "Check My Body", "Ask AI", "Security Map"

const App: React.FC = () => {
  const [activePillar, setActivePillar] = useState<Pillar>('farm');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [missingModels, setMissingModels] = useState<{name: string, url: string, label: string}[]>([]);
  const [setupProgress, setSetupProgress] = useState(0);
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    checkSetup();
  }, []);

  const checkSetup = async () => {
    const allModels = [
      { name: 'crop_doctor', url: 'https://huggingface.co/rufatronics/crop_doctor/resolve/main/crop_doctor.tflite', label: 'CROP DOCTOR (Farm AI)' },
      { name: 'health_scan', url: 'https://huggingface.co/rufatronics/health_scan/resolve/main/health_scan.tflite', label: 'HEALTH SCAN (Body AI)' }
    ];
    
    const missing = [];
    for (const model of allModels) {
      const cached = await getCachedModel(model.name);
      if (!cached) missing.push(model);
    }
    setMissingModels(missing);
  };

  const runSetup = async () => {
    if (missingModels.length === 0) return;
    setIsSettingUp(true);
    setSetupProgress(0);
    
    const target = missingModels[0];

    try {
      console.log(`[Setup] Downloading ${target.name}...`);
      await cacheModel(target.name, target.url);
      setSetupProgress(100);
      
      // Short delay to show 100%
      await new Promise(r => setTimeout(r, 800));
      
      // Refresh list
      await checkSetup();
    } catch (err) {
      alert("Network bad! Try again later or move to where service de okay.");
      console.error(err);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handlePillarChange = (pillar: Pillar) => {
    if (pillar === 'map') {
      // Redirect directly to Naija Watch
      window.location.href = 'https://nw0.vercel.app';
      return;
    }
    setActivePillar(pillar);
    setIsMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans flex flex-col overflow-hidden">
      {/* Setup Overlay */}
      <AnimatePresence>
        {missingModels.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black p-8 flex flex-col items-center justify-center text-center"
          >
            <Shield className="w-16 h-16 text-yellow-400 mb-6" />
            <h2 className="text-3xl font-black text-yellow-400 tracking-tighter uppercase">AI Storage Setup</h2>
            <p className="mt-4 text-zinc-400 max-w-xs">
              We need download AI Brain for your phone so you fit use am offline. Step by step, focus on one at a time.
            </p>
            
            <div className="mt-8 w-full max-w-xs space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Next Download:</p>
                 <h3 className="text-xl font-bold text-white">{missingModels[0].label}</h3>
                 <p className="text-xs text-zinc-500 mt-1">Status: {isSettingUp ? 'Downloading...' : 'Ready to start'}</p>
              </div>

              {!isSettingUp ? (
                <button 
                  onClick={runSetup}
                  className="w-full py-4 bg-yellow-400 text-black font-black text-lg rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3"
                >
                  DOWNLOAD NOW
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="h-4 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
                    <motion.div 
                      className="h-full bg-yellow-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${setupProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-bold text-yellow-400 animate-pulse tracking-widest uppercase">Fetching Intelligence... {Math.round(setupProgress)}%</p>
                </div>
              )}
            </div>
            
            <div className="mt-12 space-y-2">
               <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Local Brain Storage Active</p>
               <div className="flex gap-1 justify-center">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className={`h-1 w-8 rounded-full ${i < (2 - missingModels.length) ? 'bg-yellow-400' : 'bg-zinc-800'}`} />
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-yellow-400 fill-current" />
          <h1 className="text-xl font-bold tracking-tighter text-yellow-400">DEY SAFE AI</h1>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 active:scale-95 transition-transform"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activePillar === 'farm' && <VisionPillar key="farm" mode="farm" />}
          {activePillar === 'body' && <VisionPillar key="body" mode="body" />}
          {activePillar === 'ai' && <ChatPillar key="ai" />}
        </AnimatePresence>
      </main>

      {/* Navigation - 4 Pillars */}
      <nav className="h-20 border-t border-zinc-800 bg-zinc-900 flex items-center justify-around px-2 z-50">
        <NavButton 
          active={activePillar === 'farm'} 
          onClick={() => handlePillarChange('farm')}
          icon={<Sprout />}
          label="Check My Farm"
        />
        <NavButton 
          active={activePillar === 'body'} 
          onClick={() => handlePillarChange('body')}
          icon={<User />}
          label="Check My Body"
        />
        <NavButton 
          active={activePillar === 'ai'} 
          onClick={() => handlePillarChange('ai')}
          icon={<MessageSquare />}
          label="Ask AI"
        />
        <NavButton 
          active={activePillar === 'map'} 
          onClick={() => handlePillarChange('map')}
          icon={<MapIcon />}
          label="Security Map"
        />
      </nav>

      {/* Side Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute right-0 top-0 bottom-0 w-64 bg-zinc-900 z-[70] p-6 flex flex-col gap-4 border-l border-zinc-800"
            >
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-8">Settings & Info</h2>
              <button className="flex items-center gap-3 p-3 hover:bg-zinc-800 rounded-lg">
                <Shield className="w-5 h-5 text-yellow-400" />
                <span>Security Check</span>
              </button>
              <div className="mt-auto pt-6 border-t border-zinc-800">
                <p className="text-xs text-zinc-500">Device Optimize: 2GB RAM Mode</p>
                <div className="flex gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-xs text-zinc-400">Offline Intelligence Ready</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Components ---

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactElement; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 flex-1 py-2 rounded-xl transition-all duration-300 ${
      active ? 'bg-yellow-400/10 text-yellow-400' : 'text-zinc-500 dark:hover:text-zinc-300'
    }`}
  >
    <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-yellow-400/20' : ''}`}>
      {React.cloneElement(icon, { size: 24 } as any)}
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tight truncate w-full text-center">{label}</span>
  </button>
);

// Pinned Vision Pillar (Handles both Farm and Body)
const VisionPillar: React.FC<{ mode: 'farm' | 'body' }> = ({ mode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setError(null);
        const modelId = mode === 'farm' ? 'crop_doctor' : 'health_scan';
        const modelUrl = mode === 'farm' 
          ? 'https://huggingface.co/rufatronics/crop_doctor/resolve/main/crop_doctor.tflite' 
          : 'https://huggingface.co/rufatronics/health_scan/resolve/main/health_scan.tflite';
        await modelManager.loadVisionModel(modelId, modelUrl);
        setIsLoaded(true);
        
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }, 
          audio: false 
        });
        setStream(mediaStream);
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong loading the AI.");
      }
    };
    init();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
      modelManager.disposeCurrent();
    };
  }, [mode]);

  const captureAndPredict = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, 224, 224); // Assuming 224x224 input
    // Prediction logic would go here
    setPrediction("Scanning... (Device Optimizing)");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex flex-col bg-black"
    >
      <div className="relative flex-1 bg-zinc-950">
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 z-10">
            <Loader2 className="w-12 h-12 text-yellow-400 animate-spin" />
            <p className="text-yellow-400 font-bold">Waking Up Vision AI...</p>
            <p className="text-xs text-zinc-500">Wait small, we de optimize for your phone</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-900 z-10 p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500" />
            <p className="text-red-500 font-bold">AI fail to load</p>
            <p className="text-xs text-zinc-500">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-yellow-400 text-black font-bold rounded-xl"
            >
              RETRY
            </button>
          </div>
        )}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover grayscale-[20%]"
        />
        <canvas ref={canvasRef} width={224} height={224} className="hidden" />
        
        {/* Overlay Grid */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
           <div className="w-full h-full border border-yellow-400/30 grid grid-cols-3 grid-rows-3">
              {[...Array(9)].map((_, i) => <div key={i} className="border border-white/5" />)}
           </div>
        </div>

        {/* Prediction Display */}
        {prediction && (
          <div className="absolute bottom-10 left-6 right-6 p-4 bg-yellow-400 text-black rounded-2xl font-bold shadow-2xl animate-fade-in flex items-center gap-3">
            <AlertTriangle className="w-6 h-6" />
            <span>{prediction}</span>
          </div>
        )}
      </div>

      <div className="h-24 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-lg">
        <button 
          onClick={captureAndPredict}
          className="w-16 h-16 rounded-full bg-white border-4 border-yellow-400 flex items-center justify-center active:scale-90 transition-transform shadow-lg"
        >
          <Camera className="w-8 h-8 text-black" />
        </button>
      </div>
    </motion.div>
  );
};

// Chat Pillar (WebLLM)
const ChatPillar: React.FC = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await modelManager.loadChatEngine("Bonsai-1b-GGUF", (p) => {
          setLoadProgress(Math.round(p.progress * 100));
        });
        setIsReady(true);
      } catch (err) {
        console.error(err);
      }
    };
    init();
    return () => { modelManager.disposeCurrent(); };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendChat = async () => {
    if (!input.trim() || !isReady) return;
    const newMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsTyping(true);
    
    // Simulate/Call LLM
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Oga, I de scan your request. For now, I de work for offline mode for your brain storage." }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute inset-0 flex flex-col bg-zinc-950 p-4"
    >
      {!isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-900 z-10 p-10 text-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full" />
            <motion.div 
              className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{loadProgress}%</div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-yellow-400">Loading AI Brain</h3>
            <p className="text-zinc-500 mt-2">Bonsai 1-bit engine de load for your phone RAM. Wait small...</p>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pt-4 pb-20 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10 text-zinc-600">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-bold">Chat with Bonsai AI</p>
            <p className="text-sm">Ask me anything about your farm or security.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-yellow-400 text-black font-medium' : 'bg-zinc-800 text-white'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-zinc-500 text-xs animate-pulse pl-2">AI is thinking...</div>}
      </div>

      <div className="pb-4 pt-2 flex gap-2 items-center">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendChat()}
          placeholder="Ask AI sumtin..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3 focus:outline-none focus:border-yellow-400 transition-colors"
        />
        <button 
          onClick={sendChat}
          className="p-3 bg-yellow-400 text-black rounded-full active:scale-90 transition-transform"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </motion.div>
  );
};

export default App;

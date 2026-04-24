import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Stethoscope, 
  MessageSquare, 
  ShieldAlert, 
  ChevronLeft, 
  Cpu, 
  MemoryStick,
  WifiOff,
  Camera,
  Send,
  Map as MapIcon,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const PillarCard = ({ icon: Icon, title, subtitle, color, onClick }: any) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-6 rounded-2xl ${color} border border-white/10 text-center gap-3`}
  >
    <div className="p-3 bg-white/10 rounded-xl">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <div>
      <h3 className="font-bold text-lg leading-tight">{title}</h3>
      <p className="text-xs text-white/60 mt-1">{subtitle}</p>
    </div>
  </motion.button>
);

const TechStats = () => (
  <div className="absolute top-12 left-4 right-4 flex justify-between bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/5 z-20">
    <div className="flex items-center gap-2 text-[10px] text-green-400">
      <Cpu className="w-3 h-3" />
      <span>1-BIT KERNEL</span>
    </div>
    <div className="flex items-center gap-2 text-[10px] text-blue-400">
      <MemoryStick className="w-3 h-3" />
      <span>RAM: 1.1GB / 2GB</span>
    </div>
    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
      <WifiOff className="w-3 h-3" />
      <span>OFFLINE</span>
    </div>
  </div>
);

// --- Sub-pages ---

const FarmPage = ({ onBack }: any) => (
  <div className="bg-zinc-900 h-full flex flex-col p-6 pt-24 text-white">
    <button onClick={onBack} className="flex items-center gap-2 text-green-400 mb-6">
      <ChevronLeft /> Back Home
    </button>
    <h2 className="text-2xl font-bold mb-2">Check My Farm</h2>
    <p className="text-sm text-zinc-400 mb-8">Crop Doctor is ready. Point camera at leaf.</p>
    
    <div className="aspect-[3/4] bg-zinc-800 rounded-3xl relative overflow-hidden border-2 border-dashed border-green-900/50 flex flex-col items-center justify-center gap-4">
      <Camera className="w-12 h-12 text-zinc-600" />
      <span className="text-zinc-500 font-mono text-xs italic">OFFLINE VISION ACTIVE</span>
      
      {/* Mock Scan Line */}
      <motion.div 
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-1 bg-green-500/30 blur-sm shadow-[0_0_15px_rgba(34,197,94,0.5)]"
      />
    </div>
    
    <div className="mt-6 bg-green-900/20 border border-green-800/30 rounded-xl p-4">
      <p className="text-xs font-mono text-green-400 uppercase mb-2">Diagnosis (TFLite Engine):</p>
      <p className="text-sm">"Your maize get small issue. No be pest, it be lack of nitrogen. Add organic manure fast-fast."</p>
    </div>
  </div>
);

const AskAiPage = ({ onBack }: any) => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Wetin dey happen? I be Bonsai 1-bit. I no need internet to reason your matter.' }
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: 'I dey reason your matter now... Based on wetin I sabi for local database, the best way to keep your store safe na to use better padlock and alert neighbors.' 
      }]);
    }, 1000);
  };

  return (
    <div className="bg-zinc-900 h-full flex flex-col p-6 pt-24 text-white">
      <button onClick={onBack} className="flex items-center gap-2 text-orange-400 mb-6">
        <ChevronLeft /> Back Home
      </button>
      <h2 className="text-2xl font-bold mb-1">Ask AI</h2>
      <p className="text-xs text-orange-400/60 mb-6 font-mono">MODEL: BONSAI 1.7B 1-BIT GGUF</p>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-orange-600' : 'bg-zinc-800 border border-white/5'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2 bg-zinc-800 p-2 rounded-2xl border border-white/5">
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type wetin you want sabi..."
          className="flex-1 bg-transparent border-none outline-none text-sm px-2"
        />
        <button onClick={send} className="bg-orange-600 p-2 rounded-xl">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// --- App Shell ---

const SecurityMapPage = ({ onBack }: any) => (
  <div className="bg-zinc-900 h-full flex flex-col p-6 pt-24 text-white">
    <button onClick={onBack} className="flex items-center gap-2 text-red-400 mb-6 font-medium">
      <ChevronLeft /> Back Home
    </button>
    <h2 className="text-2xl font-bold mb-2">Security Map</h2>
    <p className="text-xs text-zinc-400 mb-6 font-mono">SOURCE: CACHED NW0.VERCEL.APP (LOCAL DATA)</p>
    
    <div className="flex-1 bg-zinc-800 rounded-3xl relative overflow-hidden border border-red-900/40 p-4 border-dashed">
      <div className="flex items-center gap-2 mb-4 bg-red-900/20 p-2 rounded-lg border border-red-800/50">
        <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live Danger Intel (Offline)</span>
      </div>
      
      {/* Simulation of a map with "Northwatch" data */}
      <div className="w-full h-full bg-zinc-900 rounded-xl relative opacity-80">
        <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        <div className="absolute top-10 left-10 w-2 h-2 bg-red-500 rounded-full" />
        <div className="absolute top-12 left-12 text-[8px] text-zinc-500">Unsafe road detected (Local Cache)</div>
        
        <div className="absolute bottom-20 right-10 w-2 h-2 bg-green-500 rounded-full" />
        <div className="absolute bottom-18 right-10 text-[8px] text-zinc-500">Sabo Market: SAFE</div>
        
        {/* Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-10 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => <div key={i} className="border border-white/20" />)}
        </div>
      </div>
    </div>
    
    <div className="mt-4 p-3 bg-zinc-800/50 rounded-xl">
      <p className="text-[10px] text-zinc-500 italic">"Northwatch intelligence sync last updated via recursive scrape."</p>
    </div>
  </div>
);

// Update implementation in App()
export default function App() {
  const [pillar, setPillar] = useState<string | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isBooting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="iphone-x bg-black flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-green-900/50 rounded-3xl flex items-center justify-center mb-6 border border-green-500/20">
              <Sprout className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">Deysafe AI</h1>
            <div className="mt-8 flex items-center gap-2 text-zinc-500 text-xs font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>ALLOCATING RAM 1024MB...</span>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="iphone-x">
        <TechStats />
        
        <AnimatePresence mode="wait">
          {!pillar ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="h-full bg-zinc-950 flex flex-col p-6 pt-32"
            >
              <div className="mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2 underline decoration-green-600">Deysafe AI</h1>
                <p className="text-zinc-400 text-sm italic">"Intelligence for Naija, no internet needed."</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <PillarCard 
                  icon={Sprout} 
                  title="Check My Farm" 
                  subtitle="Crop Doctor"
                  color="bg-emerald-950/40 text-emerald-400"
                  onClick={() => setPillar('farm')}
                />
                <PillarCard 
                  icon={Stethoscope} 
                  title="Check My Body" 
                  subtitle="Health Scan"
                  color="bg-blue-950/40 text-blue-400"
                  onClick={() => setPillar('body')}
                />
                <PillarCard 
                  icon={MessageSquare} 
                  title="Ask AI" 
                  subtitle="Reasoning"
                  color="bg-orange-950/40 text-orange-400"
                  onClick={() => setPillar('ask')}
                />
                <PillarCard 
                  icon={ShieldAlert} 
                  title="Security Map" 
                  subtitle="Intelligence"
                  color="bg-red-950/40 text-red-400"
                  onClick={() => setPillar('map')}
                />
              </div>

              <div className="mt-auto mb-8 p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <MapIcon className="w-5 h-5 text-red-500" />
                  <span className="text-xs font-bold uppercase text-red-500">Security Alert</span>
                </div>
                <p className="text-xs text-zinc-400">Recently Northwatch scrape shows safe path near Sabo Market. Keep your eyes open.</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={pillar}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="h-full"
            >
              {pillar === 'farm' && <FarmPage onBack={() => setPillar(null)} />}
              {pillar === 'ask' && <AskAiPage onBack={() => setPillar(null)} />}
              {pillar === 'map' && <SecurityMapPage onBack={() => setPillar(null)} />}
              {pillar === 'body' && (
                <div className="bg-zinc-900 h-full flex flex-col items-center justify-center p-6 text-white text-center">
                  <h2 className="text-2xl font-bold mb-4">Check My Body</h2>
                  <p className="text-sm text-zinc-400 mb-8">This module dey prepare for your 2GB device RAM environment...</p>
                  <button onClick={() => setPillar(null)} className="px-6 py-2 bg-zinc-800 rounded-full border border-white/10">Go Home</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
      </div>
    </div>
  );
}

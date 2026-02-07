
import React, { useState, useRef, useEffect } from 'react';
import { getFireEngineAdvice } from '../services/geminiService';
import { ChatMessage, TruckConfig } from '../types';
import { Send, User, Bot, Loader2, Sparkles } from 'lucide-react';

interface ExpertAssistantProps {
  config: TruckConfig;
}

const ExpertAssistant: React.FC<ExpertAssistantProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Welcome, Captain. I'm your Fire Engineering Consultant. Ask me anything about ladder configurations, hydraulic systems, or firehouse history for your yellow aerial unit.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const response = await getFireEngineAdvice(input, config);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 backdrop-blur-lg border-l border-white/5 w-96 shadow-xl">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-white">Technical Expert</h3>
        </div>
        <div className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
          Online
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-slate-700' : 'bg-yellow-500'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-900" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user' 
                ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                : 'bg-slate-900 text-slate-300 rounded-tl-none border border-white/5'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
            </div>
            <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-slate-900 text-slate-400 rounded-tl-none border border-white/5 italic">
              Analyzing blueprints...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-white/5">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask an expert..."
            className="w-full bg-slate-800 text-white rounded-full py-2.5 pl-4 pr-12 text-sm border border-white/10 focus:outline-none focus:border-yellow-500/50 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="absolute right-1.5 p-1.5 bg-yellow-500 hover:bg-yellow-400 text-slate-900 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-yellow-500"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertAssistant;

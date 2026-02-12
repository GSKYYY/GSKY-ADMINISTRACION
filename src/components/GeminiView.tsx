import React, { useState, useRef, useEffect } from 'react';
import { AIService, AIConfig } from '../services/ai';
import { Sparkles, Send, Bot, User, Loader2, AlertTriangle, Lightbulb, Box, Search, Settings, Trash2, Copy, Check, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

const QUICK_PROMPTS = [
  { icon: AlertTriangle, label: "Pedidos Urgentes", prompt: "¿Cuáles son los pedidos más urgentes o vencidos que tengo?" },
  { icon: Box, label: "Resumen Taller", prompt: "Dame un resumen del estado actual de mi taller (pedidos activos y dinero pendiente)." },
  { icon: Lightbulb, label: "Ideas Marketing", prompt: "Dame 3 ideas de marketing para atraer clientes a mi taller de costura." },
  { icon: Search, label: "Tendencias Telas", prompt: "¿Cuáles son las telas tendencia para uniformes corporativos este año?" },
];

export const GeminiView: React.FC = () => {
  // State for Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: '¡Hola! Soy **Gemini**, tu motor de inteligencia artificial.\n\nEstoy conectado a los datos de tu taller. Puedes preguntarme sobre **pedidos, clientes y finanzas**, o usarme como buscador para dudas sobre **costura y negocios**.\n\n¿Qué quieres saber hoy?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // State for Settings
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<AIConfig>({
      // API Key removed from client-side config state for security
      // It is handled by the service using process.env.API_KEY
      model: 'gemini-3-flash-preview',
      temperature: 0.7,
      maxOutputTokens: 1000
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Call AI Service with current config
    const response = await AIService.askAssistant(text, config);

    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: response, timestamp: Date.now() };
    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const clearHistory = () => {
      setMessages([{
        id: Date.now().toString(),
        role: 'ai',
        content: 'Conversación reiniciada. ¿En qué puedo ayudarte ahora?',
        timestamp: Date.now()
      }]);
      setShowSettings(false);
  };

  const copyToClipboard = (text: string, id: string) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col animate-enter space-y-4 relative">
      
      {/* Settings Panel Overlay */}
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
              <div className="bg-[#0f0a29] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20}/></button>
                  <h3 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                      <Settings className="text-primary-400"/> Configuración IA
                  </h3>
                  
                  <div className="space-y-5">
                      {/* Model Selector */}
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Modelo</label>
                          <div className="grid grid-cols-2 gap-3">
                              <button 
                                onClick={() => setConfig({...config, model: 'gemini-3-flash-preview'})}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${config.model === 'gemini-3-flash-preview' ? 'bg-primary-600/20 border-primary-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-white/5 border-white/10 text-slate-400'}`}
                              >
                                  ⚡ Rápido (Flash)
                              </button>
                              <button 
                                onClick={() => setConfig({...config, model: 'gemini-3-pro-preview'})}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${config.model === 'gemini-3-pro-preview' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-slate-400'}`}
                              >
                                  🧠 Calidad (Pro)
                              </button>
                          </div>
                      </div>

                      {/* Temperature Slider */}
                      <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Creatividad: {config.temperature}</label>
                          </div>
                          <input 
                              type="range" 
                              min="0" max="1" step="0.1"
                              value={config.temperature}
                              onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                              <span>Preciso</span>
                              <span>Creativo</span>
                          </div>
                      </div>
                      
                      {/* Max Tokens */}
                      <div>
                          <div className="flex justify-between mb-2">
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Límite Respuesta: {config.maxOutputTokens} tokens</label>
                          </div>
                          <input 
                              type="range" 
                              min="100" max="8000" step="100"
                              value={config.maxOutputTokens}
                              onChange={(e) => setConfig({...config, maxOutputTokens: parseInt(e.target.value)})}
                              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0f0529]/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg shadow-indigo-500/30">
                <Sparkles className="text-white" size={32} />
            </div>
            <div>
                <h2 className="text-3xl font-display font-black text-white tracking-tight">GEMINI IA</h2>
                <p className="text-indigo-300 font-medium">Asistente Inteligente & Buscador</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button 
                onClick={clearHistory}
                className="p-3 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-xl transition-colors text-slate-400"
                title="Nueva Conversación"
              >
                  <Trash2 size={20}/>
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 border rounded-xl transition-colors ${showSettings ? 'bg-primary-600 text-white border-primary-500' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}
                title="Configuración"
              >
                  <Settings size={20}/>
              </button>
              <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                  <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-ping' : 'bg-emerald-500'}`}></span> 
                  {isLoading ? 'Procesando...' : 'Online'}
              </div>
          </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 glass-card rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden relative shadow-2xl">
         
         {/* Decoration */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none"></div>

         {/* Messages */}
         <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar relative z-10">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row group'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-white/5 ${msg.role === 'user' ? 'bg-slate-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                        {msg.role === 'user' ? <User size={20} className="text-slate-300"/> : <Bot size={20} className="text-white"/>}
                    </div>
                    
                    <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-3xl text-sm md:text-base leading-relaxed shadow-lg relative ${
                        msg.role === 'user' 
                        ? 'bg-white/10 text-white rounded-tr-none border border-white/5' 
                        : 'bg-[#150f35] border border-indigo-500/20 text-indigo-100 rounded-tl-none'
                    }`}>
                        {/* Copy Button (Only for AI messages) */}
                        {msg.role === 'ai' && (
                            <button 
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="absolute -top-3 -right-3 p-1.5 bg-[#0f0a29] border border-white/10 rounded-lg text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                title="Copiar texto"
                            >
                                {copiedId === msg.id ? <Check size={14} className="text-emerald-400"/> : <Copy size={14}/>}
                            </button>
                        )}

                        <div className="whitespace-pre-wrap">
                            {msg.content.includes("Error:") ? (
                                <div className="text-red-400 flex items-center gap-2 font-bold">
                                    <AlertTriangle size={18}/> {msg.content}
                                </div>
                            ) : (
                                msg.content.split('**').map((part, i) => 
                                    i % 2 === 1 ? <strong key={i} className="text-white font-black">{part}</strong> : part
                                )
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg animate-pulse">
                        <Sparkles size={20} className="text-white"/>
                    </div>
                    <div className="bg-[#150f35] border border-indigo-500/20 p-4 rounded-3xl rounded-tl-none flex items-center gap-3">
                        <Loader2 size={18} className="text-indigo-400 animate-spin"/>
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Pensando...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
         </div>

         {/* Input Zone */}
         <div className="p-4 md:p-6 bg-[#0a0520] border-t border-white/10 relative z-20">
            
            <div className="flex gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {QUICK_PROMPTS.map((qp, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => handleSend(qp.prompt)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors whitespace-nowrap group shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <qp.icon size={14} className="text-indigo-400 group-hover:text-white transition-colors"/>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{qp.label}</span>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="relative flex-1 group">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isLoading ? "Esperando respuesta..." : "Escribe tu consulta o busca información..."}
                        className="w-full pl-6 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                    <Send size={20} />
                </button>
            </form>
         </div>
      </div>
    </div>
  );
};
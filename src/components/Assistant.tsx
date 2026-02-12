import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { AIService, AIConfig } from '../services/ai';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

export const Assistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', text: '¡Hola! Soy tu asistente de taller. Pregúntame sobre pedidos, clientes o estadísticas.', sender: 'bot', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user', timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Llamada a Gemini
        const config: AIConfig = {
            // API Key removed: handled by AIService via environment variables
            model: 'gemini-3-flash-preview',
            temperature: 0.7,
            maxOutputTokens: 1000
        };
        const responseText = await AIService.askAssistant(userMsg.text, config);
        
        const botMsg: Message = { id: (Date.now() + 1).toString(), text: responseText, sender: 'bot', timestamp: Date.now() };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            
            {/* Chat Window */}
            <div className={`pointer-events-auto bg-[#0f0a29] border border-white/20 rounded-3xl shadow-2xl w-[90vw] md:w-[400px] h-[500px] mb-4 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-full">
                            <Bot className="text-white" size={20} />
                        </div>
                        <div>
                            <h3 className="font-display font-bold text-white text-sm">Asistente AI</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] text-white/80 font-medium">Conectado a Firestore</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0520] custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                                msg.sender === 'user' 
                                ? 'bg-primary-600 text-white rounded-br-none' 
                                : 'bg-white/10 text-slate-200 rounded-bl-none border border-white/5'
                            }`}>
                                {/* Simple Markdown parser could go here, for now plain text */}
                                {msg.text.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-enter">
                            <div className="bg-white/5 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center border border-white/5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-3 bg-[#0f0a29] border-t border-white/10 flex gap-2 shrink-0">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pregunta sobre pedidos..." 
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTyping}
                        className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-lg shadow-primary-900/20"
                    >
                        {isTyping ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
                    </button>
                </form>
            </div>

            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto group relative flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all duration-300 hover:scale-110 ${isOpen ? 'bg-slate-800 text-slate-400 rotate-90' : 'bg-gradient-to-br from-primary-500 to-purple-600 text-white'}`}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
                
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#030014]"></span>
                )}
            </button>
        </div>
    );
};
import React, { useEffect, useState } from 'react';
import { Instagram, Share2, ExternalLink, Smartphone, TrendingUp, Heart, Hash, Video, Zap, BarChart3, Scissors, FileText, MapPin, Layers, Eye, Wand2, MonitorPlay, Activity, Radio } from 'lucide-react';

const LOADING_MESSAGES = [
    "¡Ese TikTok va a explotar! 🚀",
    "¿El Instagram está algo quieto, no? 👀",
    "Tus seguidores están esperando... 👑",
    "Cargando la fama digital...",
    "Uniformes GSKY: Trending Topic.",
    "Analizando el algoritmo...",
    "¡Qué buen día para ser viral!",
    "Sincronizando likes y corazones...",
    "TikTok dice que hoy es tu día.",
    "Instagram se está poniendo guapo.",
    "Conectando con tu audiencia...",
    "¿Viste los views de ayer? 📈",
    "Preparando el feed perfecto.",
    "La competencia no tiene nada contra ti.",
    "Subiendo la calidad a 4K...",
    "Haciendo magia en el backstage digital.",
    "¿Y si hacemos un live hoy?",
    "El taller se mueve en redes.",
    "Filtrando los haters... 🚫",
    "Les está yendo bien en TikTok eh? 😏",
    "¡Hora del show!"
];

interface CreatorTool {
    title: string;
    desc: string;
    url: string;
    icon: any;
    gradient: string;
    tag: string;
}

const TIKTOK_TOOLS: CreatorTool[] = [
    { 
        title: "Trends Hashtags VE", 
        desc: "Monitor oficial de tendencias en tiempo real.", 
        url: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en", 
        icon: Hash, 
        gradient: "from-pink-500 to-rose-600",
        tag: "Oficial"
    },
    { 
        title: "Videos Virales #VE", 
        desc: "Espía los videos top en Venezuela para inspirarte.", 
        url: "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?region=VE", 
        icon: MonitorPlay, 
        gradient: "from-cyan-400 to-blue-600",
        tag: "Inspiración"
    },
    { 
        title: "Discovery Venezuela", 
        desc: "Tendencias directas desde el feed local.", 
        url: "https://www.tiktok.com/discover/venezuela", 
        icon: MapPin, 
        gradient: "from-yellow-400 to-orange-500",
        tag: "Local"
    },
    { 
        title: "Efectos CapCut", 
        desc: "Plantillas y efectos virales listos para usar.", 
        url: "https://www.capcut.com/trends", 
        icon: Scissors, 
        gradient: "from-slate-200 to-slate-400", 
        tag: "Edición"
    },
    { 
        title: "Contador Live", 
        desc: "Seguimiento de followers en tiempo real.", 
        url: "https://livecounts.io/tiktok-live-follower-counter", 
        icon: Radio, 
        gradient: "from-emerald-400 to-teal-600",
        tag: "En Vivo"
    },
];

const INSTAGRAM_TOOLS: CreatorTool[] = [
    { 
        title: "Generador IA", 
        desc: "Crea hashtags optimizados usando Inteligencia Artificial.", 
        url: "https://www.hootsuite.com/social-media-tools/instagram-hashtag-generator", 
        icon: Wand2, 
        gradient: "from-purple-600 to-pink-500",
        tag: "IA Tool"
    },
    { 
        title: "Trending Tags", 
        desc: "Buscador de etiquetas virales sin registro.", 
        url: "https://thesocialcat.com/tools/instagram-hashtag-generator", 
        icon: TrendingUp, 
        gradient: "from-orange-400 to-red-500",
        tag: "Rápido"
    },
    { 
        title: "Top #Venezuela", 
        desc: "Estadísticas de etiquetas locales en IG/TikTok.", 
        url: "https://iqhashtags.com/hashtags/hashtag/venezuela", 
        icon: BarChart3, 
        gradient: "from-blue-500 to-indigo-600",
        tag: "Datos"
    },
    { 
        title: "Stats Hashtags", 
        desc: "Analítica detallada de etiquetas relacionadas.", 
        url: "https://displaypurposes.com/hashtags/hashtag/venezuela", 
        icon: Activity, 
        gradient: "from-fuchsia-500 to-purple-600",
        tag: "Pro"
    },
    { 
        title: "Combos Virales", 
        desc: "Mezclas de etiquetas listas para copiar y pegar.", 
        url: "http://best-hashtags.com/hashtag/venezuela/", 
        icon: Layers, 
        gradient: "from-rose-500 to-pink-600",
        tag: "Utilidad"
    },
];

export const SocialView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [activeTab, setActiveTab] = useState<'tiktok' | 'instagram'>('tiktok');

  useEffect(() => {
    // 1. Pick a random message
    const randomIdx = Math.floor(Math.random() * LOADING_MESSAGES.length);
    setLoadingMsg(LOADING_MESSAGES[randomIdx]);

    // 2. Inject Scripts Function
    const injectScripts = () => {
        // TikTok Script
        const tiktokId = 'tiktok-embed-script';
        if (!document.getElementById(tiktokId)) {
            const script = document.createElement('script');
            script.id = tiktokId;
            script.src = "https://www.tiktok.com/embed.js";
            script.async = true;
            document.body.appendChild(script);
        }

        // SociableKit Script (Instagram)
        const skId = 'sk-instagram-widget';
        if (!document.getElementById(skId)) {
            const script = document.createElement('script');
            script.id = skId;
            script.src = "https://widgets.sociablekit.com/instagram-feed/widget.js";
            script.defer = true;
            document.body.appendChild(script);
        }
    };

    injectScripts();

    // 3. Smooth Loading Timer (3 seconds for the "Apple" feel)
    const timer = setTimeout(() => {
        setIsLoading(false);
    }, 3000);

    return () => {
        clearTimeout(timer);
        // Clean up scripts on unmount to force reload on return
        const tiktokScript = document.getElementById('tiktok-embed-script');
        if (tiktokScript) tiktokScript.remove();
        
        const skScript = document.getElementById('sk-instagram-widget');
        if (skScript) skScript.remove();
    };
  }, []);

  return (
    <div className="relative min-h-screen">
        
        {/* --- PREMIUM LOADING OVERLAY --- 
            Fixed position ensures it covers the viewport and prevents scrolling 
        */}
        <div className={`fixed inset-0 z-[100] h-screen w-screen flex flex-col items-center justify-center overflow-hidden bg-[#030014] transition-opacity duration-1000 ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-float" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] animate-pulse"></div>
            <div className="relative z-10 text-center space-y-8 px-6 max-w-2xl">
                <div className="inline-flex items-center justify-center p-4 bg-white/5 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md mb-4 animate-bounce">
                    <Smartphone size={32} className="text-white"/>
                </div>
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-slate-500 tracking-tight leading-tight">
                        Bienvenido a<br/>Tus Redes Sociales
                    </h2>
                    <p className="text-lg md:text-xl text-primary-200/80 font-medium tracking-wide animate-pulse">
                        "{loadingMsg}"
                    </p>
                </div>
                <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mt-8">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 w-full animate-[enter_2s_ease-in-out_infinite] origin-left"></div>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className={`space-y-12 pb-24 h-full transition-all duration-1000 ease-out transform ${isLoading ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0f0529]/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
                <div>
                    <h2 className="text-3xl font-display font-black text-white mb-1 flex items-center gap-3">
                        <Share2 className="text-primary-400" size={32}/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">REDES SOCIALES</span>
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 md:ml-11">Conexión con Plataformas Digitales</p>
                </div>
            </div>

            {/* LIVE FEEDS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* TIKTOK SECTION */}
                <div className="glass-card p-8 rounded-[2.5rem] flex flex-col items-center min-h-[600px] border-t border-white/10 hover:border-white/20 transition-all">
                    <div className="w-full flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-black rounded-xl border border-white/10 text-white shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">TikTok <TrendingUp size={16} className="text-emerald-400"/></h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest">@uniformes_gsky27</p>
                            </div>
                        </div>
                        <a href="https://www.tiktok.com/@uniformes_gsky27" target="_blank" rel="noreferrer" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg">
                            Ver Perfil <ExternalLink size={12}/>
                        </a>
                    </div>
                    
                    <div className="w-full flex justify-center flex-1">
                        <blockquote 
                            className="tiktok-embed" 
                            cite="https://www.tiktok.com/@uniformes_gsky27" 
                            data-unique-id="uniformes_gsky27" 
                            data-embed-type="creator" 
                            style={{ maxWidth: '780px', minWidth: '288px', width: '100%' }} 
                        > 
                            <section> 
                                <a target="_blank" href="https://www.tiktok.com/@uniformes_gsky27?refer=creator_embed" rel="noreferrer">@uniformes_gsky27</a> 
                            </section> 
                        </blockquote>
                    </div>
                </div>

                {/* INSTAGRAM SECTION */}
                <div className="glass-card p-8 rounded-[2.5rem] flex flex-col min-h-[600px] border-t border-white/10 hover:border-white/20 transition-all">
                    <div className="w-full flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-xl text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]">
                                <Instagram size={24}/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">Instagram <Heart size={16} className="text-pink-400 fill-pink-400"/></h3>
                                <p className="text-xs text-slate-400 uppercase tracking-widest">@uniformes_gsky27</p>
                            </div>
                        </div>
                        <a href="https://www.instagram.com/uniformes_gsky27" target="_blank" rel="noreferrer" className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg">
                            Ver Perfil <ExternalLink size={12}/>
                        </a>
                    </div>

                    <div className="flex-1 w-full bg-white/5 rounded-2xl overflow-hidden border border-white/5 relative shadow-inner">
                        <div className="sk-instagram-feed" data-embed-id="25651317"></div>
                    </div>
                </div>
            </div>

            {/* CREATOR STUDIO SECTION */}
            <div className="space-y-8 animate-enter">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-display font-black text-white flex items-center gap-3 mb-2">
                            <Zap className="text-yellow-400 fill-yellow-400" size={32}/> 
                            CREATOR STUDIO
                        </h2>
                        <p className="text-slate-400 font-medium">Herramientas profesionales para dominar el algoritmo en 2026.</p>
                    </div>
                    {/* Tabs */}
                    <div className="flex bg-black/40 rounded-2xl p-1.5 border border-white/10">
                         <button 
                            onClick={() => setActiveTab('tiktok')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'tiktok' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                         >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                            TikTok
                         </button>
                         <button 
                            onClick={() => setActiveTab('instagram')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${activeTab === 'instagram' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                         >
                            <Instagram size={16}/>
                            Instagram
                         </button>
                    </div>
                </div>

                {/* TikTok Grid */}
                {activeTab === 'tiktok' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-enter">
                        {TIKTOK_TOOLS.map((tool, idx) => (
                            <a 
                                key={idx} 
                                href={tool.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group relative glass-card p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden"
                            >
                                {/* Hover Glow */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${tool.gradient}`}></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg`}>
                                        <tool.icon size={24}/>
                                    </div>
                                    <span className="bg-white/10 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                        {tool.tag}
                                    </span>
                                </div>
                                
                                <div className="relative z-10 mb-6 flex-1">
                                    <h3 className="text-lg font-display font-bold text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                                        {tool.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {tool.desc}
                                    </p>
                                </div>

                                <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-white/20 transition-colors">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-white transition-colors">Abrir</span>
                                    <div className="bg-white/5 p-2 rounded-full group-hover:bg-white group-hover:text-black transition-all">
                                        <ExternalLink size={14} className="transform group-hover:rotate-45 transition-transform"/>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* Instagram Grid */}
                {activeTab === 'instagram' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-enter">
                        {INSTAGRAM_TOOLS.map((tool, idx) => (
                            <a 
                                key={idx} 
                                href={tool.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="group relative glass-card p-6 rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden"
                            >
                                {/* Hover Glow */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${tool.gradient}`}></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-lg`}>
                                        <tool.icon size={24}/>
                                    </div>
                                    <span className="bg-white/10 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg backdrop-blur-sm border border-white/5">
                                        {tool.tag}
                                    </span>
                                </div>
                                
                                <div className="relative z-10 mb-6 flex-1">
                                    <h3 className="text-lg font-display font-bold text-white mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                                        {tool.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                        {tool.desc}
                                    </p>
                                </div>

                                <div className="relative z-10 pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-white/20 transition-colors">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-white transition-colors">Abrir</span>
                                    <div className="bg-white/5 p-2 rounded-full group-hover:bg-white group-hover:text-black transition-all">
                                        <ExternalLink size={14} className="transform group-hover:rotate-45 transition-transform"/>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};
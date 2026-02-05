import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Users, Scissors, BarChart3, Menu, Share2 } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onNavigate(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full p-3 rounded-xl transition-all duration-300 group ${
        currentView === view
          ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg shadow-primary-900/50 border border-white/10'
          : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
      }`}
    >
      <Icon size={20} className={`transition-transform duration-300 ${currentView === view ? 'scale-110' : 'group-hover:scale-110'}`} />
      <span className="font-medium tracking-wide">{label}</span>
      {currentView === view && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
      )}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-gray-100 font-sans selection:bg-primary-500/30">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 glass-panel h-screen sticky top-0 print:hidden border-r border-white/5 z-20">
        <div className="p-8 flex items-center space-x-3 mb-4">
          <div className="bg-gradient-to-br from-primary-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-purple-500/30 border border-white/10">
            <Scissors size={28} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Costura<span className="text-primary-400">Pro</span>
          </h1>
        </div>
        
        <nav className="flex-1 px-6 space-y-3">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="clients" icon={Users} label="Clientes" />
          <NavItem view="orders" icon={Scissors} label="Pedidos" />
          <NavItem view="stats" icon={BarChart3} label="Estadísticas" />
          <NavItem view="social" icon={Share2} label="Redes Sociales" />
        </nav>

        <div className="p-6">
            <div className="bg-gradient-to-br from-white/5 to-transparent rounded-xl p-4 border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-gray-400 text-center">
                    System v2.1 <br/>
                    <span className="text-primary-400 animate-pulse">● Online</span>
                </p>
            </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden glass-panel p-4 flex justify-between items-center sticky top-0 z-30 print:hidden border-b border-white/10 backdrop-blur-xl">
        <div className="flex items-center space-x-2">
          <div className="bg-primary-600 p-1.5 rounded-lg text-white">
            <Scissors size={20} />
          </div>
          <span className="font-display font-black text-lg text-white tracking-wide">Costura<span className="text-primary-400">Pro</span></span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300 p-2 hover:bg-white/10 rounded-lg active:bg-white/20 transition-colors">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-[#0f0529] w-full p-4 space-y-2 absolute top-[69px] border-b border-white/10 shadow-2xl animate-enter" onClick={e => e.stopPropagation()}>
            <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="clients" icon={Users} label="Clientes" />
            <NavItem view="orders" icon={Scissors} label="Pedidos" />
            <NavItem view="stats" icon={BarChart3} label="Estadísticas" />
            <NavItem view="social" icon={Share2} label="Redes Sociales" />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto print:p-0 print:overflow-visible pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto print:max-w-none">
          {children}
        </div>
      </main>
    </div>
  );
};
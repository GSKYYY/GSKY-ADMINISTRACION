import React, { useState, useMemo } from 'react';
import { Client, Order, OrderStatus } from '../types';
import { Users, ShoppingBag, Clock, CheckCircle2, Calendar, Filter, ArrowRight, AlertTriangle, Zap, TrendingUp, DollarSign } from 'lucide-react';

interface DashboardViewProps {
  clients: Client[];
  orders: Order[];
}

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

export const DashboardView: React.FC<DashboardViewProps> = ({ clients, orders }) => {
  const [filter, setFilter] = useState<TimeFilter>('week');
  const [customRange, setCustomRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Operational Metrics
  const operationalMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000;
    const threeDaysFromNow = endOfToday + (86400000 * 2);

    const activeOrders = orders.filter(o => 
        o.status !== OrderStatus.DELIVERED && 
        o.status !== OrderStatus.CANCELLED &&
        o.status !== OrderStatus.RETURNED
    );

    const urgentOrders = activeOrders.filter(o => o.priority.includes('Urgente'));

    return {
        overdue: activeOrders.filter(o => o.deadline < startOfToday),
        dueToday: activeOrders.filter(o => o.deadline >= startOfToday && o.deadline < endOfToday),
        upcoming: activeOrders.filter(o => o.deadline >= endOfToday && o.deadline <= threeDaysFromNow),
        activeCount: activeOrders.length,
        urgentCount: urgentOrders.length
    };
  }, [orders]);

  // Date Logic Helper
  const getDateRange = (filterType: TimeFilter): { start: number, end: number } => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();

    switch (filterType) {
      case 'today': return { start: startOfDay, end: endOfDay };
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return { start: monday.getTime(), end: Date.now() };
      }
      case 'month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: firstDay.getTime(), end: Date.now() };
      }
      case 'year': {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        return { start: firstDayOfYear.getTime(), end: Date.now() };
      }
      case 'custom': {
        const start = new Date(customRange.start).getTime();
        const end = new Date(customRange.end).getTime() + 86399999;
        return { start, end };
      }
      case 'all': default: return { start: 0, end: Date.now() };
    }
  };

  const { filteredClients, filteredOrders } = useMemo(() => {
    const { start, end } = getDateRange(filter);
    return {
      filteredClients: clients.filter(c => c.createdAt >= start && c.createdAt <= end),
      filteredOrders: orders.filter(o => o.createdAt >= start && o.createdAt <= end)
    };
  }, [clients, orders, filter, customRange]);

  const metrics = useMemo(() => {
    const pendingOrders = filteredOrders.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
    const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.READY || o.status === OrderStatus.DELIVERED);
    const pendingValue = pendingOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    return {
      totalClients: filteredClients.length,
      totalOrders: filteredOrders.length,
      pendingCount: pendingOrders.length,
      pendingValue: pendingValue,
      completedCount: completedOrders.length
    };
  }, [filteredClients, filteredOrders]);

  const FilterButton = ({ type, label }: { type: TimeFilter, label: string }) => (
    <button onClick={() => setFilter(type)} className={`px-4 md:px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filter === type ? 'bg-white text-black shadow-lg shadow-white/20 scale-105' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}>{label}</button>
  );

  // Big Bold Stat Card Component with Distinct Colors
  const StatCard = ({ title, value, icon: Icon, cardClass, textClass, subtext }: any) => (
    <div className={`glass-card rounded-[2rem] p-6 md:p-8 relative overflow-hidden group ${cardClass}`}>
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-4">
        <div className="flex justify-between items-start">
           <div className="p-3.5 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
             <Icon size={28} className="text-white" />
           </div>
           {subtext && <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-3 py-1 bg-black/30 rounded-lg text-white/80 border border-white/5">{subtext}</span>}
        </div>
        
        <div>
          <p className="text-slate-200 font-bold text-xs uppercase tracking-[0.2em] mb-2 shadow-black">{title}</p>
          <h3 className={`font-display font-black text-5xl md:text-6xl tracking-tight break-all drop-shadow-lg ${textClass}`}>{value}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-enter pb-20">
      
      {/* 1. Header & Filters */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-2 flex items-center gap-3 tracking-tight">
             <Zap className="text-yellow-400 fill-yellow-400 w-8 h-8 md:w-10 md:h-10"/> 
             DASHBOARD
           </h2>
           <p className="text-slate-400 font-medium text-base">Vista general del rendimiento del taller.</p>
        </div>
        <div className="flex overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 gap-2 p-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md scrollbar-hide">
           <FilterButton type="today" label="Hoy" />
           <FilterButton type="week" label="Semana" />
           <FilterButton type="month" label="Mes" />
           <FilterButton type="all" label="Total" />
        </div>
      </div>

      {/* 2. Operational Highlights (Grid adjustments for mobile) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-3 md:gap-4 border-l-4 border-l-blue-500">
             <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0"><ShoppingBag size={24}/></div>
             <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Activos</p><p className="text-3xl font-black text-white">{operationalMetrics.activeCount}</p></div>
          </div>
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-3 md:gap-4 border-l-4 border-l-orange-500 bg-orange-500/5">
             <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0"><Zap size={24}/></div>
             <div><p className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-0.5">Urgentes</p><p className="text-3xl font-black text-orange-400">{operationalMetrics.urgentCount}</p></div>
          </div>
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-3 md:gap-4 border-l-4 border-l-red-500 bg-red-500/5">
             <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0"><AlertTriangle size={24}/></div>
             <div><p className="text-red-300 text-xs font-bold uppercase tracking-wider mb-0.5">Vencidos</p><p className="text-3xl font-black text-red-500">{operationalMetrics.overdue.length}</p></div>
          </div>
          <div className="glass-card p-5 rounded-3xl flex flex-col md:flex-row items-center md:items-center text-center md:text-left gap-3 md:gap-4 border-l-4 border-l-teal-500">
             <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 shrink-0"><Calendar size={24}/></div>
             <div><p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-0.5">Próximos</p><p className="text-3xl font-black text-white">{operationalMetrics.upcoming.length}</p></div>
          </div>
      </div>

      {/* 3. Main Metrics Grid - Responsive Cols */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <StatCard 
          title="Por Cobrar" 
          value={`$${metrics.pendingValue.toLocaleString()}`} 
          icon={DollarSign} 
          cardClass="card-blue" 
          textClass="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
          subtext="Cartera"
        />
        <StatCard 
          title="Pedidos" 
          value={metrics.totalOrders} 
          icon={ShoppingBag} 
          cardClass="card-pink" 
          textClass="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500"
          subtext={filter === 'all' ? "Histórico" : "Nuevos"}
        />
        <StatCard 
          title="Clientes" 
          value={metrics.totalClients} 
          icon={Users} 
          cardClass="card-orange" 
          textClass="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500"
          subtext="Total"
        />
        <StatCard 
          title="Entregados" 
          value={metrics.completedCount} 
          icon={CheckCircle2} 
          cardClass="card-green" 
          textClass="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500"
          subtext="Finalizados"
        />
      </div>

      {/* 4. Visual Efficiency Bar */}
      <div className="glass-card rounded-[2rem] p-8 border-t border-white/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">Rendimiento</h3>
                <p className="text-slate-400 text-base font-medium">Relación pedidos finalizados vs totales.</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
                <div className="flex items-baseline gap-3 sm:block">
                    <span className="text-5xl font-black text-white">{metrics.totalOrders > 0 ? Math.round((metrics.completedCount / metrics.totalOrders) * 100) : 0}%</span>
                    <p className="text-sm uppercase tracking-widest text-primary-400 font-bold">Eficacia</p>
                </div>
            </div>
        </div>
        
        <div className="h-8 bg-black/40 rounded-full overflow-hidden flex border border-white/5 p-1.5">
            <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_15px_rgba(52,211,153,0.6)] relative transition-all duration-1000" 
                style={{ width: metrics.totalOrders > 0 ? `${(metrics.completedCount / metrics.totalOrders) * 100}%` : '0%' }}
            >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
            </div>
        </div>
      </div>
    </div>
  );
};
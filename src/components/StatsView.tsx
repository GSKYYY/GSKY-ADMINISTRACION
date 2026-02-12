import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Client } from '../types';
import { 
    PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line, ScatterChart, Scatter
} from 'recharts';
import { 
    DollarSign, TrendingUp, TrendingDown, Users, Package, Clock, 
    Filter, Zap, Crown, CheckCircle2, ShoppingBag, Layers,
    Wallet, Ban, Activity, Target, BarChart3, LineChart as LineChartIcon,
    ArrowRightLeft, CalendarCheck, Scissors, ArrowDownRight, ToggleLeft, ToggleRight, 
    Shirt, Printer, Feather, Ruler, AlertOctagon, Scale, Timer, Factory,
    Archive, Box, History, ThumbsUp, ThumbsDown, Gauge, Star, ChefHat, Briefcase, CloudRain, MoveVertical, Tag, Sparkles, Trophy, CreditCard, Coins, PieChart as PieChartIcon, BarChart2, AlertTriangle
} from 'lucide-react';

interface StatsViewProps {
  orders: Order[];
  clients: Client[];
}

type TimeFrame = 'all' | 'year' | 'month' | 'week' | 'today';
type ServiceFilter = 'all' | 'bordado' | 'sublimacion' | 'costura' | 'confeccion';
type TabView = 'financial' | 'production' | 'popular' | 'clients';

const COLORS = {
    primary: '#d946ef',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    dark: '#1f1335',
    grid: 'rgba(255,255,255,0.05)',
    gender: { male: '#3b82f6', female: '#ec4899', kid: '#f59e0b' },
    sizes: ['#8b5cf6', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6'],
    // CRM
    vip: '#d946ef',     // Fuchsia (Champions)
    loyal: '#8b5cf6',   // Violet (Loyal)
    new: '#10b981',     // Emerald (Promising)
    risk: '#f59e0b',    // Amber (At Risk)
    lost: '#64748b',    // Slate (Lost)
    tooltipBg: '#0f0529'
};

const CHART_THEME = {
    backgroundColor: '#0f0529',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: '16px',
    color: '#fff',
    boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
    padding: '10px'
};

// --- HELPER LOGIC ---
const checkCategory = (o: Order, cat: ServiceFilter): boolean => {
    if (cat === 'all') return true;
    
    // Explicit checks
    if (o.garmentModel === 'Otro (Bordado)') return cat === 'bordado';
    if (o.garmentModel === 'Otro (Sublimación)') return cat === 'sublimacion';
    if (o.garmentModel === 'Otro (Costura)') return cat === 'costura';
    if (o.garmentModel === 'Otro (Confección)') return cat === 'confeccion';

    const model = o.garmentModel.toLowerCase();
    
    const safeItems = o.items || [];
    const hasEmbroidery = safeItems.some(i => i.type && i.type.toLowerCase().includes('bordado')) || model.includes('bordado');
    const hasSublimation = safeItems.some(i => i.type && i.type.toLowerCase().includes('sublima')) || model.includes('sublima');
    const hasSewing = safeItems.some(i => i.type && (i.type.toLowerCase().includes('ruedo') || i.type.toLowerCase().includes('costura') || i.type.toLowerCase().includes('ajuste'))) || model.includes('costura');
    
    const isGeneral = !hasEmbroidery && !hasSublimation && !hasSewing;

    if (cat === 'confeccion') return isGeneral;
    if (cat === 'bordado') return hasEmbroidery;
    if (cat === 'sublimacion') return hasSublimation;
    if (cat === 'costura') return hasSewing;
    return false;
};

// Estimation Helpers
const estimateFabric = (itemType: string): number => {
    const t = itemType.toLowerCase();
    if (t.includes('chaqueta')) return 1.5;
    if (t.includes('pantalon') || t.includes('pantalón')) return 1.2;
    if (t.includes('camisa')) return 1.4;
    if (t.includes('franela') || t.includes('polo')) return 1.0;
    if (t.includes('vestido')) return 2.0;
    if (t.includes('gorra')) return 0.3;
    if (t.includes('short')) return 0.6;
    if (t.includes('delantal')) return 0.8;
    return 0.5; // Default avg
};

const estimateThread = (quantity: number): number => {
    return quantity * 250; // Approx 250m per garment on average including overlock
};

// Format Date Range
const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const StatsView: React.FC<StatsViewProps> = ({ orders, clients }) => {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('month');
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [activeTab, setActiveTab] = useState<TabView>('financial');
  const [isComparing, setIsComparing] = useState(false);

  // --- ANALYTICS ENGINE ---
  const { currentStats, prevStats, financialTrend, serviceDistribution, bestDay, ranges, marketStats, newClientsCount, prevNewClientsCount, productionDeepDive, genderCounts, financialDeepDive } = useMemo(() => {
      const now = new Date();
      let start = 0;
      let end = Date.now();
      let prevStart = 0;
      let prevEnd = 0;

      // 1. Determine Date Ranges
      if (timeFrame === 'today') {
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          prevEnd = start - 1;
          prevStart = prevEnd - 86400000;
      } else if (timeFrame === 'week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          start = monday.getTime();
          prevEnd = start - 1;
          prevStart = prevEnd - (7 * 24 * 60 * 60 * 1000);
      } else if (timeFrame === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          prevEnd = start - 1;
          const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          prevStart = prevMonthDate.getTime();
      } else if (timeFrame === 'year') {
          start = new Date(now.getFullYear(), 0, 1).getTime();
          prevEnd = start - 1;
          prevStart = new Date(now.getFullYear() - 1, 0, 1).getTime();
      } else {
          start = new Date(now.getFullYear(), 0, 1).getTime();
          end = Date.now();
          prevEnd = start - 1;
          prevStart = new Date(now.getFullYear() - 1, 0, 1).getTime();
      }

      // 2. Filter Functions
      const filterSet = (s: number, e: number) => orders.filter(o => {
          const inTime = o.createdAt >= s && o.createdAt <= e;
          const inService = checkCategory(o, serviceFilter);
          const notTrash = o.status !== OrderStatus.TRASH;
          return inTime && inService && notTrash;
      });

      const currentSet = filterSet(start, end);
      const prevSet = filterSet(prevStart, prevEnd);

      // 3. Metric Calculator (Standard)
      const calculateMetrics = (dataset: Order[]) => {
          const totalCount = dataset.length;
          const delivered = dataset.filter(o => o.status === OrderStatus.DELIVERED);
          const active = dataset.filter(o => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.RETURNED && o.status !== OrderStatus.READY);
          const ready = dataset.filter(o => o.status === OrderStatus.READY);
          const cancelled = dataset.filter(o => o.status === OrderStatus.CANCELLED);
          const rush = dataset.filter(o => o.priority !== 'Normal');

          const revenueRealized = delivered.reduce((acc, o) => acc + o.totalAmount, 0);
          const revenuePending = active.reduce((acc, o) => acc + o.totalAmount, 0);
          const revenueLost = cancelled.reduce((acc, o) => acc + o.totalAmount, 0);
          const revenueTotalDemand = revenueRealized + revenuePending + revenueLost + ready.reduce((acc, o) => acc + o.totalAmount, 0);
          const revenuePotential = revenueRealized + revenuePending + ready.reduce((acc, o) => acc + o.totalAmount, 0);

          const totalItems = dataset.reduce((sum, o) => sum + (o.items || []).reduce((s, i) => s + i.quantity, 0), 0);
          const avgTicket = totalCount > 0 ? (revenuePotential / totalCount) : 0;
          
          const rushRevenue = rush.reduce((acc, o) => acc + o.totalAmount, 0);

          return {
              totalCount,
              revenueRealized,
              revenuePending,
              revenueLost,
              revenueTotalDemand,
              revenuePotential,
              avgTicket,
              rushRevenue,
              deliveredCount: delivered.length,
              activeCount: active.length,
              readyCount: ready.length,
              cancelledCount: cancelled.length,
              totalItems,
              rushCount: rush.length
          };
      };

      const curr = calculateMetrics(currentSet);
      const prev = calculateMetrics(prevSet);

      // --- 4. ADVANCED PRODUCTION CALCULATOR ---
      const calcProductionDeepDive = (dataset: Order[]) => {
          // ... (Existing Production logic) ...
          const funnel = {
              reception: dataset.filter(o => [OrderStatus.RECEIVED].includes(o.status)).length,
              prep: dataset.filter(o => [OrderStatus.PENDING_CUT, OrderStatus.PENDING_SEW].includes(o.status)).length,
              active: dataset.filter(o => [OrderStatus.CUTTING, OrderStatus.CUT_READY, OrderStatus.SEWING, OrderStatus.SEWN].includes(o.status)).length,
              finishing: dataset.filter(o => [OrderStatus.FINISHING, OrderStatus.QUALITY_CONTROL].includes(o.status)).length,
              completed: dataset.filter(o => [OrderStatus.READY, OrderStatus.DELIVERED].includes(o.status)).length
          };

          let fabricMeters = 0; let subMeters = 0; let threadMeters = 0; let subJobs = 0;

          dataset.forEach(o => {
              const subMatch = o.description.match(/\[Consumo Estimado: (.*?) mts\]/);
              if (subMatch && subMatch[1]) subMeters += parseFloat(subMatch[1]) || 0;

              (o.items || []).forEach(item => {
                  if (checkCategory(o, 'confeccion')) {
                      fabricMeters += estimateFabric(item.type) * item.quantity;
                  }
                  threadMeters += estimateThread(item.quantity);
                  const lowerName = (item.type || o.garmentModel).toLowerCase();
                  if (lowerName.includes('sublima') || lowerName.includes('taza') || lowerName.includes('termo') || lowerName.includes('chapa')) {
                      subJobs += item.quantity;
                  }
              });
          });

          const sizeMap = new Map<string, number>();
          dataset.forEach(o => {
            (o.items || []).forEach(i => {
                const s = i.size.trim().toUpperCase();
                if (s.length < 5 || ['3XL', '2XL', '4XL'].includes(s)) { 
                    sizeMap.set(s, (sizeMap.get(s) || 0) + i.quantity);
                }
            });
          });
          const sizes = Array.from(sizeMap.entries()).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 8);

          const deliveredOrders = dataset.filter(o => o.status === OrderStatus.DELIVERED);
          const returnedOrders = dataset.filter(o => o.status === OrderStatus.RETURNED);
          
          let totalLeadTime = 0; let leadTimeCount = 0;
          deliveredOrders.forEach(o => {
              const start = o.receptionDate || o.createdAt;
              const duration = (o.deadline - start) / (1000 * 60 * 60 * 24);
              if (duration > 0) { totalLeadTime += duration; leadTimeCount++; }
          });
          const avgLeadTime = leadTimeCount > 0 ? (totalLeadTime / leadTimeCount) : 0;
          const activeOrders = dataset.filter(o => ![OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.TRASH].includes(o.status));
          const overdueCount = activeOrders.filter(o => o.deadline < Date.now()).length;
          const qualityRate = dataset.length > 0 ? 100 - ((returnedOrders.length / dataset.length) * 100) : 100;
          
          return { funnel, subMeters, fabricMeters, threadMeters, subJobs, sizes, avgLeadTime, overdueCount, qualityRate, returnCount: returnedOrders.length };
      };

      const prodStats = calcProductionDeepDive(currentSet);
      
      const genderCounts = { male: 0, female: 0, kids: 0 };
          currentSet.filter(o => checkCategory(o, 'confeccion')).forEach(o => {
              (o.items || []).forEach(i => {
                  if (i.gender === 'Caballero') genderCounts.male += i.quantity;
                  if (i.gender === 'Dama') genderCounts.female += i.quantity;
                  if (i.gender === 'Niño' || i.gender === 'Niña') genderCounts.kids += i.quantity;
              });
          });

      // --- FINANCIAL DEEP DIVE ---
      // Revenue Breakdown by Specific Category & Client
      const revByCategory = { garments: 0, embroidery: 0, sublimation: 0, sewing: 0 };
      const revByClient = new Map<string, number>();
      const revByProduct = new Map<string, number>();

      currentSet.forEach(o => {
          if (o.status !== OrderStatus.CANCELLED) {
              const amount = o.totalAmount;
              
              // Client Rev
              revByClient.set(o.clientName, (revByClient.get(o.clientName) || 0) + amount);

              // Category Rev
              if (checkCategory(o, 'confeccion')) revByCategory.garments += amount;
              else if (checkCategory(o, 'bordado')) revByCategory.embroidery += amount;
              else if (checkCategory(o, 'sublimacion')) revByCategory.sublimation += amount;
              else if (checkCategory(o, 'costura')) revByCategory.sewing += amount;

              // Product Rev (Approximate: Attribute order total to the main items)
              // We distribute revenue based on quantity weight if mixed, but usually orders have one main type
              const totalQty = (o.items || []).reduce((a,b)=>a+b.quantity,0);
              const avgPrice = totalQty > 0 ? amount / totalQty : 0;
              
              (o.items || []).forEach(i => {
                  const name = i.type || o.garmentModel;
                  revByProduct.set(name, (revByProduct.get(name) || 0) + (avgPrice * i.quantity));
              });
          }
      });

      const topClients = Array.from(revByClient.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, val]) => ({name, value: val}));
      const topRevenueProducts = Array.from(revByProduct.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, val]) => ({name, value: val}));

      const financialDeepDive = {
          topClients,
          topRevenueProducts,
          revenueBreakdown: [
            { name: 'Confección', value: revByCategory.garments, fill: COLORS.info },
            { name: 'Bordado', value: revByCategory.embroidery, fill: COLORS.secondary },
            { name: 'Sublimación', value: revByCategory.sublimation, fill: COLORS.primary },
            { name: 'Costura', value: revByCategory.sewing, fill: COLORS.success },
          ].filter(i => i.value > 0) // Filter out empty categories
      };

      const getUniqueClients = (dataset: Order[]) => new Set(dataset.map(o => o.clientId)).size;
      const newClientsCount = getUniqueClients(currentSet);
      const prevNewClientsCount = getUniqueClients(prevSet);

      // --- MARKET STATS LOGIC ---
      const productMap = new Map<string, number>();
      const marketBreakdown = {
        jackets: new Map<string, number>(),
        chemises: new Map<string, number>(),
        shirts: new Map<string, number>(),
        pants: new Map<string, number>(),
        aprons: new Map<string, number>(),
        embroidery: new Map<string, number>(),
        sublimationService: new Map<string, number>(), // Meters, prints
        sublimationProduct: new Map<string, number>(), // Mugs, thermos
        sewing: new Map<string, number>(),
        others: new Map<string, number>(),
      };

      currentSet.forEach(o => {
          (o.items || []).forEach(i => {
             const name = i.type || o.garmentModel;
             const qty = i.quantity;
             const lowerName = name.toLowerCase();

             productMap.set(name, (productMap.get(name) || 0) + qty);

             const addToMap = (map: Map<string, number>) => map.set(name, (map.get(name) || 0) + qty);

             if (lowerName.includes('bordado') || lowerName.includes('ponchado') || lowerName.includes('aplique')) {
                 addToMap(marketBreakdown.embroidery);
             } else if (lowerName.includes('sublima')) {
                 if (lowerName.includes('taza') || lowerName.includes('termo') || lowerName.includes('chapa') || lowerName.includes('mousepad') || lowerName.includes('lanyard')) addToMap(marketBreakdown.sublimationProduct);
                 else addToMap(marketBreakdown.sublimationService);
             } else if (lowerName.includes('ruedo') || lowerName.includes('ajuste') || lowerName.includes('costura') || lowerName.includes('cierre') || lowerName.includes('zurcido')) {
                 addToMap(marketBreakdown.sewing);
             } else {
                 if (lowerName.includes('chaqueta') || lowerName.includes('cortaviento') || lowerName.includes('sueter') || lowerName.includes('hoodie')) addToMap(marketBreakdown.jackets);
                 else if (lowerName.includes('chemise') || lowerName.includes('polo')) addToMap(marketBreakdown.chemises);
                 else if (lowerName.includes('camisa') || lowerName.includes('columbia')) addToMap(marketBreakdown.shirts);
                 else if (lowerName.includes('pantalón') || lowerName.includes('pantalon') || lowerName.includes('jean') || lowerName.includes('cargo')) addToMap(marketBreakdown.pants);
                 else if (lowerName.includes('delantal')) addToMap(marketBreakdown.aprons);
                 else addToMap(marketBreakdown.others);
             }
          });
      });

      const toSortedArray = (map: Map<string, number>) => Array.from(map.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({name, value}));

      const marketStats = {
          jackets: toSortedArray(marketBreakdown.jackets),
          chemises: toSortedArray(marketBreakdown.chemises),
          shirts: toSortedArray(marketBreakdown.shirts),
          pants: toSortedArray(marketBreakdown.pants),
          aprons: toSortedArray(marketBreakdown.aprons),
          embroidery: toSortedArray(marketBreakdown.embroidery),
          sublimationService: toSortedArray(marketBreakdown.sublimationService),
          sublimationProduct: toSortedArray(marketBreakdown.sublimationProduct),
          sewing: toSortedArray(marketBreakdown.sewing),
          others: toSortedArray(marketBreakdown.others),
          topOverall: Array.from(productMap.entries()).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }))
      };

      const timeMap = new Map<string, number>();
      const dayOfWeekMap = new Map<string, number>();

      currentSet.forEach(o => {
          if (o.status !== OrderStatus.CANCELLED) {
            const date = new Date(o.createdAt);
            let key = date.toLocaleDateString();
            if (timeFrame === 'year') key = date.toLocaleDateString(undefined, { month: 'short' });
            if (timeFrame === 'today') key = `${date.getHours()}:00`;
            timeMap.set(key, (timeMap.get(key) || 0) + o.totalAmount);
            
            const dayName = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][date.getDay()];
            dayOfWeekMap.set(dayName, (dayOfWeekMap.get(dayName) || 0) + o.totalAmount);
          }
      });

      const financialTrend = Array.from(timeMap.entries()).map(([name, value]) => ({ name, value }));
      
      let maxDayVal = 0;
      let bestDayName = '-';
      dayOfWeekMap.forEach((val, key) => { if (val > maxDayVal) { maxDayVal = val; bestDayName = key; } });

      const serviceRev = {
          embroidery: currentSet.filter(o => checkCategory(o, 'bordado')).reduce((a,b)=>a+b.totalAmount,0),
          sublimation: currentSet.filter(o => checkCategory(o, 'sublimacion')).reduce((a,b)=>a+b.totalAmount,0),
          sewing: currentSet.filter(o => checkCategory(o, 'costura')).reduce((a,b)=>a+b.totalAmount,0),
          general: currentSet.filter(o => checkCategory(o, 'confeccion')).reduce((a,b)=>a+b.totalAmount,0),
      };
      
      const serviceDistribution = [
          { name: 'Bordado', value: serviceRev.embroidery, color: COLORS.secondary },
          { name: 'Sublimación', value: serviceRev.sublimation, color: COLORS.primary },
          { name: 'Costura', value: serviceRev.sewing, color: COLORS.success },
          { name: 'Confección', value: serviceRev.general, color: COLORS.info },
      ].filter(i => i.value > 0);

      return { 
          currentStats: curr, 
          prevStats: prev, 
          financialTrend, 
          serviceDistribution, 
          bestDay: bestDayName,
          marketStats,
          newClientsCount,
          prevNewClientsCount,
          productionDeepDive: prodStats,
          genderCounts,
          financialDeepDive,
          ranges: { 
              current: `${formatDate(start)} - ${formatDate(end)}`, 
              prev: `${formatDate(prevStart)} - ${formatDate(prevEnd)}` 
          }
      };
  }, [orders, timeFrame, serviceFilter]);

  // --- CRM ANALYTICS ENGINE (StatsView Extension) ---
  const crmAnalytics = useMemo(() => {
      // Logic duplicated from previous ClientsView for CRM analysis
      const getClientStats = (clientId: string) => {
          const clientOrders = orders.filter(o => o.clientId === clientId && o.status !== OrderStatus.CANCELLED);
          const totalSpent = clientOrders.reduce((acc, o) => acc + o.totalAmount, 0);
          const orderCount = clientOrders.length;
          const lastOrderDate = clientOrders.length > 0 ? Math.max(...clientOrders.map(o => o.createdAt)) : null;
          
          const now = Date.now();
          const daysSinceLastOrder = lastOrderDate ? (now - lastOrderDate) / (1000 * 60 * 60 * 24) : 999;
          
          let segment = 'Prometedor';
          if (totalSpent > 1000 || orderCount >= 10) segment = 'Champion';
          else if (orderCount >= 3 && daysSinceLastOrder < 90) segment = 'Leal';
          else if (daysSinceLastOrder > 90 && orderCount > 0) segment = 'En Riesgo';
          else if (daysSinceLastOrder > 180 && orderCount > 0) segment = 'Inactivo';
          else if (orderCount === 0) segment = 'Prometedor'; 

          return { totalSpent, orderCount, lastOrderDate, segment };
      };

      const segments: any = { Champion: 0, Leal: 0, Prometedor: 0, 'En Riesgo': 0, Inactivo: 0 };
      const scatterData: any[] = [];
      const topSpenders: any[] = [];
      const months: Record<string, number> = {};
      
      // Init months
      for(let i=5; i>=0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleDateString('es-ES', { month: 'short' });
          months[key] = 0;
      }

      clients.forEach(client => {
          const stats = getClientStats(client.id);
          if (segments[stats.segment] !== undefined) segments[stats.segment]++;
          
          if(stats.orderCount > 0) {
              scatterData.push({
                  name: client.businessName || client.name,
                  x: stats.orderCount,
                  y: stats.totalSpent,
                  z: 1,
                  segment: stats.segment
              });
          }

          if(stats.totalSpent > 0) {
              topSpenders.push({
                  id: client.id,
                  name: client.businessName || client.name,
                  spent: stats.totalSpent,
                  orders: stats.orderCount
              });
          }

          const diffTime = Math.abs(Date.now() - client.createdAt);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if(diffDays <= 180) {
               const key = new Date(client.createdAt).toLocaleDateString('es-ES', { month: 'short' });
               if(months[key] !== undefined) months[key]++;
          }
      });

      const acquisitionChart = Object.entries(months).map(([name, count]) => ({ name, count }));
      const segmentationChart = [
          { name: 'Champions', value: segments['Champion'], color: COLORS.vip },
          { name: 'Leales', value: segments['Leal'], color: COLORS.loyal },
          { name: 'Nuevos/Leads', value: segments['Prometedor'], color: COLORS.new },
          { name: 'En Riesgo', value: segments['En Riesgo'], color: COLORS.risk },
          { name: 'Inactivos', value: segments['Inactivo'], color: COLORS.lost },
      ].filter(i => i.value > 0);

      const clientsWithOrders = clients.filter(c => getClientStats(c.id).orderCount > 0).length;
      const returningClients = clients.filter(c => getClientStats(c.id).orderCount > 1).length;
      const retentionRate = clientsWithOrders > 0 ? (returningClients / clientsWithOrders) * 100 : 0;

      topSpenders.sort((a,b) => b.spent - a.spent);

      return {
          segmentationChart,
          acquisitionChart,
          scatterData,
          topSpenders: topSpenders.slice(0, 5),
          retentionRate,
          totalClients: clients.length,
          activeClients: segments['Champion'] + segments['Leal'] + segments['Prometedor']
      };
  }, [clients, orders]);


  // --- SUB-COMPONENTS ---
  const ComparisonBadge = () => (
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] md:text-xs animate-enter">
          <CalendarCheck size={14} className="text-primary-400"/>
          <span className="text-slate-300">Periodo: <strong className="text-white">{ranges.current}</strong></span>
          <ArrowRightLeft size={12} className="text-slate-500 mx-1"/>
          <span className="text-slate-400">vs <strong className="text-slate-300">{ranges.prev}</strong></span>
      </div>
  );
  
  const MetricCard = ({ title, value, sub, icon: Icon, color, isCurrency = true, comparisonValue, inverseTrend = false, suffix='', showComparison = false }: any) => {
      let trendPerc = 0;
      let trendDir = 'flat'; 
      let diffVal = 0;

      if (showComparison && comparisonValue !== undefined) {
          diffVal = value - comparisonValue;
          if (comparisonValue !== 0) trendPerc = ((diffVal) / comparisonValue) * 100;
          else if (value > 0) trendPerc = 100;

          if (trendPerc > 0) trendDir = 'up';
          if (trendPerc < 0) trendDir = 'down';
      }

      const isPositive = inverseTrend ? trendDir === 'down' : trendDir === 'up';
      const trendColor = trendDir === 'flat' ? 'text-slate-500 bg-slate-500/10' : (isPositive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20');
      const TrendIcon = trendDir === 'up' ? TrendingUp : (trendDir === 'down' ? TrendingDown : ArrowRightLeft);

      return (
        <div className="glass-card p-6 rounded-[1.5rem] relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-2xl">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-${color}-500/10 transition-colors duration-700`}></div>
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl bg-${color}-500/20 text-${color}-400 shadow-inner ring-1 ring-${color}-500/20`}><Icon size={24}/></div>
                    {showComparison && timeFrame !== 'all' && (
                        <div className={`flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border ${trendColor}`}>
                            <TrendIcon size={12}/> {Math.abs(trendPerc).toFixed(1)}%
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">{title}</p>
                    <h3 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
                        {isCurrency ? '$' : ''}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                    </h3>
                    
                    {showComparison && comparisonValue !== undefined && timeFrame !== 'all' ? (
                         <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 animate-enter">
                            <span className={`text-[10px] font-bold ${diffVal > 0 ? 'text-emerald-400' : diffVal < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                                {diffVal > 0 ? '+' : ''}{isCurrency ? '$' : ''}{diffVal.toLocaleString()}{suffix}
                            </span>
                            <p className="text-[10px] text-slate-500 font-medium truncate ml-auto">vs periodo anterior</p>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 mt-2 font-medium border-t border-white/5 pt-2 flex items-center gap-2">
                            {sub}
                        </p>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const SectionHeader = ({ title, icon: Icon, subtitle }: any) => (
      <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-gradient-to-b from-primary-500 to-purple-600 rounded-full"></div>
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Icon size={22} className="text-primary-400"/> {title}
            </h3>
          </div>
          {subtitle && <p className="text-sm text-slate-500 ml-5 mt-1">{subtitle}</p>}
      </div>
  );

  const StatBar = ({ label, value, max, color = 'bg-primary-500' }: any) => (
      <div className="mb-3">
          <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</span>
              <span className="text-white font-black">{value}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${color}`} style={{width: `${max > 0 ? (value/max)*100 : 0}%`}}></div>
          </div>
      </div>
  );

  const TopListCard = ({ title, data, icon: Icon, colorClass, emptyText, isCurrency=false }: any) => (
      <div className={`glass-card p-6 rounded-[2rem] border-l-4 ${colorClass} h-full`}>
          <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white/5 rounded-xl"><Icon size={20} className="text-white"/></div>
              <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">{title}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Top 5</p>
              </div>
          </div>
          <div className="space-y-3">
              {data.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-black ${idx === 0 ? 'bg-yellow-400' : 'bg-white/80'}`}>
                          {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm truncate">{item.name}</p>
                      </div>
                      <span className="text-xs font-black text-white bg-black/20 px-2 py-1 rounded">{isCurrency ? '$' : ''}{item.value.toLocaleString()}</span>
                  </div>
              ))}
              {data.length === 0 && (
                  <div className="py-8 text-center opacity-50">
                      <Star size={24} className="mx-auto mb-2"/>
                      <p className="text-xs">{emptyText}</p>
                  </div>
              )}
          </div>
      </div>
  );

  if (!currentStats) return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-500 glass-card rounded-3xl m-4">
          <Activity size={48} className="mb-4 opacity-50 text-primary-500"/>
          <h3 className="text-xl font-bold text-white">Sin datos suficientes</h3>
          <p className="text-sm">Intenta ampliar el rango de fechas.</p>
      </div>
  );

  const daysInPeriod = timeFrame === 'week' ? 7 : timeFrame === 'month' ? 30 : timeFrame === 'today' ? 1 : 365;
  const avgDailyRevenue = currentStats.revenuePotential / daysInPeriod;
  const prevAvgDailyRevenue = prevStats.revenuePotential / daysInPeriod;

  // Revenue for Donut Center
  const totalRevenue = financialDeepDive.revenueBreakdown.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-8 animate-enter pb-24 h-full">
        
        {/* TOP CONTROL BAR */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-[#0f0529]/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
            <div>
                <h2 className="text-3xl font-display font-black text-white mb-1 flex items-center gap-3">
                    <BarChart3 className="text-primary-400" size={32}/> 
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">INTELIGENCIA</span>
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 md:ml-11">Centro de Análisis & Métricas</p>
                    {isComparing && timeFrame !== 'all' && <ComparisonBadge/>}
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center">
                {/* COMPARISON TOGGLE */}
                {timeFrame !== 'all' && (
                    <button 
                        onClick={() => setIsComparing(!isComparing)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${isComparing ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
                    >
                        {isComparing ? <ToggleRight size={20} className="text-indigo-400"/> : <ToggleLeft size={20}/>}
                        Comparar
                    </button>
                )}

                <div className="flex bg-black/40 rounded-2xl p-1.5 border border-white/10 self-start sm:self-auto overflow-x-auto max-w-full">
                    {['today', 'week', 'month', 'year', 'all'].map((t) => (
                        <button key={t} onClick={() => setTimeFrame(t as TimeFrame)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${timeFrame === t ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                            {t === 'today' ? 'Hoy' : t === 'week' ? '7 Días' : t === 'month' ? 'Mes' : t === 'year' ? 'Año' : 'Global'}
                        </button>
                    ))}
                </div>
                
                <div className="relative group min-w-[180px]">
                    <select 
                        value={serviceFilter} 
                        onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
                        className="w-full appearance-none bg-black/40 border border-white/10 text-white font-bold uppercase text-xs px-5 py-4 rounded-2xl focus:outline-none focus:border-primary-500 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <option value="all">Todo el Taller</option>
                        <option value="bordado">Solo Bordado</option>
                        <option value="sublimacion">Solo Sublimación</option>
                        <option value="costura">Solo Costura</option>
                        <option value="confeccion">Solo Confección</option>
                    </select>
                    <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400 pointer-events-none"/>
                </div>
            </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5 px-2">
            {[
                { id: 'financial', label: 'Económico', icon: DollarSign },
                { id: 'popular', label: 'Mercado', icon: Crown },
                { id: 'production', label: 'Producción', icon: Factory },
                { id: 'clients', label: 'Clientes (CRM)', icon: Users },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabView)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-2xl border-b-2 transition-all text-sm font-bold uppercase tracking-wide whitespace-nowrap ${activeTab === tab.id ? 'border-primary-500 text-white bg-white/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                    <tab.icon size={16} /> {tab.label}
                </button>
            ))}
        </div>

        {/* --- TAB CONTENT: FINANCIAL (REMASTERED) --- */}
        {activeTab === 'financial' && (
            <div className="space-y-8 animate-enter">
                
                {/* 1. HERO FINANCIAL METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <MetricCard showComparison={isComparing} title="Facturación Total" value={currentStats.revenuePotential} comparisonValue={prevStats.revenuePotential} sub="Volumen Bruto" icon={Wallet} color="blue"/>
                    <MetricCard showComparison={isComparing} title="Ticket Promedio" value={Math.round(currentStats.avgTicket)} comparisonValue={Math.round(prevStats.avgTicket)} sub="Por Pedido" icon={ShoppingBag} color="purple"/>
                    <MetricCard showComparison={isComparing} title="Ingreso Real (Cobrado)" value={currentStats.revenueRealized} comparisonValue={prevStats.revenueRealized} sub="Cash Flow" icon={Coins} color="emerald"/>
                    <MetricCard showComparison={isComparing} title="Costo Oportunidad" value={currentStats.revenueLost} comparisonValue={prevStats.revenueLost} sub="Cancelados" icon={Ban} color="danger" inverseTrend/>
                </div>

                {/* 2. MAIN FINANCIAL CHARTS (Side-by-Side) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Revenue Trend Over Time */}
                    <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-6">
                             <SectionHeader title="Tendencia de Ventas" icon={LineChartIcon} subtitle="Evolución financiera en el tiempo seleccionado" />
                             <div className="text-right">
                                 <p className="text-xs font-bold uppercase text-slate-500">Diario Promedio</p>
                                 <p className="text-2xl font-black text-white">${Math.round(avgDailyRevenue).toLocaleString()}</p>
                             </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={financialTrend}>
                                    <defs>
                                        <linearGradient id="colorMoney" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.success} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false}/>
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickMargin={15}/>
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`}/>
                                    <Tooltip contentStyle={CHART_THEME} formatter={(val: number) => [`$${val.toLocaleString()}`, 'Ingreso']} cursor={{stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2}}/>
                                    <Area type="monotone" dataKey="value" stroke={COLORS.success} strokeWidth={4} fillOpacity={1} fill="url(#colorMoney)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right: Revenue Mix by Category (REFACTORED for Better Proportions) */}
                    <div className="glass-card p-8 rounded-[2.5rem] flex flex-col h-full">
                        <SectionHeader title="Mix de Rentabilidad" icon={PieChartIcon} subtitle="Distribución porcentual"/>
                        
                        <div className="flex-1 flex flex-col justify-center">
                            {/* Donut Chart */}
                            <div className="relative h-64 w-full mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={financialDeepDive.revenueBreakdown} 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={65} 
                                            outerRadius={85} 
                                            paddingAngle={5} 
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {financialDeepDive.revenueBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={CHART_THEME} formatter={(val: number) => `$${val.toLocaleString()}`}/>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total</span>
                                    <span className="text-xl font-black text-white">${totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Detailed Breakdown List */}
                            <div className="space-y-3">
                                {financialDeepDive.revenueBreakdown.map((item, idx) => {
                                    const percent = totalRevenue > 0 ? (item.value / totalRevenue) * 100 : 0;
                                    return (
                                        <div key={idx} className="flex flex-col gap-1">
                                            <div className="flex justify-between items-end text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.fill}}></div>
                                                    <span className="font-bold text-slate-300">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-white block">${item.value.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex items-center">
                                                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: item.fill }}></div>
                                            </div>
                                            <div className="text-right text-[10px] font-bold text-slate-500">{percent.toFixed(1)}%</div>
                                        </div>
                                    )
                                })}
                                {financialDeepDive.revenueBreakdown.length === 0 && (
                                    <div className="text-center py-8 text-slate-500 text-xs">Sin datos financieros para mostrar.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. TOP RANKINGS (Money Makers) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TopListCard 
                        title="Top Clientes (Facturación)" 
                        data={financialDeepDive.topClients} 
                        icon={Trophy} 
                        colorClass="border-l-yellow-500"
                        emptyText="Sin datos financieros"
                        isCurrency={true}
                    />
                    <TopListCard 
                        title="Top Productos (Ingresos)" 
                        data={financialDeepDive.topRevenueProducts} 
                        icon={CreditCard} 
                        colorClass="border-l-cyan-500"
                        emptyText="Sin datos de productos"
                        isCurrency={true}
                    />
                </div>

            </div>
        )}

        {/* --- TAB CONTENT: PRODUCTION (DEEP DIVE) --- */}
        {activeTab === 'production' && (
            <div className="space-y-8 animate-enter">
                
                {/* 1. KPI CLUSTER */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard showComparison={isComparing} title="Volumen Total" value={currentStats.totalItems} comparisonValue={prevStats.totalItems} sub="Piezas manufacturadas" icon={Layers} color="info" isCurrency={false} suffix=" pzs"/>
                    <MetricCard showComparison={isComparing} title="Pedidos Activos" value={currentStats.activeCount} comparisonValue={prevStats.activeCount} sub="En proceso actual" icon={Factory} color="purple" isCurrency={false}/>
                    <MetricCard showComparison={isComparing} title="Tasa Completado" value={currentStats.totalCount > 0 ? Math.round(((currentStats.deliveredCount + currentStats.readyCount) / currentStats.totalCount) * 100) : 0} comparisonValue={prevStats.totalCount > 0 ? Math.round(((prevStats.deliveredCount + prevStats.readyCount) / prevStats.totalCount) * 100) : 0} sub="Eficacia general" icon={Target} color="emerald" isCurrency={false} suffix="%"/>
                    <MetricCard showComparison={isComparing} title="Urgencias" value={currentStats.rushCount} comparisonValue={prevStats.rushCount} sub="Pedidos prioritarios" icon={Zap} color="warning" isCurrency={false} inverseTrend/>
                </div>

                {/* 2. PRODUCTION METRICS DETAILED (Velocity, Reliability, Quality) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-blue-500">
                        <div className="flex items-center gap-3 mb-4"><Timer className="text-blue-400" size={24}/><h4 className="text-sm font-black text-white uppercase tracking-wider">Velocidad / Ciclo</h4></div>
                        <p className="text-4xl font-black text-white mb-1">{productionDeepDive.avgLeadTime.toFixed(1)} <span className="text-sm text-slate-400 font-bold uppercase">Días</span></p>
                        <p className="text-xs text-slate-500 font-medium">Tiempo promedio de entrega (estimado)</p>
                    </div>
                    <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-emerald-500">
                        <div className="flex items-center gap-3 mb-4"><ThumbsUp className="text-emerald-400" size={24}/><h4 className="text-sm font-black text-white uppercase tracking-wider">Calidad</h4></div>
                        <p className="text-4xl font-black text-white mb-1">{productionDeepDive.qualityRate.toFixed(1)}<span className="text-sm text-slate-400 font-bold uppercase">%</span></p>
                        <p className="text-xs text-slate-500 font-medium">Tasa de aceptación (Sin devoluciones)</p>
                    </div>
                    <div className="glass-card p-6 rounded-[2rem] border-l-4 border-l-red-500">
                         <div className="flex items-center gap-3 mb-4"><AlertOctagon className="text-red-400" size={24}/><h4 className="text-sm font-black text-white uppercase tracking-wider">Riesgo / Retraso</h4></div>
                         <p className="text-4xl font-black text-white mb-1">{productionDeepDive.overdueCount}</p>
                         <p className="text-xs text-slate-500 font-medium">Pedidos actualmente vencidos</p>
                    </div>
                </div>

                {/* 3. FUNNEL VISUALIZATION */}
                <div className="glass-card p-8 rounded-[2.5rem]">
                     <SectionHeader title="Flujo de Trabajo (Funnel)" icon={Scale} subtitle="Distribución de carga por etapa operativa"/>
                     <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                        {[
                            { label: 'Recepción', val: productionDeepDive.funnel.reception, color: 'bg-slate-600', icon: Box },
                            { label: 'Preparación', val: productionDeepDive.funnel.prep, color: 'bg-blue-600', icon: Scissors },
                            { label: 'Producción', val: productionDeepDive.funnel.active, color: 'bg-indigo-600', icon: Factory },
                            { label: 'Acabados', val: productionDeepDive.funnel.finishing, color: 'bg-purple-600', icon: CheckCircle2 },
                            { label: 'Finalizado', val: productionDeepDive.funnel.completed, color: 'bg-emerald-600', icon: Archive },
                        ].map((stage, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/5 p-6 rounded-3xl flex flex-col items-center justify-center text-center relative group overflow-hidden hover:bg-white/10 transition-colors">
                                <div className={`absolute top-0 left-0 right-0 h-1.5 ${stage.color}`}></div>
                                <stage.icon size={24} className="text-slate-400 mb-3 group-hover:text-white transition-colors"/>
                                <span className="text-4xl font-black text-white mb-1 group-hover:scale-110 transition-transform block">{stage.val}</span>
                                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">{stage.label}</span>
                            </div>
                        ))}
                     </div>
                </div>

                {/* 4. RESOURCE INTELLIGENCE (Material & Inventory) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Size Distribution Chart */}
                    <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem]">
                        <SectionHeader title="Mapa de Calor de Tallas" icon={Ruler} subtitle="Distribución de tallas manufacturadas"/>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productionDeepDive.sizes}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false}/>
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                                    <Tooltip cursor={{fill: 'white', opacity: 0.05}} contentStyle={CHART_THEME} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {productionDeepDive.sizes.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS.sizes[index % COLORS.sizes.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Material Consumption Estimator */}
                    <div className="glass-card p-8 rounded-[2.5rem] flex flex-col justify-center bg-gradient-to-br from-white/5 to-transparent">
                        <SectionHeader title="Consumo Materiales" icon={Package} subtitle="Estimación automática"/>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400"><Scissors size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Tela (Aprox)</p>
                                    <p className="text-2xl font-black text-white">{Math.round(productionDeepDive.fabricMeters)} <span className="text-sm font-bold text-slate-500">mts</span></p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-cyan-500/20 rounded-xl text-cyan-400"><Activity size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Hilo (Aprox)</p>
                                    <p className="text-2xl font-black text-white">{Math.round(productionDeepDive.threadMeters / 1000)} <span className="text-sm font-bold text-slate-500">km</span></p>
                                </div>
                            </div>
                            <div className="w-full h-px bg-white/10"></div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400"><Printer size={24}/></div>
                                <div>
                                    <p className="text-xs font-bold uppercase text-slate-500">Papel Sublimación</p>
                                    <p className="text-2xl font-black text-white">{productionDeepDive.subMeters.toFixed(1)} <span className="text-sm font-bold text-slate-500">mts</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. DEMOGRAPHICS & SERVICES (Existing logic refined) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="glass-card p-8 rounded-[2.5rem] border-l-4 border-l-blue-500">
                        <SectionHeader title="Demografía de Uniformes" icon={Users} subtitle="Segmentación por género"/>
                        <div className="flex items-center gap-8">
                            <div className="flex-1 space-y-4">
                                <StatBar label="Caballeros" value={genderCounts.male} max={currentStats.totalItems} color="bg-blue-500"/>
                                <StatBar label="Damas" value={genderCounts.female} max={currentStats.totalItems} color="bg-pink-500"/>
                                <StatBar label="Infantil" value={genderCounts.kids} max={currentStats.totalItems} color="bg-amber-500"/>
                            </div>
                            <div className="w-32 h-32 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={[
                                            {name:'M', value:genderCounts.male},
                                            {name:'F', value:genderCounts.female},
                                            {name:'K', value:genderCounts.kids}
                                        ]} innerRadius={25} outerRadius={40} dataKey="value" stroke="none">
                                            <Cell fill={COLORS.gender.male}/><Cell fill={COLORS.gender.female}/><Cell fill={COLORS.gender.kid}/>
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-[2.5rem] border-l-4 border-l-indigo-500">
                        <SectionHeader title="Volumen de Personalización" icon={Feather} subtitle="Carga de trabajo por tipo"/>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 text-center">
                                 <span className="block text-3xl font-black text-white mb-1">{productionDeepDive.subJobs}</span>
                                 <span className="text-[10px] uppercase font-bold text-indigo-300">Jobs Sublimación</span>
                             </div>
                             <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20 text-center">
                                 <span className="block text-3xl font-black text-white mb-1">{currentStats.totalItems}</span>
                                 <span className="text-[10px] uppercase font-bold text-purple-300">Piezas Totales</span>
                             </div>
                        </div>
                    </div>
                </div>

            </div>
        )}

        {/* --- TAB CONTENT: POPULAR / MARKET (SEGMENTED) --- */}
        {(activeTab === 'popular') && (
            <div className="space-y-8 animate-enter">
                
                {/* 1. Header Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <MetricCard showComparison={isComparing} title="Producto Estrella" value={marketStats.topOverall[0]?.name || '-'} comparisonValue={0} sub={`Top 1 en ventas (${marketStats.topOverall[0]?.value || 0})`} icon={Crown} color="yellow" isCurrency={false}/>
                     <MetricCard showComparison={isComparing} title="Diversidad" value={marketStats.jackets.length + marketStats.chemises.length + marketStats.shirts.length + marketStats.pants.length + marketStats.aprons.length} comparisonValue={0} sub="Items únicos vendidos" icon={Package} color="emerald" isCurrency={false}/>
                </div>

                {/* 2. SERVICES SECTION */}
                <div className="space-y-4">
                     <h3 className="text-xl font-display font-bold text-white flex items-center gap-2 px-2"><Sparkles className="text-primary-400"/> SERVICIOS DE PERSONALIZACIÓN</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        <TopListCard 
                            title="Bordados" 
                            data={marketStats.embroidery} 
                            icon={Feather} 
                            colorClass="border-l-indigo-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Serv. Sublimación" 
                            data={marketStats.sublimationService} 
                            icon={Printer} 
                            colorClass="border-l-pink-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Prod. Sublimados" 
                            data={marketStats.sublimationProduct} 
                            icon={Package} 
                            colorClass="border-l-pink-400"
                            emptyText="Sin datos"
                        />
                         <TopListCard 
                            title="Costura y Arreglos" 
                            data={marketStats.sewing} 
                            icon={Scissors} 
                            colorClass="border-l-emerald-500"
                            emptyText="Sin datos"
                        />
                    </div>
                </div>

                {/* 3. GARMENTS SECTION */}
                 <div className="space-y-4">
                     <h3 className="text-xl font-display font-bold text-white flex items-center gap-2 px-2"><Shirt className="text-blue-400"/> LÍNEA DE CONFECCIÓN</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                        <TopListCard 
                            title="Chaquetas / Hoodies" 
                            data={marketStats.jackets} 
                            icon={CloudRain} 
                            colorClass="border-l-cyan-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Chemises / Polos" 
                            data={marketStats.chemises} 
                            icon={Shirt} 
                            colorClass="border-l-blue-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Camisas / Columbia" 
                            data={marketStats.shirts} 
                            icon={Briefcase} 
                            colorClass="border-l-violet-500"
                            emptyText="Sin datos"
                        />
                         <TopListCard 
                            title="Pantalones / Jeans" 
                            data={marketStats.pants} 
                            icon={MoveVertical} 
                            colorClass="border-l-slate-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Delantales" 
                            data={marketStats.aprons} 
                            icon={ChefHat} 
                            colorClass="border-l-orange-500"
                            emptyText="Sin datos"
                        />
                        <TopListCard 
                            title="Otros / Varios" 
                            data={marketStats.others} 
                            icon={Tag} 
                            colorClass="border-l-gray-500"
                            emptyText="Sin datos"
                        />
                    </div>
                </div>

            </div>
        )}

        {/* --- TAB CONTENT: CLIENTS (CRM ANALYTICS DASHBOARD) --- */}
        {activeTab === 'clients' && (
             <div className="space-y-6 animate-enter">
                {/* Top KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-emerald-400 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><TrendingUp size={24}/></div>
                        <div><p className="text-xs uppercase font-bold text-slate-500">Tasa de Retención</p><p className="text-2xl font-black text-white">{crmAnalytics.retentionRate.toFixed(1)}%</p></div>
                    </div>
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-fuchsia-400 flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-500/10 rounded-xl text-fuchsia-400"><Crown size={24}/></div>
                        <div><p className="text-xs uppercase font-bold text-slate-500">Clientes VIP</p><p className="text-2xl font-black text-white">{crmAnalytics.segmentationChart.find(s => s.name === 'Champions')?.value || 0}</p></div>
                    </div>
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-blue-400 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Users size={24}/></div>
                        <div><p className="text-xs uppercase font-bold text-slate-500">Total Base</p><p className="text-2xl font-black text-white">{crmAnalytics.totalClients}</p></div>
                    </div>
                    <div className="glass-card p-5 rounded-2xl border-l-4 border-l-amber-400 flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><AlertTriangle size={24}/></div>
                        <div><p className="text-xs uppercase font-bold text-slate-500">En Riesgo</p><p className="text-2xl font-black text-white">{crmAnalytics.segmentationChart.find(s => s.name === 'En Riesgo')?.value || 0}</p></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Segmentation Pie */}
                    <div className="glass-card p-6 rounded-[2rem] flex flex-col">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><PieChartIcon size={18} className="text-primary-400"/> Segmentación RFM</h3>
                            <p className="text-xs text-slate-400">Distribución de clientes por comportamiento.</p>
                        </div>
                        <div className="flex-1 min-h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={crmAnalytics.segmentationChart} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                        {crmAnalytics.segmentationChart.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: COLORS.tooltipBg, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#fff' }} formatter={(val: number) => [val, 'Clientes']}/>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <span className="text-2xl font-black text-white">{crmAnalytics.activeClients}</span>
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Activos</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            {crmAnalytics.segmentationChart.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                                    {s.name} ({s.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Acquisition Bar */}
                    <div className="lg:col-span-2 glass-card p-6 rounded-[2rem]">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart2 size={18} className="text-emerald-400"/> Adquisición de Clientes</h3>
                                <p className="text-xs text-slate-400">Nuevos registros en los últimos 6 meses.</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={crmAnalytics.acquisitionChart}>
                                    <defs>
                                        <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={COLORS.new} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={COLORS.new} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false}/>
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false}/>
                                    <Tooltip cursor={{stroke: 'rgba(255,255,255,0.1)'}} contentStyle={{ backgroundColor: COLORS.tooltipBg, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#fff' }}/>
                                    <Area type="monotone" dataKey="count" stroke={COLORS.new} strokeWidth={3} fillOpacity={1} fill="url(#colorAcq)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LTV Ranking */}
                    <div className="glass-card p-6 rounded-[2rem]">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6"><DollarSign size={18} className="text-yellow-400"/> Top LTV (Lifetime Value)</h3>
                        <div className="space-y-4">
                            {crmAnalytics.topSpenders.map((client, idx) => (
                                <div key={client.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm text-black ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-orange-300' : 'bg-white/10 text-white'}`}>
                                         {idx + 1}
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <p className="font-bold text-white text-sm truncate">{client.name}</p>
                                         <p className="text-xs text-slate-500">{client.orders} Pedidos</p>
                                     </div>
                                     <div className="text-right">
                                         <span className="font-black text-emerald-400">${client.spent.toLocaleString()}</span>
                                     </div>
                                </div>
                            ))}
                            {crmAnalytics.topSpenders.length === 0 && <div className="text-center text-xs text-slate-500 py-4">Sin datos suficientes</div>}
                        </div>
                    </div>

                    {/* Order Frecuency vs Value Scatter */}
                    <div className="glass-card p-6 rounded-[2rem]">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2"><Activity size={18} className="text-blue-400"/> Mapa de Valor</h3>
                         <p className="text-xs text-slate-400 mb-6">Relación entre Frecuencia (Eje X) y Gasto Total (Eje Y).</p>
                         <div className="h-64">
                             <ResponsiveContainer width="100%" height="100%">
                                 <ScatterChart margin={{top: 20, right: 20, bottom: 20, left: 0}}>
                                     <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                                     <XAxis type="number" dataKey="x" name="Pedidos" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                     <YAxis type="number" dataKey="y" name="Gasto" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`}/>
                                     <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: COLORS.tooltipBg, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} itemStyle={{ color: '#fff' }} formatter={(val:number, name:string) => [name === 'Pedidos' ? val : `$${val}`, name]}/>
                                     <Scatter name="Clientes" data={crmAnalytics.scatterData} fill={COLORS.loyal} />
                                 </ScatterChart>
                             </ResponsiveContainer>
                         </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};
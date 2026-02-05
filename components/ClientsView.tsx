
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Order, OrderStatus } from '../types';
import { Search, Plus, Phone, Mail, MapPin, Edit2, Trash2, X, Users, Filter, ChevronDown, ChevronUp, Clock, ArrowUpRight, Building2, User, Ruler, History, DollarSign, Calendar, Save, ShoppingBag, Star, TrendingUp, Crown, UserPlus, Shirt } from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  orders: Order[]; // New prop for history calculation
  onAddClient: (client: Client) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const MEASUREMENT_FIELDS = [
    { key: 'hombros', label: 'Hombros' },
    { key: 'pecho', label: 'Pecho / Busto' },
    { key: 'cintura', label: 'Cintura' },
    { key: 'cadera', label: 'Cadera' },
    { key: 'largo_manga', label: 'Largo Manga' },
    { key: 'largo_talle', label: 'Largo Talle' },
    { key: 'largo_pantalon', label: 'Largo Pantalón' },
    { key: 'tiro', label: 'Tiro' },
    { key: 'cuello', label: 'Cuello' },
    { key: 'puno', label: 'Puño' },
];

interface PersonnelProfile {
    id: string;
    name: string;
    standardSize: string; // S, M, L, XL...
    values: Record<string, string>; // Specific cm measurements
    notes: string;
}

// Generate consistent colors
const getAvatarColor = (name: string) => {
    const colors = [
        'from-blue-600 to-cyan-500', 
        'from-purple-600 to-pink-500', 
        'from-orange-500 to-red-500', 
        'from-emerald-500 to-teal-500',
        'from-indigo-600 to-violet-500',
        'from-rose-500 to-orange-400'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface ClientStats {
    totalSpent: number;
    orderCount: number;
    lastOrderDate: number | null;
    isVip: boolean;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients, orders, onAddClient, onUpdateClient, onDeleteClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'az' | 'spent'>('newest');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  
  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({ businessName: '', name: '', phone: '', email: '', address: '' });

  // --- STATS CALCULATION PER CLIENT ---
  const getClientStats = (clientId: string): ClientStats => {
      const clientOrders = orders.filter(o => o.clientId === clientId && o.status !== OrderStatus.CANCELLED);
      const totalSpent = clientOrders.reduce((acc, o) => acc + o.totalAmount, 0);
      const orderCount = clientOrders.length;
      const lastOrderDate = clientOrders.length > 0 ? Math.max(...clientOrders.map(o => o.createdAt)) : null;
      // Simple VIP logic: > $500 spent OR > 5 orders
      const isVip = totalSpent > 500 || orderCount >= 5;

      return { totalSpent, orderCount, lastOrderDate, isVip };
  };

  // --- FILTERING LOGIC ---
  const getDateRange = (filter: TimeFilter) => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      if (filter === 'all') return { start: 0, end: Date.now() };
      if (filter === 'today') return { start: startOfDay, end: Date.now() };
      
      if (filter === 'week') {
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(now.setDate(diff));
          monday.setHours(0,0,0,0);
          return { start: monday.getTime(), end: Date.now() };
      }
      if (filter === 'month') {
          return { start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), end: Date.now() };
      }
      if (filter === 'year') {
          return { start: new Date(now.getFullYear(), 0, 1).getTime(), end: Date.now() };
      }
      return { start: 0, end: Date.now() };
  };

  const filteredClients = useMemo(() => {
    const { start, end } = getDateRange(timeFilter);

    let result = clients.filter(c => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(searchLower) ||
                            (c.businessName && c.businessName.toLowerCase().includes(searchLower)) ||
                            c.phone.includes(searchTerm) ||
                            (c.email && c.email.toLowerCase().includes(searchLower));
      const matchesDate = c.createdAt >= start && c.createdAt <= end; 
      return matchesSearch && matchesDate;
    });

    if (sortOrder === 'az') {
        result.sort((a, b) => (a.businessName || a.name).localeCompare(b.businessName || b.name));
    } else if (sortOrder === 'spent') {
        result.sort((a, b) => getClientStats(b.id).totalSpent - getClientStats(a.id).totalSpent);
    } else {
        result.sort((a, b) => b.createdAt - a.createdAt);
    }
    return result;
  }, [clients, searchTerm, sortOrder, timeFilter, orders]);

  // --- HANDLERS ---
  const handleOpenForm = (client?: Client) => {
    if (client) { setSelectedClient(client); setFormData(client); } 
    else { setSelectedClient(null); setFormData({ businessName: '', name: '', phone: '', email: '', address: '' }); }
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (client: Client) => {
      setSelectedClient(client);
      setIsDetailModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return alert('Nombre de contacto y Teléfono son requeridos');
    
    if (selectedClient && isFormModalOpen) {
        onUpdateClient({ ...selectedClient, ...formData } as Client);
    } else {
        onAddClient({ id: crypto.randomUUID(), createdAt: Date.now(), ...formData } as Client);
    }
    setIsFormModalOpen(false);
    setFormData({ businessName: '', name: '', phone: '', email: '', address: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar cliente? Se perderá el enlace con sus pedidos históricos.')) {
        onDeleteClient(id);
        setIsDetailModalOpen(false);
    }
  };

  // --- SUB-COMPONENTS ---
  const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
      <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${active ? 'bg-primary-600 text-white border-primary-500 shadow-[0_0_15px_rgba(217,70,239,0.4)]' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}`}
      >
        {label}
      </button>
  );

  const ClientCard: React.FC<{ client: Client }> = ({ client }) => {
      const stats = getClientStats(client.id);
      const mainTitle = client.businessName || client.name;
      const subTitle = client.businessName ? client.name : 'Contacto Principal';

      return (
          <div 
            onClick={() => handleOpenDetail(client)}
            className="glass-card rounded-[2rem] p-6 relative group overflow-hidden flex flex-col h-full cursor-pointer hover:border-primary-500/50 transition-all duration-300"
          >
              {/* VIP Badge */}
              {stats.isVip && (
                  <div className="absolute top-0 right-0 bg-gradient-to-bl from-yellow-400 to-orange-500 text-black text-[10px] font-black px-3 py-1.5 rounded-bl-xl shadow-lg z-10 flex items-center gap-1">
                      <Crown size={12} fill="black"/> VIP
                  </div>
              )}

              <div className="flex items-start gap-5 mb-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(mainTitle)} flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105 shrink-0 border border-white/10`}>
                      <span className="font-display font-black text-2xl text-white drop-shadow-md">{mainTitle.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                      <h3 className="font-display font-black text-white text-lg leading-tight tracking-wide group-hover:text-primary-300 transition-colors line-clamp-1">
                          {mainTitle}
                      </h3>
                      <p className="text-sm text-slate-400 font-medium truncate">{subTitle}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{client.phone}</p>
                  </div>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pedidos</p>
                      <p className="text-lg font-black text-white flex items-center gap-1">
                          <ShoppingBag size={14} className="text-primary-400"/> {stats.orderCount}
                      </p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-3 border border-white/5">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                      <p className="text-lg font-black text-emerald-400 flex items-center gap-1">
                          <DollarSign size={14} className="text-emerald-500"/> {stats.totalSpent.toLocaleString()}
                      </p>
                  </div>
              </div>
          </div>
      );
  };

  const DetailModal = () => {
      if (!selectedClient) return null;
      const stats = getClientStats(selectedClient.id);
      const clientOrders = orders.filter(o => o.clientId === selectedClient.id).sort((a,b) => b.createdAt - a.createdAt);
      
      // Multi-Personnel Measurements Logic
      const [activeTab, setActiveTab] = useState<'profile' | 'measures' | 'history'>('profile');
      const [personnelList, setPersonnelList] = useState<PersonnelProfile[]>([]);
      const [activePersonId, setActivePersonId] = useState<string | null>(null);
      
      // Load Measurements SAFELY
      useEffect(() => {
          try {
              if (selectedClient.measurements) {
                  // Try parsing
                  let parsed;
                  try {
                      parsed = JSON.parse(selectedClient.measurements);
                  } catch(err) {
                      console.warn("Error parsing measurements JSON", err);
                      parsed = null;
                  }

                  if (parsed) {
                    // Migration logic: if parsed is a simple object (old format), convert to array
                    if (!Array.isArray(parsed) && typeof parsed === 'object') {
                        const legacyProfile: PersonnelProfile = {
                            id: 'legacy',
                            name: selectedClient.name || 'Principal',
                            standardSize: '',
                            values: parsed,
                            notes: (parsed as any).notas || ''
                        };
                        setPersonnelList([legacyProfile]);
                        setActivePersonId('legacy');
                    } else if (Array.isArray(parsed)) {
                        setPersonnelList(parsed);
                        if (parsed.length > 0) setActivePersonId(parsed[0].id);
                    }
                  } else {
                      setPersonnelList([]);
                  }
              } else {
                  setPersonnelList([]);
              }
          } catch(e) { 
              console.error("Critical error loading measurements", e);
              setPersonnelList([]);
          }
      }, [selectedClient]);

      const handleAddPerson = () => {
          const newId = crypto.randomUUID();
          const newPerson: PersonnelProfile = {
              id: newId,
              name: 'Nuevo Personal',
              standardSize: '',
              values: {},
              notes: ''
          };
          setPersonnelList([...personnelList, newPerson]);
          setActivePersonId(newId);
      };

      const handleRemovePerson = (id: string) => {
          if(confirm('¿Eliminar las medidas de esta persona?')) {
              const updated = personnelList.filter(p => p.id !== id);
              setPersonnelList(updated);
              if (updated.length > 0) setActivePersonId(updated[0].id);
              else setActivePersonId(null);
          }
      };

      const updatePersonField = (id: string, field: keyof PersonnelProfile, value: any) => {
          const updated = personnelList.map(p => p.id === id ? { ...p, [field]: value } : p);
          setPersonnelList(updated);
      };

      const updatePersonValue = (id: string, key: string, value: string) => {
          const person = personnelList.find(p => p.id === id);
          if (person) {
              const newValues = { ...person.values, [key]: value };
              updatePersonField(id, 'values', newValues);
          }
      };

      const handleSaveMeasurements = () => {
          onUpdateClient({
              ...selectedClient,
              measurements: JSON.stringify(personnelList)
          });
          alert('Medidas y Personal actualizados');
      };

      const activePerson = personnelList.find(p => p.id === activePersonId);

      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 md:p-6 animate-enter">
            <div className="bg-[#0a0520] border border-white/10 w-full max-w-5xl h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-6 border-b border-white/5 bg-[#0f0a29]">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(selectedClient.businessName || selectedClient.name)} flex items-center justify-center shadow-lg border border-white/10`}>
                             <span className="font-display font-black text-2xl text-white">{selectedClient.businessName ? selectedClient.businessName.charAt(0) : selectedClient.name.charAt(0)}</span>
                        </div>
                        <div>
                             <h3 className="text-2xl font-display font-black text-white">{selectedClient.businessName || selectedClient.name}</h3>
                             <p className="text-sm text-slate-400">{selectedClient.businessName ? selectedClient.name : 'Cliente Particular'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setIsDetailModalOpen(false); handleOpenForm(selectedClient); }} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors" title="Editar Info"><Edit2 size={20}/></button>
                        <button onClick={() => handleDelete(selectedClient.id)} className="p-3 hover:bg-red-500/10 rounded-full text-slate-400 hover:text-red-400 transition-colors" title="Eliminar Cliente"><Trash2 size={20}/></button>
                        <button onClick={() => setIsDetailModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={24}/></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 bg-[#0f0a29] px-6">
                    {['profile', 'measures', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === tab ? 'border-primary-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab === 'profile' && <User size={16}/>}
                            {tab === 'measures' && <Ruler size={16}/>}
                            {tab === 'history' && <History size={16}/>}
                            {tab === 'profile' ? 'Perfil' : tab === 'measures' ? 'Medidas' : 'Historial'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0520] relative">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-900/10 rounded-full blur-[100px] pointer-events-none -mt-32 -mr-32"></div>

                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-6">
                                <div className="glass-card p-6 rounded-3xl border border-white/10">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Información de Contacto</h4>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white/5 rounded-xl text-primary-400"><Phone size={18}/></div>
                                            <div><p className="text-[10px] text-slate-500 font-bold uppercase">Teléfono</p><p className="text-white font-mono text-lg">{selectedClient.phone}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white/5 rounded-xl text-primary-400"><Mail size={18}/></div>
                                            <div><p className="text-[10px] text-slate-500 font-bold uppercase">Email</p><p className="text-white text-base">{selectedClient.email || 'No registrado'}</p></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white/5 rounded-xl text-primary-400"><MapPin size={18}/></div>
                                            <div><p className="text-[10px] text-slate-500 font-bold uppercase">Dirección</p><p className="text-white text-base leading-snug">{selectedClient.address || 'Sin dirección'}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="glass-card p-6 rounded-3xl border border-white/10">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Notas Internas</h4>
                                    <textarea className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-slate-300 min-h-[100px] outline-none focus:border-primary-500/50 transition-colors" placeholder="Agrega notas sobre preferencias, telas favoritas, etc." defaultValue={""}></textarea>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-card p-5 rounded-3xl border border-white/10 bg-emerald-500/5">
                                        <div className="flex items-center gap-3 mb-2"><DollarSign size={20} className="text-emerald-400"/><span className="text-xs font-bold text-emerald-300 uppercase">Total Gastado</span></div>
                                        <p className="text-3xl font-black text-white">${stats.totalSpent.toLocaleString()}</p>
                                    </div>
                                    <div className="glass-card p-5 rounded-3xl border border-white/10 bg-blue-500/5">
                                        <div className="flex items-center gap-3 mb-2"><ShoppingBag size={20} className="text-blue-400"/><span className="text-xs font-bold text-blue-300 uppercase">Pedidos</span></div>
                                        <p className="text-3xl font-black text-white">{stats.orderCount}</p>
                                    </div>
                                    <div className="glass-card p-5 rounded-3xl border border-white/10 col-span-2">
                                        <div className="flex items-center gap-3 mb-2"><Calendar size={20} className="text-purple-400"/><span className="text-xs font-bold text-purple-300 uppercase">Última Actividad</span></div>
                                        <p className="text-xl font-bold text-white">{stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Nunca'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'measures' && (
                        <div className="relative z-10 max-w-4xl mx-auto h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <div>
                                    <h4 className="text-xl font-bold text-white mb-1">Medidas y Dotación</h4>
                                    <p className="text-sm text-slate-400">Gestiona las tallas del personal de este cliente.</p>
                                </div>
                                <button onClick={handleSaveMeasurements} className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg hover:shadow-primary-500/25 transition-all"><Save size={18}/> Guardar Cambios</button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 h-full min-h-0">
                                {/* Sidebar of Personnel */}
                                <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
                                    <button onClick={handleAddPerson} className="p-4 rounded-2xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all font-bold text-sm uppercase tracking-wide group">
                                        <UserPlus size={18} className="group-hover:scale-110 transition-transform"/> Agregar Personal
                                    </button>
                                    
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[300px] md:max-h-none">
                                        {personnelList.map(person => (
                                            <button 
                                                key={person.id}
                                                onClick={() => setActivePersonId(person.id)}
                                                className={`w-full p-4 rounded-xl border text-left transition-all relative group ${activePersonId === person.id ? 'bg-primary-600/20 border-primary-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.2)]' : 'bg-black/30 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <div className="font-bold text-sm truncate pr-6">{person.name}</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {person.standardSize && <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-black">{person.standardSize}</span>}
                                                    <span className="text-[10px] opacity-60 uppercase font-bold">{Object.keys(person.values).length} medidas</span>
                                                </div>
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); handleRemovePerson(person.id); }} 
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14}/>
                                                </div>
                                            </button>
                                        ))}
                                        {personnelList.length === 0 && (
                                            <div className="text-center py-8 text-slate-600 text-xs font-medium">No hay personal registrado</div>
                                        )}
                                    </div>
                                </div>

                                {/* Main Form Area */}
                                <div className="flex-1 glass-card rounded-[2rem] border border-white/10 p-6 md:p-8 overflow-y-auto custom-scrollbar">
                                    {activePerson ? (
                                        <div className="space-y-6 animate-enter">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre / Cargo</label>
                                                    <div className="relative">
                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                                        <input 
                                                            type="text" 
                                                            className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold text-lg focus:border-primary-500 focus:bg-black/60 outline-none transition-colors"
                                                            placeholder="Ej. Juan Pérez - Gerente"
                                                            value={activePerson.name}
                                                            onChange={(e) => updatePersonField(activePerson.id, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Talla Estándar</label>
                                                    <div className="relative">
                                                        <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                                                        <select 
                                                            className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl text-white font-bold text-lg focus:border-primary-500 focus:bg-black/60 outline-none transition-colors appearance-none"
                                                            value={activePerson.standardSize}
                                                            onChange={(e) => updatePersonField(activePerson.id, 'standardSize', e.target.value)}
                                                        >
                                                            <option value="">Seleccionar...</option>
                                                            {['XS','S','M','L','XL','2XL','3XL','4XL'].map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18}/>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/10 pt-6">
                                                <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Ruler size={16} className="text-primary-400"/> Medidas Específicas (CM)</h5>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                    {MEASUREMENT_FIELDS.map((field) => (
                                                        <div key={field.key} className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{field.label}</label>
                                                            <input 
                                                                type="text" 
                                                                className="w-full p-3 bg-black/20 border border-white/5 rounded-xl text-white font-mono font-medium focus:border-primary-500 focus:bg-black/40 outline-none transition-colors text-center"
                                                                placeholder="-"
                                                                value={activePerson.values[field.key] || ''}
                                                                onChange={(e) => updatePersonValue(activePerson.id, field.key, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block">Observaciones de Talle</label>
                                                 <textarea 
                                                    className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white font-medium focus:border-primary-500 outline-none transition-colors h-24 resize-none"
                                                    placeholder="Detalles sobre postura, hombros caídos, preferencias de ajuste..."
                                                    value={activePerson.notes}
                                                    onChange={(e) => updatePersonField(activePerson.id, 'notes', e.target.value)}
                                                 />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
                                            <Users size={48} className="mb-4"/>
                                            <p className="text-lg font-bold">Selecciona una persona</p>
                                            <p className="text-sm">o agrega un nuevo perfil de medidas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="relative z-10 space-y-4">
                            {clientOrders.length > 0 ? (
                                clientOrders.map(order => (
                                    <div key={order.id} className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6 hover:bg-white/5 transition-colors">
                                        <div className="flex flex-col items-center md:items-start min-w-[100px]">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fecha</span>
                                            <span className="text-white font-mono font-bold">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex-1 text-center md:text-left">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pedido</span>
                                            <div className="flex items-center justify-center md:justify-start gap-3">
                                                <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-white">{order.orderNumber}</span>
                                                <span className="text-white font-bold">{order.garmentModel}</span>
                                            </div>
                                        </div>
                                        <div className="text-center md:text-right min-w-[100px]">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Monto</span>
                                            <span className="block text-emerald-400 font-black text-lg">${order.totalAmount}</span>
                                        </div>
                                        <div className="min-w-[120px] flex justify-center">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                order.status === 'Entregado' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 
                                                order.status === 'Cancelado' ? 'bg-red-500/10 border-red-500 text-red-400' : 
                                                'bg-blue-500/10 border-blue-500 text-blue-400'
                                            }`}>{order.status}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 opacity-50">
                                    <ShoppingBag size={48} className="mx-auto mb-4 text-slate-500"/>
                                    <h4 className="text-xl font-bold text-white">Sin historial</h4>
                                    <p className="text-slate-500">Este cliente aún no ha realizado pedidos.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-8 md:space-y-10 relative h-full animate-enter">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-2 flex items-center gap-4 tracking-tight">
            CLIENTES <span className="bg-white/10 text-white text-sm md:text-base px-3 py-1 rounded-lg font-mono border border-white/5">{filteredClients.length}</span>
          </h2>
          <p className="text-slate-400 font-medium text-base">CRM y Base de Datos de Contactos.</p>
        </div>
        
        <div className="flex flex-col gap-4 w-full xl:w-auto">
            {/* Search Bar */}
            <div className="relative w-full">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar empresa, nombre..."
                    className="w-full xl:w-96 pl-14 pr-5 py-4 glass-input rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none text-base font-medium transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter Bar */}
            <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <Filter size={18} className="text-primary-400 ml-2 mr-1"/>
                    <FilterChip label="Todo" active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} />
                    <FilterChip label="Hoy" active={timeFilter === 'today'} onClick={() => setTimeFilter('today')} />
                    <FilterChip label="Sem" active={timeFilter === 'week'} onClick={() => setTimeFilter('week')} />
                    <FilterChip label="Mes" active={timeFilter === 'month'} onClick={() => setTimeFilter('month')} />
                </div>
                
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={() => setSortOrder(prev => prev === 'newest' ? 'az' : prev === 'az' ? 'spent' : 'newest')} className="text-xs font-bold text-slate-400 hover:text-white uppercase px-4 py-2 bg-black/20 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap border border-white/5 hover:border-white/20">
                        {sortOrder === 'newest' ? 'Recientes' : sortOrder === 'az' ? 'A-Z' : 'Mayor Gasto'} <ArrowUpRight size={14}/>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><Users size={20}/></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-500">Total</p><p className="text-xl font-black text-white">{clients.length}</p></div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><TrendingUp size={20}/></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-500">Nuevos (Mes)</p><p className="text-xl font-black text-white">{clients.filter(c => (Date.now() - c.createdAt) < 2592000000).length}</p></div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-400"><Crown size={20}/></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-500">Clientes VIP</p><p className="text-xl font-black text-white">{clients.filter(c => getClientStats(c.id).isVip).length}</p></div>
          </div>
           <div className="glass-card p-4 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><DollarSign size={20}/></div>
              <div><p className="text-[10px] uppercase font-bold text-slate-500">Valor Cartera</p><p className="text-xl font-black text-white">${orders.reduce((acc,o) => acc + o.totalAmount, 0).toLocaleString()}</p></div>
          </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
        {filteredClients.map(client => (
          <ClientCard key={client.id} client={client} />
        ))}
        
        {filteredClients.length === 0 && (
            <div className="col-span-full py-24 text-center glass-card rounded-[2rem] border-dashed border-white/10 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6"><Users size={40} className="text-slate-600"/></div>
                <h3 className="text-2xl font-bold text-slate-300">No se encontraron clientes</h3>
                <p className="text-slate-500 mt-2 font-medium">Intenta ajustar los filtros o agrega uno nuevo.</p>
            </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button onClick={() => handleOpenForm()} className="fixed bottom-8 right-8 md:bottom-10 md:right-10 bg-gradient-to-r from-primary-500 to-purple-600 text-white p-5 md:p-6 rounded-full shadow-[0_0_40px_rgba(217,70,239,0.6)] hover:scale-110 transition-transform z-30 border-2 border-white/20 group">
        <Plus size={28} strokeWidth={3} className="md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300"/>
      </button>

      {/* EDIT / CREATE MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-enter">
          <div className="bg-[#0a0520] border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
             <div className="absolute top-0 right-0 w-80 h-80 bg-primary-600/10 rounded-full blur-[120px] -mt-20 -mr-20 pointer-events-none"></div>

            <div className="flex justify-between items-center p-8 md:p-10 pb-0 relative z-10 shrink-0">
              <h3 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">{selectedClient ? 'EDITAR' : 'NUEVO'} <span className="text-primary-400">CLIENTE</span></h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-3 rounded-full hover:bg-white/10 transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-6 md:space-y-8 relative z-10 overflow-y-auto">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary-300 uppercase tracking-widest ml-1 flex items-center gap-2"><Building2 size={14}/> Nombre del Negocio / Empresa</label>
                <input type="text" className="w-full px-6 py-4 glass-input rounded-2xl outline-none text-xl font-bold placeholder-slate-600" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} placeholder="Ej. Taller El Éxito" autoFocus />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={14}/> Nombre de Contacto</label>
                <input type="text" required className="w-full px-6 py-4 glass-input rounded-2xl outline-none text-lg font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Jean Carlos" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <input type="tel" required className="w-full px-6 py-4 glass-input rounded-2xl outline-none text-lg font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="555-0000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
                    <input type="email" className="w-full px-6 py-4 glass-input rounded-2xl outline-none text-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="@..." />
                  </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Dirección</label>
                <textarea className="w-full px-6 py-4 glass-input rounded-2xl outline-none resize-none text-base" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="pt-6 flex flex-col md:flex-row gap-4">
                <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-4 border border-white/10 text-slate-300 rounded-2xl hover:bg-white/5 font-bold tracking-widest uppercase order-2 md:order-1 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-primary-500/40 font-bold tracking-widest uppercase transition-all transform hover:-translate-y-1 order-1 md:order-2">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {isDetailModalOpen && <DetailModal />}
    </div>
  );
};


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderStatus, Client, Gender, OrderItem } from '../types';
import { StorageService } from '../services/storage';
import { Search, Plus, Calendar, Filter, X, Printer, Image as ImageIcon, Shirt, User, Package, Clock, Ruler, ChevronDown, CheckCircle2, AlertTriangle, PlayCircle, StopCircle, Edit, DollarSign, MoreVertical, FileText, Layers, Scissors, Upload, Timer, ChevronUp, Trash2, Zap, Palette, ArrowRight, ToggleLeft, ToggleRight, Lock, Building2, Feather, Briefcase, MousePointer2, Tag, CalendarDays, Eye, Pencil, AlertOctagon, Sparkles, Download, Loader2, Crown, CloudUpload, ArchiveRestore } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface OrdersViewProps {
  orders: Order[];
  clients: Client[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onUpdateStatus: (id: string, status: OrderStatus) => void;
}

const GENDER_ORDER: Gender[] = ['Caballero', 'Dama', 'Niño', 'Niña'];

// --- DYNAMIC OPTION LISTS ---
const STANDARD_MODELS = [
    'Chaqueta Impermeable',
    'Chemise / Polo',
    'Camisa Columbia',
    'Franela Manga Corta',
    'Franela Manga Larga',
    'Uniforme Táctico',
    'Sueter / Hoodie',
    'Pantalón Cargo',
    'Pantalón Jeans',
    'Vestido',
    'Braga / Overol',
    'Gorra',
    'Otro (Confección)'
];

const EMBROIDERY_OPTIONS = [
    'Bordado Pecho (Logotipo)',
    'Bordado Espalda (Grande)',
    'Bordado Espalda (Texto/Nombre)',
    'Bordado en Gorra (Plano)',
    'Bordado en Gorra (3D / Alto Relieve)',
    'Bordado de Nombres (Puño/Pecho)',
    'Bordado de Parches / Escudos',
    'Bordado en Manga',
    'Digitalización (Solo Ponchado)',
    'Aplique de Tela',
    'Otro (Bordado)'
];

const SUBLIMATION_OPTIONS = [
    'Sublimación por Metro Lineal (Rollo)',
    'Sublimación Full Print (Patrones/Corte)',
    'Sublimación de Tela (Rollo Completo)',
    'Frente de Prenda (A4 / Carta)',
    'Frente de Prenda (A3 / Tabloide)',
    'Frente de Prenda (Gran Formato)',
    'Sublimación de Logotipo (Pecho/Bolsillo)',
    'Sublimación de Logotipo (Espalda)',
    'Bandera / Gigantografía (Tela)',
    'Cinta Lanyard (Por metro)',
    'Taza 11oz (Estándar)',
    'Taza Cónica 12oz',
    'Termo / Botella Deportiva',
    'Mousepad (Rectangular/Redondo)',
    'Chapa / Botón Publicitario',
    'Otro (Sublimación)'
];

const SEWING_OPTIONS = [
    'Ruedo / Dobladillo Sencillo',
    'Ruedo Original (Jeans)',
    'Ruedo Invisible (Pantalón de Vestir)',
    'Ajuste de Talla (Entallar Completo)',
    'Ajuste de Cintura (Meter/Sacar)',
    'Ajuste de Botapie / Pierna',
    'Ajuste de Hombros / Mangas',
    'Cambio de Cierre (Pantalón/Falda)',
    'Cambio de Cierre (Chaqueta/Suéter)',
    'Cambio de Cuello o Puños',
    'Voltear Cuello (Camisa)',
    'Servicio de Ojales',
    'Pegado de Botones',
    'Cambio de Elástica',
    'Zurcido / Parche / Remiendo',
    'Cortar Mangas (Larga a Corta)',
    'Confección de Prenda Completa',
    'Planchado y Vaporizado',
    'Otro (Costura)'
];

const FABRIC_OPTIONS = [
    'Gabardina',
    'Popelina',
    'Drill',
    'Jean / Denim',
    'Lycra',
    'Algodón Pima',
    'Poliéster Deportivo',
    'Taslan (Impermeable)',
    'Microdurazno',
    'Lino',
    'Chifón',
    'Polar / Fleece',
    'Ripstop',
    'Proporcionada por Cliente', // Critical for services
    'Otro'
];

const getSizeWeight = (size: string): number => {
    const s = size.toUpperCase().trim();
    if (!isNaN(Number(s))) return Number(s);
    const map: Record<string, number> = { 
        'XXXS': 5, 'XXS': 10, 'XS': 20, 'SS': 25,
        'S': 30, 'M': 40, 'L': 50, 
        'XL': 60, 'XXL': 70, '2XL': 70, 'XXXL': 80, '3XL': 80, '4XL': 90, '5XL': 100 
    };
    return map[s] || 999;
};

// Colors per Gender (Updated for higher contrast)
const getGenderColorStyles = (gender: Gender) => {
    switch(gender) {
        case 'Caballero': return { 
            bg: 'bg-blue-500/10', border: 'border-blue-400/40', text: 'text-blue-100', title: 'text-blue-300', icon: 'text-blue-400', 
            badge: 'bg-blue-600 text-white', ring: 'focus:ring-blue-500', shadow: 'shadow-blue-500/20'
        };
        case 'Dama': return { 
            bg: 'bg-pink-500/10', border: 'border-pink-400/40', text: 'text-pink-100', title: 'text-pink-300', icon: 'text-pink-400',
            badge: 'bg-pink-600 text-white', ring: 'focus:ring-pink-500', shadow: 'shadow-pink-500/20'
        };
        case 'Niño': return { 
            bg: 'bg-emerald-500/10', border: 'border-emerald-400/40', text: 'text-emerald-100', title: 'text-emerald-300', icon: 'text-emerald-400',
            badge: 'bg-emerald-600 text-white', ring: 'focus:ring-emerald-500', shadow: 'shadow-emerald-500/20'
        };
        case 'Niña': return { 
            bg: 'bg-orange-500/10', border: 'border-orange-400/40', text: 'text-orange-100', title: 'text-orange-300', icon: 'text-orange-400',
            badge: 'bg-orange-600 text-white', ring: 'focus:ring-orange-500', shadow: 'shadow-orange-500/20'
        };
        default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-200', title: 'text-slate-400', icon: 'text-slate-500', badge: '', ring: '', shadow: '' };
    }
};

// --- FILTER TYPES & CONSTANTS ---
// Updated to match the specific groups requested
type FilterStatusGroup = 'all' | 'start' | 'production' | 'finish' | 'attention' | 'trash';
type FilterCategory = 'all' | 'general' | 'embroidery' | 'sublimation' | 'sewing';
type FilterTime = 'all' | 'week' | 'month';

const STATUS_GROUPS: Record<FilterStatusGroup, OrderStatus[]> = {
    all: [],
    start: [OrderStatus.RECEIVED, OrderStatus.PENDING_CUT, OrderStatus.PENDING_SEW],
    production: [OrderStatus.CUTTING, OrderStatus.CUT_READY, OrderStatus.SEWING, OrderStatus.SEWN, OrderStatus.FINISHING, OrderStatus.QUALITY_CONTROL],
    finish: [OrderStatus.READY, OrderStatus.DELIVERED],
    attention: [OrderStatus.PAUSED, OrderStatus.RETURNED, OrderStatus.CANCELLED],
    trash: [OrderStatus.TRASH]
};

// Organize Statuses for the Dropdown Menu (Synced with Filter Groups)
const STATUS_MENU_GROUPS = {
    'Por Iniciar': STATUS_GROUPS.start,
    'En Producción': STATUS_GROUPS.production,
    'Finalización': STATUS_GROUPS.finish,
    'Atención': STATUS_GROUPS.attention
};

// Helper to check category
const checkCategory = (o: Order, cat: FilterCategory): boolean => {
    if (cat === 'all') return true;
    
    // Explicit Check for distinct "Other" types first
    if (o.garmentModel === 'Otro (Bordado)') return cat === 'embroidery';
    if (o.garmentModel === 'Otro (Sublimación)') return cat === 'sublimation';
    if (o.garmentModel === 'Otro (Costura)') return cat === 'sewing';
    if (o.garmentModel === 'Otro (Confección)') return cat === 'general';

    const isEmbroidery = EMBROIDERY_OPTIONS.includes(o.garmentModel) || o.items.some(i => i.type && i.type.toLowerCase().includes('bordado'));
    const isSublimation = SUBLIMATION_OPTIONS.includes(o.garmentModel) || o.items.some(i => i.type && i.type.toLowerCase().includes('sublima'));
    const isSewing = SEWING_OPTIONS.includes(o.garmentModel) || o.items.some(i => i.type && (i.type.toLowerCase().includes('ruedo') || i.type.toLowerCase().includes('costura') || i.type.toLowerCase().includes('ajuste')));
    const isGeneral = !isEmbroidery && !isSublimation && !isSewing; 

    if (cat === 'general') return isGeneral;
    if (cat === 'embroidery') return isEmbroidery;
    if (cat === 'sublimation') return isSublimation;
    if (cat === 'sewing') return isSewing;
    return false;
};

// Helper to check status
const checkStatus = (o: Order, statusGroup: FilterStatusGroup): boolean => {
    if (statusGroup === 'all') {
        // Exclude Trash from 'All' view by default
        return o.status !== OrderStatus.TRASH;
    }
    return STATUS_GROUPS[statusGroup].includes(o.status);
};

// --- PRINT TEMPLATE COMPONENT ---
// ... (PrintTemplate component remains unchanged) ...
const PrintTemplate = ({ order }: { order: Order }) => {
    if (!order) return null;
    
    const formatPrintDate = (ms: number) => {
        const d = new Date(ms);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const simplifiedOrderNumber = order.orderNumber.replace('PED-', '#');

    // DETECT MODE: Standard Clothing vs Service (Embroidery/Sublimation)
    const isStandardClothing = order.items.some(i => GENDER_ORDER.includes(i.gender));
    const isServiceOrder = !isStandardClothing;

    // Detect Specific Service Type for headers
    const isSublimation = SUBLIMATION_OPTIONS.includes(order.garmentModel);
    const isSewing = SEWING_OPTIONS.includes(order.garmentModel);
    // Default fallback to Embroidery/General Service if not above

    // Helper logic for dynamic headers (Clothing Mode)
    const maleItems = order.items.filter(i => i.gender === 'Caballero');
    const boyItems = order.items.filter(i => i.gender === 'Niño');
    const hasMale = maleItems.length > 0;
    const hasBoy = boyItems.length > 0;
    
    const femaleItems = order.items.filter(i => i.gender === 'Dama');
    const girlItems = order.items.filter(i => i.gender === 'Niña');
    const hasFemale = femaleItems.length > 0;
    const hasGirl = girlItems.length > 0;

    const maleHeaderText = (hasMale && hasBoy) ? 'CABALLERO / NIÑO' : (hasMale ? 'CABALLERO' : (hasBoy ? 'NIÑO' : 'CABALLERO'));
    const femaleHeaderText = (hasFemale && hasGirl) ? 'DAMA / NIÑA' : (hasFemale ? 'DAMA' : (hasGirl ? 'NIÑA' : 'DAMA'));

    return (
        <div 
            style={{ 
                width: '210mm', 
                height: '297mm', 
                padding: '1.5cm', 
                backgroundColor: 'white', 
                color: 'black', 
                fontFamily: 'Arial, Helvetica, sans-serif',
                boxSizing: 'border-box',
                position: 'relative'
            }}
        >
            {/* ENCABEZADO */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid black', paddingBottom: '15px', marginBottom: '15px' }}>
                <div style={{ fontSize: '10pt', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>RECIBIDO:</span> {formatPrintDate(order.receptionDate)}
                    </div>
                    <div>
                        <span style={{ fontWeight: 'bold' }}>ENTREGA:</span> _______________
                    </div>
                </div>
                <div style={{ textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <Crown size={40} color="black" fill="#000" /> 
                    </div>
                    <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
                        INVERSIONES<br/>GSKY
                    </h1>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>
                        ORDEN DE PEDIDO
                    </div>
                    <div style={{ fontSize: '24pt', fontWeight: 'bold', color: '#000' }}>
                        {simplifiedOrderNumber}
                    </div>
                </div>
            </div>

            {/* CLIENTE */}
            <div style={{ backgroundColor: '#f3f4f6', border: '1pt solid black', padding: '8px 15px', fontSize: '12pt', fontWeight: 'bold', marginBottom: '20px' }}>
                CLIENTE: <span style={{ textTransform: 'uppercase' }}>{order.clientName}</span>
            </div>

            {/* CUERPO PRINCIPAL */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                <div style={{ flex: '1' }}>
                    
                    {/* Especificaciones */}
                    <div style={{ fontSize: '11pt', marginBottom: '40px', lineHeight: '1.6' }}> 
                        <div style={{ borderBottom: '1px dotted #ccc', paddingBottom: '2px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 'bold', width: '100px', display: 'inline-block' }}>COLOR:</span> 
                            {order.fabricColor}
                        </div>
                        <div style={{ borderBottom: '1px dotted #ccc', paddingBottom: '2px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 'bold', width: '100px', display: 'inline-block' }}>{isServiceOrder ? 'MATERIAL:' : 'TIPO TELA:'}</span> 
                            {order.fabricType}
                        </div>
                        <div style={{ borderBottom: '1px dotted #ccc', paddingBottom: '2px', marginBottom: '5px' }}>
                            <span style={{ fontWeight: 'bold', width: '100px', display: 'inline-block' }}>{isServiceOrder ? 'SERVICIO:' : 'MODELO:'}</span> 
                            {order.garmentModel}
                        </div>
                        {order.description && (
                            <div style={{ marginTop: '10px', backgroundColor: '#fff', border: '1px solid #eee', padding: '5px' }}>
                                <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '2px', fontSize: '10pt' }}>NOTA / OBSERVACIONES:</span> 
                                <span style={{ fontSize: '10pt', whiteSpace: 'pre-wrap' }}>{order.description}</span>
                            </div>
                        )}
                    </div>

                    {isStandardClothing ? (
                        /* OPCIÓN A: TABLAS DE ROPA (GÉNERO) */
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1, border: '1px solid black' }}>
                                <div style={{ backgroundColor: '#eee', borderBottom: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '9pt', color: '#1d4ed8' }}>
                                    {maleHeaderText}
                                </div>
                                {order.items.filter(i => i.gender === 'Caballero' || i.gender === 'Niño').length > 0 ? (
                                    order.items.filter(i => i.gender === 'Caballero' || i.gender === 'Niño')
                                    .sort((a,b) => getSizeWeight(a.size) - getSizeWeight(b.size))
                                    .map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #ccc', fontSize: '10pt' }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: '1px solid #ccc', fontWeight: 'bold', textAlign: 'center' }}>
                                                {item.size} {item.gender === 'Niño' ? '(N)' : ''}
                                            </div>
                                            <div style={{ width: '30px', padding: '4px', textAlign: 'center' }}>
                                                {item.quantity}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '9pt', color: '#999' }}>-</div>
                                )}
                            </div>

                            <div style={{ flex: 1, border: '1px solid black' }}>
                                <div style={{ backgroundColor: '#eee', borderBottom: '1px solid black', padding: '5px', textAlign: 'center', fontWeight: 'bold', fontSize: '9pt', color: '#db2777' }}>
                                    {femaleHeaderText}
                                </div>
                                {order.items.filter(i => i.gender === 'Dama' || i.gender === 'Niña').length > 0 ? (
                                    order.items.filter(i => i.gender === 'Dama' || i.gender === 'Niña')
                                    .sort((a,b) => getSizeWeight(a.size) - getSizeWeight(b.size))
                                    .map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', borderBottom: '1px solid #ccc', fontSize: '10pt' }}>
                                            <div style={{ flex: 1, padding: '4px', borderRight: '1px solid #ccc', fontWeight: 'bold', textAlign: 'center' }}>
                                                {item.size} {item.gender === 'Niña' ? '(N)' : ''}
                                            </div>
                                            <div style={{ width: '30px', padding: '4px', textAlign: 'center' }}>
                                                {item.quantity}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '10px', textAlign: 'center', fontSize: '9pt', color: '#999' }}>-</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* OPCIÓN B: TABLA DE SERVICIOS (Dinámica) */
                        <div style={{ border: '1px solid black' }}>
                            <div style={{ display: 'flex', backgroundColor: isSublimation ? '#fce7f3' : isSewing ? '#dcfce7' : '#e0e7ff', borderBottom: '1px solid black', fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase' }}>
                                <div style={{ flex: 2, padding: '6px', borderRight: '1px solid black', textAlign: 'center' }}>
                                    {isSublimation ? 'Producto / Arte' : isSewing ? 'Tipo de Arreglo / Costura' : 'Ubicación / Pieza'}
                                </div>
                                <div style={{ flex: 1, padding: '6px', borderRight: '1px solid black', textAlign: 'center' }}>
                                    {isSublimation ? 'Formato / Medidas' : isSewing ? 'Ajuste / Medidas' : 'Tamaño / Detalle'}
                                </div>
                                <div style={{ width: '50px', padding: '6px', textAlign: 'center' }}>Cant.</div>
                            </div>
                            {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid #ccc', fontSize: '10pt' }}>
                                    <div style={{ flex: 2, padding: '6px', borderRight: '1px solid #ccc', fontWeight: 'bold' }}>
                                        {item.notes || item.type}
                                    </div>
                                    <div style={{ flex: 1, padding: '6px', borderRight: '1px solid #ccc', textAlign: 'center' }}>
                                        {item.size}
                                    </div>
                                    <div style={{ width: '50px', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>
                                        {item.quantity}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* COLUMNA DERECHA */}
                <div style={{ width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px' }}>
                    <div style={{ width: '100%', height: '7cm', border: '1px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '5px' }}>
                        {order.referenceImages && order.referenceImages.length > 0 ? (
                            <img src={order.referenceImages[0]} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                            <span style={{ color: '#ccc', fontSize: '10pt', textAlign: 'center' }}>SIN IMAGEN<br/>DE REFERENCIA</span>
                        )}
                    </div>
                    <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>MODELO DE REFERENCIA</span>
                </div>
            </div>

            {/* TOTAL */}
            <div style={{ position: 'absolute', bottom: '2cm', right: '1.5cm', textAlign: 'right' }}>
                <div style={{ borderTop: '2px solid black', paddingTop: '5px' }}>
                    <span style={{ fontSize: '14pt', fontWeight: 'bold' }}>TOTAL PIEZAS: {order.items.reduce((a,b)=>a+b.quantity,0)}</span>
                </div>
            </div>
        </div>
    );
};

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, clients, onAddOrder, onUpdateOrder, onUpdateStatus }) => {
  // ... (Existing state variables remain) ...
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [nextOrderNumber, setNextOrderNumber] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatusGroup>('all');
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>('all');
  const [timeFilter, setTimeFilter] = useState<FilterTime>('all');
  const [activeStatusMenu, setActiveStatusMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFormState: Partial<Order> = {
    clientId: '', fabricColor: '', fabricType: '', garmentModel: '', description: '', referenceImages: [],
    status: OrderStatus.RECEIVED, priority: 'Normal', totalAmount: 0
  };
  
  const [newOrder, setNewOrder] = useState<Partial<Order>>(initialFormState);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderMode, setOrderMode] = useState<'General' | 'Bordado' | 'Sublimacion' | 'Costura'>('General');
  const [sublimationMeters, setSublimationMeters] = useState('');
  const [serviceLocation, setServiceLocation] = useState('');
  const [serviceDimensions, setServiceDimensions] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('17:00');
  const [useSpecificTime, setUseSpecificTime] = useState(false);
  const [tempGender, setTempGender] = useState<Gender>('Caballero');
  const [tempSize, setTempSize] = useState('M');
  const [tempColor, setTempColor] = useState(''); 
  const [useSpecificColor, setUseSpecificColor] = useState(false);
  const [customSize, setCustomSize] = useState('');
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [tempQty, setTempQty] = useState<number>(1);
  const [customFabric, setCustomFabric] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const isReadyForItems = useMemo(() => {
     const hasClient = !!newOrder.clientId;
     const hasModel = !!newOrder.garmentModel;
     const hasFabric = !!newOrder.fabricType;
     return hasClient && hasModel && hasFabric;
  }, [newOrder.clientId, newOrder.garmentModel, newOrder.fabricType]);

  // Updated useEffect to handle async call
  useEffect(() => {
    if (isModalOpen && !editingId) {
      const fetchNext = async () => {
          const num = await StorageService.getNextOrderNumber();
          setNextOrderNumber(num);
      };
      fetchNext();
      
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setDeadlineDate(d.toISOString().split('T')[0]);
      setDeadlineTime('17:00');
      setUseSpecificTime(false);
    }
  }, [isModalOpen, editingId, orders]);

  useEffect(() => {
      if (!useSpecificColor) {
          setTempColor('');
      }
  }, [useSpecificColor]);

  // ... (Handlers: handleAddItem, handleRemoveItem, handleFileUpload, handleRemoveImage, handleSaveOrder, handleEditClick, handleQuickService, handleDownloadPdf, resetForm) ...
  const handleAddItem = () => {
    if (!isReadyForItems) return; // Guard clause
    if (tempQty <= 0) return;

    let finalSize = '';
    let itemGender: Gender = 'Caballero'; // Default fallback
    let itemNote = '';

    if (orderMode === 'General') {
        finalSize = useCustomSize ? customSize.toUpperCase() : tempSize;
        itemGender = tempGender;
    } else {
        if (!serviceDimensions && !serviceLocation) return alert("Indica detalle o medida");
        finalSize = serviceDimensions ? serviceDimensions : 'Estándar';
        itemNote = serviceLocation;
    }

    if (!finalSize) return;
    const effectiveColor = useSpecificColor && tempColor.trim() !== '' ? tempColor : (newOrder.fabricColor || 'Base');
    const existingIndex = orderItems.findIndex(i => 
        i.size === finalSize && 
        i.color === effectiveColor &&
        (orderMode === 'General' ? i.gender === itemGender : i.notes === itemNote)
    );
    
    let updatedItems = [...orderItems];
    if (existingIndex >= 0) {
        updatedItems[existingIndex].quantity += tempQty;
    } else {
        updatedItems.push({ 
            id: crypto.randomUUID(), 
            gender: itemGender, 
            type: newOrder.garmentModel || 'Servicio', 
            size: finalSize, 
            quantity: tempQty, 
            color: effectiveColor,
            notes: itemNote 
        });
    }
    setOrderItems(updatedItems);
    setTempQty(1); 
    if(useCustomSize) setCustomSize('');
    setServiceLocation('');
    setServiceDimensions('');
  };

  const handleRemoveItem = (id: string) => setOrderItems(orderItems.filter(i => i.id !== id));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                setNewOrder(prev => ({
                    ...prev, 
                    referenceImages: [...(prev.referenceImages || []), reader.result as string]
                }));
            }
        };
        reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const updated = [...(newOrder.referenceImages || [])];
    updated.splice(index, 1);
    setNewOrder({...newOrder, referenceImages: updated});
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.clientId) return alert('⚠️ Selecciona un CLIENTE.');
    if (orderItems.length === 0) return alert('⚠️ Agrega al menos una prenda/servicio.');

    const client = clients.find(c => c.id === newOrder.clientId);
    const clientDisplayName = client ? (client.businessName || client.name) : 'Desconocido';

    const isCustomFabric = newOrder.fabricType?.includes('Otro') || newOrder.fabricType === 'Otro';
    const isCustomModel = newOrder.garmentModel?.includes('Otro') || newOrder.garmentModel === 'Otro';

    const finalFabric = isCustomFabric ? customFabric : newOrder.fabricType;
    const finalModel = isCustomModel ? customModel : newOrder.garmentModel;
    
    if (!finalModel) return alert('⚠️ Indica el Modelo o Servicio específico.');

    let finalDescription = newOrder.description || '';
    if (orderMode === 'Sublimacion' && sublimationMeters) {
        const cleanDesc = finalDescription.replace(/\[Consumo Estimado: .*? mts\]/g, '').trim();
        finalDescription = `${cleanDesc}\n\n[Consumo Estimado: ${sublimationMeters} mts]`;
    }

    const originalCreatedAt = editingId ? orders.find(o => o.id === editingId)?.createdAt || Date.now() : Date.now();
    const originalReceptionDate = editingId ? orders.find(o => o.id === editingId)?.receptionDate || Date.now() : Date.now();

    const deadlineString = `${deadlineDate}T${useSpecificTime ? deadlineTime : '23:59:00'}`;
    const deadlineTimestamp = new Date(deadlineString).getTime();

    const processedItems = orderItems.map(i => ({
        ...i, 
        type: orderMode === 'General' ? (finalModel || 'Prenda') : (i.type || finalModel || 'Servicio')
    }));

    const order: Order = {
      id: editingId || crypto.randomUUID(),
      orderNumber: nextOrderNumber,
      clientId: newOrder.clientId,
      clientName: clientDisplayName,
      fabricColor: newOrder.fabricColor || 'Varios',
      fabricType: finalFabric || 'Desconocido',
      garmentModel: finalModel || 'Prenda',
      description: finalDescription.trim(),
      referenceImages: newOrder.referenceImages || [],
      items: processedItems,
      totalAmount: Number(newOrder.totalAmount) || 0,
      status: newOrder.status || OrderStatus.RECEIVED,
      priority: newOrder.priority || 'Normal',
      receptionDate: originalReceptionDate,
      deadline: isNaN(deadlineTimestamp) ? Date.now() + 604800000 : deadlineTimestamp,
      createdAt: originalCreatedAt
    };

    if (editingId) onUpdateOrder(order);
    else onAddOrder(order);
    
    setIsModalOpen(false); 
    resetForm();
  };

  const handleEditClick = (order: Order) => {
      setEditingId(order.id);
      setNextOrderNumber(order.orderNumber);
      
      const d = new Date(order.deadline);
      const isoDate = d.toISOString().split('T')[0];
      const isoTime = d.toTimeString().slice(0, 5);
      
      setDeadlineDate(isoDate);
      if (isoTime === '23:59') {
          setDeadlineTime('17:00');
          setUseSpecificTime(false);
      } else {
          setDeadlineTime(isoTime);
          setUseSpecificTime(true);
      }

      let detectedMode: 'General' | 'Bordado' | 'Sublimacion' | 'Costura' = 'General';
      
      if (order.garmentModel === 'Otro (Bordado)') detectedMode = 'Bordado';
      else if (order.garmentModel === 'Otro (Sublimación)') detectedMode = 'Sublimacion';
      else if (order.garmentModel === 'Otro (Costura)') detectedMode = 'Costura';
      else if (EMBROIDERY_OPTIONS.includes(order.garmentModel) || order.items.some(i => i.type && i.type.toLowerCase().includes('bordado'))) {
          detectedMode = 'Bordado';
      } else if (SUBLIMATION_OPTIONS.includes(order.garmentModel) || order.items.some(i => i.type && i.type.toLowerCase().includes('sublima'))) {
          detectedMode = 'Sublimacion';
      } else if (SEWING_OPTIONS.includes(order.garmentModel) || order.items.some(i => i.type && (i.type.toLowerCase().includes('ruedo') || i.type.toLowerCase().includes('costura')))) {
          detectedMode = 'Costura';
      }
      setOrderMode(detectedMode);

      let desc = order.description || '';
      let meters = '';
      if (detectedMode === 'Sublimacion') {
           const match = desc.match(/\[Consumo Estimado: (.*?) mts\]/);
           if (match) {
               meters = match[1];
               desc = desc.replace(match[0], '').trim();
           }
      }
      setSublimationMeters(meters);

      const isCustomModel = !STANDARD_MODELS.includes(order.garmentModel) && !EMBROIDERY_OPTIONS.includes(order.garmentModel) && !SUBLIMATION_OPTIONS.includes(order.garmentModel) && !SEWING_OPTIONS.includes(order.garmentModel);
      const isCustomFabric = !FABRIC_OPTIONS.includes(order.fabricType);

      if (isCustomModel) setCustomModel(order.garmentModel);
      if (isCustomFabric) setCustomFabric(order.fabricType);

      setNewOrder({
          clientId: order.clientId,
          fabricColor: order.fabricColor,
          fabricType: isCustomFabric ? 'Otro' : order.fabricType,
          garmentModel: isCustomModel ? 'Otro' : order.garmentModel,
          description: desc,
          referenceImages: order.referenceImages,
          status: order.status,
          priority: order.priority,
          totalAmount: order.totalAmount
      });
      
      setOrderItems(order.items);
      setIsDetailOpen(false);
      setIsModalOpen(true);
  };

  const handleQuickService = async (type: 'Bordado' | 'Sublimacion' | 'Costura') => {
      resetForm();
      const nextNum = await StorageService.getNextOrderNumber();
      setNextOrderNumber(nextNum);
      setOrderMode(type); 
      const defaultColor = type === 'Sublimacion' ? 'Full Color / CMYK' : 'N/A';
      setNewOrder({
          ...initialFormState,
          garmentModel: '', 
          fabricType: 'Proporcionada por Cliente',
          fabricColor: defaultColor 
      });
      setIsModalOpen(true);
  };

  const handleDownloadPdf = async () => {
      if (!printRef.current) return;
      setIsGeneratingPdf(true);
      setTimeout(async () => {
          try {
              const element = printRef.current;
              if (!element) throw new Error("Elemento de impresión no encontrado");
              const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false, width: 794, height: 1123, backgroundColor: '#ffffff' });
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
              pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
              pdf.save(`Orden_${selectedOrder?.orderNumber || 'Nueva'}.pdf`);
          } catch (err) {
              console.error("Error generando PDF:", err);
              alert("Hubo un error al generar el PDF. Intenta de nuevo.");
          } finally {
              setIsGeneratingPdf(false);
          }
      }, 500); 
  };

  const resetForm = () => { 
      setNewOrder(initialFormState); setOrderItems([]); setCustomFabric(''); setCustomModel(''); setClientSearch('');
      setEditingId(null); setTempColor(''); setUseSpecificColor(false); setUseSpecificTime(false);
      setOrderMode('General'); setSublimationMeters(''); setServiceLocation(''); setServiceDimensions('');
  };

  const currentModelOptions = useMemo(() => {
      switch(orderMode) {
          case 'Bordado': return EMBROIDERY_OPTIONS;
          case 'Sublimacion': return SUBLIMATION_OPTIONS;
          case 'Costura': return SEWING_OPTIONS;
          default: return STANDARD_MODELS;
      }
  }, [orderMode]);

  const getServiceTitle = () => {
      switch(orderMode) {
          case 'Bordado': return 'SERVICIO DE BORDADO';
          case 'Sublimacion': return 'SERVICIO DE SUBLIMACIÓN';
          case 'Costura': return 'SERVICIO DE COSTURA';
          default: return 'PEDIDO DE CONFECCIÓN';
      }
  };
  
  const getServiceTheme = () => {
      switch(orderMode) {
          case 'Bordado': return { border: 'border-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500', soft: 'bg-indigo-500/10' };
          case 'Sublimacion': return { border: 'border-pink-500', text: 'text-pink-400', bg: 'bg-pink-500', soft: 'bg-pink-500/10' };
          case 'Costura': return { border: 'border-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500', soft: 'bg-emerald-500/10' };
          default: return { border: 'border-white/10', text: 'text-white', bg: 'bg-white', soft: 'bg-white/5' };
      }
  };

  const openDetail = (order: Order) => { setSelectedOrder(order); setIsDetailOpen(true); };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
        case OrderStatus.RECEIVED: return 'border-gray-500 text-gray-300 bg-gray-500/10';
        case OrderStatus.PENDING_CUT: case OrderStatus.PENDING_SEW: return 'border-orange-500 text-orange-400 bg-orange-500/10';
        case OrderStatus.CUTTING: case OrderStatus.SEWING: return 'border-blue-500 text-blue-400 bg-blue-500/10 animate-pulse-slow';
        case OrderStatus.READY: return 'border-emerald-500 text-emerald-400 bg-emerald-500/10';
        case OrderStatus.DELIVERED: return 'border-green-500 text-green-400 bg-green-500/10';
        case OrderStatus.CANCELLED: return 'border-red-500 text-red-400 bg-red-500/10';
        case OrderStatus.TRASH: return 'border-slate-700 text-slate-500 bg-slate-500/5';
        default: return 'border-purple-500 text-purple-400 bg-purple-500/10';
    }
  };

  const getStatusDotColor = (status: OrderStatus) => {
      const colorClass = getStatusColor(status);
      if (colorClass.includes('emerald') || colorClass.includes('green')) return 'bg-emerald-500';
      if (colorClass.includes('blue')) return 'bg-blue-500';
      if (colorClass.includes('orange')) return 'bg-orange-500';
      if (colorClass.includes('red')) return 'bg-red-500';
      return 'bg-slate-400';
  };

  const counts = useMemo(() => {
    return {
        embroidery: orders.filter(o => checkCategory(o, 'embroidery') && o.status !== OrderStatus.TRASH).length,
        sublimation: orders.filter(o => checkCategory(o, 'sublimation') && o.status !== OrderStatus.TRASH).length,
        sewing: orders.filter(o => checkCategory(o, 'sewing') && o.status !== OrderStatus.TRASH).length,
        start: orders.filter(o => checkStatus(o, 'start')).length,
        production: orders.filter(o => checkStatus(o, 'production')).length,
        finish: orders.filter(o => checkStatus(o, 'finish')).length,
        attention: orders.filter(o => checkStatus(o, 'attention')).length,
        trash: orders.filter(o => o.status === OrderStatus.TRASH).length,
    }
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const now = Date.now();
    return orders.filter(o => {
        const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              o.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = checkStatus(o, statusFilter);
        const matchesCategory = checkCategory(o, categoryFilter);
        let matchesTime = true;
        if (timeFilter !== 'all') {
            const oneDay = 24 * 60 * 60 * 1000;
            if (timeFilter === 'week') matchesTime = (now - o.createdAt) <= (oneDay * 7);
            else if (timeFilter === 'month') matchesTime = (now - o.createdAt) <= (oneDay * 30);
        }
        return matchesSearch && matchesStatus && matchesCategory && matchesTime;
    });
  }, [orders, searchTerm, statusFilter, categoryFilter, timeFilter]);

  const FilterChip = ({ active, onClick, icon: Icon, label, activeClass, count }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${active ? `${activeClass} shadow-lg scale-105 ring-1 ring-white/20` : 'bg-black/30 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
        <Icon size={16} />
        <span className="font-bold text-xs uppercase tracking-wide">{label}</span>
        {count !== undefined && (
            <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md font-black ${active ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'}`}>
                {count}
            </span>
        )}
    </button>
  );

  return (
    <div className="space-y-8 animate-enter h-full">
      {/* GLOBAL BACKDROP FOR MENUS */}
      {activeStatusMenu && (
          <div className="fixed inset-0 z-[50]" onClick={() => setActiveStatusMenu(null)}></div>
      )}

      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 print:hidden">
        <div>
          <h2 className="text-3xl md:text-5xl font-display font-black text-white mb-2 tracking-tight">PEDIDOS <span className="text-base align-middle bg-white/10 text-white px-2 py-1 rounded-lg ml-2">{filteredOrders.length}</span></h2>
          <p className="text-slate-400 font-medium text-base">Gestión de flujo de trabajo y producción.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-stretch">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar pedido..." className="w-full sm:w-64 pl-12 pr-4 py-4 glass-input rounded-xl outline-none focus:ring-2 focus:ring-primary-500 text-base font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${showFilters ? 'bg-white text-black border-white' : 'glass-input border-white/10 hover:bg-white/10'}`}><Filter size={22} /></button>
                <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-gradient-to-r from-primary-600 to-purple-600 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all font-bold tracking-wide uppercase text-sm"><Plus size={22} /> <span className="hidden sm:inline">Nuevo</span></button>
            </div>

            {/* QUICK SERVICE ACTIONS */}
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button onClick={() => handleQuickService('Bordado')} className="flex flex-col items-center justify-center px-4 py-2 rounded-lg hover:bg-indigo-500/20 hover:text-indigo-300 text-slate-400 transition-all group" title="Servicio Bordado">
                    <Feather size={20} className="mb-0.5 group-hover:scale-110 transition-transform"/>
                    <span className="text-[9px] font-bold uppercase">Bordado</span>
                </button>
                <div className="w-px h-8 bg-white/10"></div>
                <button onClick={() => handleQuickService('Sublimacion')} className="flex flex-col items-center justify-center px-4 py-2 rounded-lg hover:bg-pink-500/20 hover:text-pink-300 text-slate-400 transition-all group" title="Servicio Sublimación">
                    <Printer size={20} className="mb-0.5 group-hover:scale-110 transition-transform"/>
                    <span className="text-[9px] font-bold uppercase">Sublimación</span>
                </button>
                <div className="w-px h-8 bg-white/10"></div>
                <button onClick={() => handleQuickService('Costura')} className="flex flex-col items-center justify-center px-4 py-2 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-400 transition-all group" title="Servicio Industrial">
                    <Briefcase size={20} className="mb-0.5 group-hover:scale-110 transition-transform"/>
                    <span className="text-[9px] font-bold uppercase">Costura</span>
                </button>
            </div>
        </div>
      </div>

      {showFilters && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 animate-enter mb-8 shadow-xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                {/* 1. Category Filter */}
                <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2 mb-3"><Tag size={14} className="text-primary-400"/> Tipo de Servicio</h4>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip active={categoryFilter === 'all'} onClick={() => setCategoryFilter('all')} icon={Layers} label="Todos" count={orders.filter(o => o.status !== OrderStatus.TRASH).length} activeClass="bg-white text-black" />
                        <FilterChip active={categoryFilter === 'embroidery'} onClick={() => setCategoryFilter('embroidery')} icon={Feather} label="Bordado" count={counts.embroidery} activeClass="bg-indigo-600 text-white border-indigo-500" />
                        <FilterChip active={categoryFilter === 'sublimation'} onClick={() => setCategoryFilter('sublimation')} icon={Printer} label="Sublimación" count={counts.sublimation} activeClass="bg-pink-600 text-white border-pink-500" />
                        <FilterChip active={categoryFilter === 'sewing'} onClick={() => setCategoryFilter('sewing')} icon={Scissors} label="Costura" count={counts.sewing} activeClass="bg-emerald-600 text-white border-emerald-500" />
                    </div>
                </div>

                {/* 2. Status Filter - UPDATED TO MATCH DROPDOWN GROUPS */}
                <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2 mb-3"><Clock size={14} className="text-primary-400"/> Estado del Pedido</h4>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')} icon={Layers} label="Activos" activeClass="bg-white text-black" />
                        <FilterChip active={statusFilter === 'start'} onClick={() => setStatusFilter('start')} icon={Clock} label="Por Iniciar" count={counts.start} activeClass="bg-yellow-500/20 border-yellow-500 text-yellow-400" />
                        <FilterChip active={statusFilter === 'production'} onClick={() => setStatusFilter('production')} icon={Scissors} label="En Producción" count={counts.production} activeClass="bg-blue-500/20 border-blue-500 text-blue-400" />
                        <FilterChip active={statusFilter === 'finish'} onClick={() => setStatusFilter('finish')} icon={CheckCircle2} label="Finalización" count={counts.finish} activeClass="bg-emerald-500/20 border-emerald-500 text-emerald-400" />
                        <FilterChip active={statusFilter === 'attention'} onClick={() => setStatusFilter('attention')} icon={AlertTriangle} label="Atención" count={counts.attention} activeClass="bg-red-500/20 border-red-500 text-red-400" />
                        {/* TRASH FILTER */}
                        <FilterChip active={statusFilter === 'trash'} onClick={() => setStatusFilter('trash')} icon={Trash2} label="Papelera" count={counts.trash} activeClass="bg-slate-700 text-slate-300 border-slate-600" />
                    </div>
                </div>

                {/* 3. Time Filter */}
                <div>
                    <h4 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2 mb-3"><Calendar size={14} className="text-primary-400"/> Fecha / Creación</h4>
                    <div className="flex flex-wrap gap-2">
                        <FilterChip active={timeFilter === 'all'} onClick={() => setTimeFilter('all')} icon={Layers} label="(SIN FECHA)" activeClass="bg-white text-black" />
                        <FilterChip active={timeFilter === 'month'} onClick={() => setTimeFilter('month')} icon={Calendar} label="Este Mes" activeClass="bg-purple-500/20 border-purple-500 text-purple-400" />
                        <FilterChip active={timeFilter === 'week'} onClick={() => setTimeFilter('week')} icon={Zap} label="Recientes (7d)" activeClass="bg-yellow-500/20 border-yellow-500 text-yellow-400" />
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* ORDERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 print:hidden pb-24">
         {filteredOrders.length > 0 ? filteredOrders.map(order => {
             const daysLeft = Math.ceil((order.deadline - Date.now()) / (1000 * 60 * 60 * 24));
             const isOverdue = daysLeft < 0 && order.status !== OrderStatus.DELIVERED;
             const totalQty = order.items.reduce((acc, i) => acc + i.quantity, 0);
             
             return (
                 <div key={order.id} className="relative overflow-visible flex flex-col h-full bg-[#18122B] border border-white/10 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:border-primary-500/30 transition-all duration-300 group cursor-default z-0">
                     
                     {/* Side Status Bar */}
                     <div className={`absolute top-0 bottom-0 left-0 w-2 rounded-l-[2.5rem] ${isOverdue ? 'bg-red-500' : 'bg-gradient-to-b from-primary-500 via-purple-500 to-blue-500'}`}></div>
                     
                     <div className="flex flex-col h-full p-6 pl-8">
                        {/* ... (Header and Status Dropdown logic remains) ... */}
                        <div className="flex justify-between items-start mb-5 relative z-20">
                            <span className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white font-mono text-xs font-bold tracking-wider">
                                {order.orderNumber}
                            </span>
                            <div className="relative">
                                <button 
                                    onClick={() => setActiveStatusMenu(activeStatusMenu === order.id ? null : order.id)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest border flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg ${getStatusColor(order.status)}`}
                                >
                                    {order.status} <ChevronDown size={12} strokeWidth={3}/>
                                </button>
                                {activeStatusMenu === order.id && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-[#0f0a29] border border-white/20 rounded-xl shadow-2xl z-[100] overflow-hidden animate-enter">
                                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                            {Object.entries(STATUS_MENU_GROUPS).map(([group, statuses]) => (
                                                <div key={group}>
                                                    <div className="px-4 py-2 bg-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-white/5">{group}</div>
                                                    {statuses.map((status) => (
                                                        <button 
                                                            key={status}
                                                            onClick={() => { onUpdateStatus(order.id, status); setActiveStatusMenu(null); }}
                                                            className={`w-full text-left px-4 py-3 text-xs font-bold hover:bg-white/10 transition-colors flex items-center gap-3 ${order.status === status ? 'text-primary-400 bg-primary-500/10' : 'text-slate-300'}`}
                                                        >
                                                            <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`}></div>
                                                            {status}
                                                            {order.status === status && <CheckCircle2 size={14} className="ml-auto text-primary-500"/>}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BODY SECTIONS ... */}
                        <div className="mb-6 relative z-0">
                            <h3 className="font-display font-black text-3xl text-white leading-none tracking-tight mb-2 group-hover:text-primary-300 transition-colors uppercase line-clamp-1">{order.clientName}</h3>
                            {order.priority !== 'Normal' && (<span className={`inline-block mt-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${order.priority.includes('Muy') ? 'border-red-500 text-red-400 bg-red-500/10' : 'border-orange-500 text-orange-400 bg-orange-500/10'}`}>{order.priority}</span>)}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6 flex-1">
                             <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex flex-col justify-center">
                                 <p className="text-[9px] uppercase text-blue-300 font-bold mb-1 tracking-wider">Modelo / Servicio</p>
                                 <p className="text-white font-bold text-sm leading-tight line-clamp-2">{order.garmentModel}</p>
                             </div>
                             <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex flex-col justify-center">
                                 <p className="text-[9px] uppercase text-purple-300 font-bold mb-1 tracking-wider">Material</p>
                                 <p className="text-white font-bold text-sm leading-tight line-clamp-2">{order.fabricType}</p>
                             </div>
                        </div>

                        <div className="mb-6 flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                             <div className="w-8 h-8 rounded-full border border-white/20 shadow-sm flex-shrink-0" style={{backgroundColor: order.fabricColor && order.fabricColor !== 'N/A' ? order.fabricColor : '#fff'}}></div>
                             <div className="min-w-0"><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Color Base</p><p className="text-sm font-bold text-white truncate">{order.fabricColor}</p></div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
                            <div className={`flex items-center gap-3 ${isOverdue ? 'text-red-400' : 'text-slate-300'}`}>
                                <div className="p-2 bg-white/5 rounded-lg"><CalendarDays size={18} /></div>
                                <div><p className="text-[9px] font-bold uppercase tracking-widest opacity-60">Entrega</p><span className="font-bold text-sm font-mono tracking-tight">{new Date(order.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                            </div>
                            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                                <div className="flex flex-col items-end"><span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Total</span><div className="bg-primary-600 text-white px-3 py-1 rounded-lg shadow-lg shadow-primary-900/50"><span className="text-lg font-black">{totalQty}</span> <span className="text-[10px] font-bold opacity-80">PZS</span></div></div>
                            </div>
                        </div>
                        
                        {/* EXPLICIT ACTION BUTTONS with TRASH */}
                        <div className="mt-5 grid grid-cols-5 gap-2">
                             <button onClick={() => openDetail(order)} className="col-span-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                 <Eye size={16}/> Ver
                             </button>
                             <button onClick={() => handleEditClick(order)} className="col-span-2 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 rounded-xl text-xs font-bold text-indigo-300 hover:text-white uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                                 <Pencil size={16}/> Editar
                             </button>
                             
                             {/* TRASH BUTTON */}
                             {order.status !== OrderStatus.TRASH ? (
                                 <button 
                                    onClick={() => { if(confirm('¿Mover pedido a la papelera?')) onUpdateStatus(order.id, OrderStatus.TRASH); }} 
                                    className="col-span-1 py-3 bg-white/5 hover:bg-red-500/20 border border-white/5 hover:border-red-500/40 rounded-xl text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center" title="Mover a Papelera"
                                 >
                                     <Trash2 size={18}/>
                                 </button>
                             ) : (
                                 <button 
                                    onClick={() => { if(confirm('¿Restaurar pedido?')) onUpdateStatus(order.id, OrderStatus.RECEIVED); }} 
                                    className="col-span-1 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 hover:text-white transition-colors flex items-center justify-center" title="Restaurar"
                                 >
                                     <ArchiveRestore size={18}/>
                                 </button>
                             )}
                        </div>

                     </div>
                 </div>
             )
         }) : (
             <div className="col-span-full py-24 text-center glass-card rounded-[2.5rem] border-dashed border-white/10 flex flex-col items-center justify-center">
                 <Package size={48} className="text-slate-600 mb-6"/>
                 <h3 className="text-2xl font-bold text-slate-300">No hay pedidos</h3>
                 <p className="text-slate-500 mt-2">Ajusta los filtros para ver resultados.</p>
             </div>
         )}
      </div>

      {/* ... (Create Modal and Print Modal remain unchanged) ... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 p-2 md:p-6 backdrop-blur-2xl">
            {/* ... Modal Content as provided previously ... */}
            <div className="bg-[#050314] w-full max-w-[95vw] h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden animate-enter border border-white/10">
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-6 border-b border-white/5 bg-[#0a0520] relative z-20 shrink-0">
                    <div>
                        <h3 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
                            {editingId ? 'EDITAR' : 'NUEVO'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-purple-400">{getServiceTitle()}</span>
                        </h3>
                        <p className="text-sm text-slate-400 font-mono tracking-widest mt-1 opacity-80">{nextOrderNumber}</p>
                    </div>
                    <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-white p-3 hover:bg-white/10 rounded-full transition-colors"><X size={28} /></button>
                </div>
                {/* ... (Rest of Modal Code - Copied to ensure integrity but hidden for brevity as requested only changes) ... */}
                {/* NOTE: Since I am replacing the full file content, I must ensure the modal code is included. I will re-inject the modal code from previous turn here. */}
                
                {/* Main Content Grid */}
                <div className="flex-1 overflow-hidden relative z-10 flex flex-col lg:flex-row">
                    {/* LEFT PANEL */}
                    <div className="w-full lg:w-[480px] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-[#0a0520]/80 overflow-y-auto custom-scrollbar">
                        <div className="p-8 space-y-10">
                            {/* PASO 1 */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-black text-primary-400 uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-3">
                                    <span className="bg-primary-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(217,70,239,0.5)]">1</span> Cliente & Entrega
                                </h4>
                                <div className="space-y-6">
                                    {/* Client Search Block */}
                                    <div className="relative group">
                                         {newOrder.clientId ? (
                                            <div className="bg-primary-900/10 border border-primary-500/40 p-4 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-primary-500 p-2 rounded-lg text-black"><User size={20}/></div>
                                                    <div>
                                                        <p className="font-bold text-white text-base">{clients.find(c => c.id === newOrder.clientId)?.businessName || clients.find(c => c.id === newOrder.clientId)?.name}</p>
                                                        <p className="text-xs text-primary-200/70 uppercase font-bold tracking-wider">Cliente seleccionado</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setNewOrder({...newOrder, clientId: ''})} className="text-slate-400 hover:text-white p-2"><X size={20}/></button>
                                            </div>
                                        ) : (
                                            <>
                                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                                <input type="text" placeholder="Buscar cliente o negocio..." className="w-full pl-14 pr-4 py-4 bg-black/40 border border-white/10 rounded-2xl focus:border-primary-500 outline-none text-white text-base font-medium transition-all focus:bg-black/60" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                                                {clientSearch && (
                                                    <div className="absolute z-50 w-full bg-[#150a35] border border-white/20 rounded-2xl shadow-2xl max-h-56 overflow-auto mt-2 p-2">
                                                        {clients.filter(c => (c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.businessName && c.businessName.toLowerCase().includes(clientSearch.toLowerCase())))).map(c => (
                                                            <div key={c.id} onClick={() => {setNewOrder({...newOrder, clientId: c.id}); setClientSearch('')}} className="p-3 hover:bg-white/10 cursor-pointer rounded-xl text-sm text-slate-200 font-medium"><span className="block font-bold text-white">{c.businessName || c.name}</span>{c.businessName && <span className="text-xs text-slate-400">{c.name}</span>}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {/* Dates */}
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/10">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-xs text-slate-300 font-bold uppercase tracking-wider">Fecha de Entrega</label>
                                            <button onClick={() => setUseSpecificTime(!useSpecificTime)} className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors px-2 py-1 rounded hover:bg-white/5 ${useSpecificTime ? 'text-primary-400' : 'text-slate-500'}`}>{useSpecificTime ? <ToggleRight size={22}/> : <ToggleLeft size={22}/>} Definir Hora?</button>
                                        </div>
                                        <div className="flex gap-3">
                                            <input type="date" className="flex-1 p-3 bg-white/5 rounded-xl text-white text-sm outline-none border border-white/10 focus:border-primary-500 transition-colors font-mono" value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                                            {useSpecificTime && (<input type="time" className="w-28 p-3 bg-white/5 rounded-xl text-white text-sm outline-none border border-white/10 font-mono animate-enter" value={deadlineTime} onChange={e => setDeadlineTime(e.target.value)} />)}
                                        </div>
                                    </div>
                                    {/* Priority */}
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase mb-2 block tracking-wider">Prioridad</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['Normal', 'Urgente', 'Muy Urgente'].map(p => (
                                                <button key={p} onClick={() => setNewOrder({...newOrder, priority: p as any})} className={`py-3 rounded-xl text-xs font-bold uppercase border transition-all ${newOrder.priority === p ? (p === 'Normal' ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : p === 'Urgente' ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.2)]' : 'bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]') : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10 hover:text-white'}`}>{p}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Status Edit */}
                                    {editingId && (
                                        <div>
                                            <label className="text-xs text-slate-400 font-bold uppercase mb-2 block tracking-wider">Estado del Pedido</label>
                                            <div className="relative">
                                                <select className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none text-sm appearance-none font-medium focus:border-blue-500 transition-colors" value={newOrder.status} onChange={e => setNewOrder({...newOrder, status: e.target.value as OrderStatus})}>
                                                    {Object.entries(STATUS_MENU_GROUPS).map(([group, statuses]) => (<optgroup key={group} label={group} className="bg-[#0f0529] text-primary-400 font-bold">{statuses.map(status => (<option key={status} value={status} className="bg-[#0f0529] text-white font-medium pl-4">{status}</option>))}</optgroup>))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18}/>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* PASO 2 */}
                            <div className="space-y-6">
                                <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-3 border-b border-white/5 pb-3">
                                    <span className="bg-blue-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]">2</span> {orderMode === 'General' ? 'La Prenda' : 'El Servicio'}
                                </h4>
                                <div className="space-y-5">
                                    {/* Mode Switcher */}
                                    <div className="flex p-1 bg-black/40 rounded-xl mb-4 border border-white/10">
                                        {['General', 'Bordado', 'Sublimacion', 'Costura'].map(mode => (
                                            <button key={mode} onClick={() => { setOrderMode(mode as any); setNewOrder({...newOrder, garmentModel: ''}); }} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${orderMode === mode ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{mode}</button>
                                        ))}
                                    </div>
                                    {/* Model */}
                                    <div>
                                        <label className="text-xs font-bold text-indigo-200/80 uppercase ml-1 mb-1.5 block">{orderMode === 'General' ? 'Modelo Base' : 'Tipo de Trabajo'}</label>
                                        <div className="relative">
                                            <select className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none text-sm appearance-none font-medium focus:border-blue-500 transition-colors" value={newOrder.garmentModel} onChange={e => setNewOrder({...newOrder, garmentModel: e.target.value})}>
                                                <option value="" disabled>Seleccionar opción...</option>
                                                {currentModelOptions.map(opt => <option key={opt} className="bg-[#0f0529]">{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18}/>
                                        </div>
                                        {newOrder.garmentModel?.includes('Otro') && <input type="text" placeholder="Escribir detalle manual..." className="w-full p-3 mt-3 glass-input rounded-xl text-sm" value={customModel} onChange={e => setCustomModel(e.target.value)} />}
                                    </div>
                                    {/* Fabric */}
                                    <div>
                                        <label className="text-xs font-bold text-indigo-200/80 uppercase ml-1 mb-1.5 block">Tipo de Tela / Material</label>
                                        <div className="relative">
                                            <select className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none text-sm appearance-none font-medium focus:border-blue-500 transition-colors" value={newOrder.fabricType} onChange={e => setNewOrder({...newOrder, fabricType: e.target.value})}>
                                                <option value="" disabled>Selecciona la tela</option>
                                                {FABRIC_OPTIONS.map(opt => <option key={opt} className="bg-[#0f0529]">{opt}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18}/>
                                        </div>
                                        {newOrder.fabricType?.includes('Otro') && <input type="text" placeholder="Escribir tela..." className="w-full p-3 mt-3 glass-input rounded-xl text-sm" value={customFabric} onChange={e => setCustomFabric(e.target.value)} />}
                                    </div>
                                    {orderMode === 'Sublimacion' && (
                                        <div className="animate-enter bg-pink-500/10 p-4 rounded-2xl border border-pink-500/20">
                                            <label className="text-xs font-bold text-pink-300 uppercase ml-1 mb-1.5 block flex items-center gap-2"><Ruler size={14}/> Consumo de Papel/Tela (Metros)</label>
                                            <input type="text" placeholder="Ej. 2.5 mts" className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl outline-none text-white text-base font-bold placeholder-slate-600 focus:border-pink-500 transition-colors" value={sublimationMeters} onChange={e => setSublimationMeters(e.target.value)} />
                                        </div>
                                    )}
                                    {orderMode !== 'Sublimacion' && (
                                        <div className="animate-enter">
                                            <label className="text-xs font-bold text-indigo-200/80 uppercase ml-1 mb-1.5 block">Color Base (General)</label>
                                            <div className="flex gap-3">
                                                <div className="w-12 h-12 rounded-xl border border-white/20 shrink-0 shadow-inner" style={{backgroundColor: newOrder.fabricColor && newOrder.fabricColor !== 'N/A' ? newOrder.fabricColor : 'transparent'}}></div>
                                                <input type="text" placeholder="Ej. Azul Marino" className="flex-1 p-4 bg-black/40 border border-white/10 rounded-2xl outline-none text-white text-base font-bold placeholder-slate-600 focus:border-blue-500 transition-colors" value={newOrder.fabricColor} onChange={e => setNewOrder({...newOrder, fabricColor: e.target.value})} />
                                            </div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-4 border border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-xs font-bold transition-all uppercase tracking-wider group relative overflow-hidden border-white/20 hover:bg-white/5 hover:border-white/40 cursor-pointer text-slate-400">
                                            <CloudUpload size={24} className="text-slate-500 group-hover:text-white transition-colors"/> <span className="group-hover:text-white transition-colors">Subir Foto</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                                        <textarea className="p-4 bg-black/40 border border-white/10 rounded-2xl outline-none text-xs md:text-sm text-white resize-none focus:border-blue-500 transition-colors" rows={3} placeholder="Notas rápidas..." value={newOrder.description} onChange={e => setNewOrder({...newOrder, description: e.target.value})} />
                                    </div>
                                    {newOrder.referenceImages && newOrder.referenceImages.length > 0 && (
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {newOrder.referenceImages.map((img, idx) => (
                                                <div key={idx} className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden relative group shrink-0 bg-black">
                                                    <img src={img} className="w-full h-full object-cover"/>
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                        <button type="button" onClick={() => window.open(img, '_blank')} className="text-white hover:text-blue-400"><Eye size={14}/></button>
                                                        <button type="button" onClick={() => handleRemoveImage(idx)} className="text-white hover:text-red-400"><X size={14}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* RIGHT PANEL - Same as previous, condensed logic included */}
                    <div className="flex-1 bg-[#050314] flex flex-col relative">
                        {/* VALIDATION OVERLAY */}
                        {!isReadyForItems && (<div className="absolute inset-0 z-50 bg-[#050314]/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 animate-enter"><div className="p-6 bg-black/40 border border-white/10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm"><Lock size={32} className="text-slate-400 mb-4"/><h4 className="text-xl font-black text-white mb-2">Sección Bloqueada</h4><p className="text-slate-400 text-sm">Completa el Paso 1 y 2.</p></div></div>)}
                        
                        <div className="px-8 py-5 border-b border-white/5 bg-[#0a0520]/50"><h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3"><span className="bg-emerald-500 text-black w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">3</span> {orderMode === 'General' ? 'Matriz de Tallas' : 'Matriz Industrial'}</h4></div>
                        
                        <div className="p-6 md:p-8">
                            {orderMode === 'General' ? (
                                <>
                                    <div className="grid grid-cols-4 gap-3 mb-6">{GENDER_ORDER.map(g => (<button key={g} onClick={() => setTempGender(g)} className={`py-3 rounded-xl border text-[11px] md:text-xs font-black uppercase tracking-wider transition-all ${tempGender === g ? getGenderColorStyles(g).bg + ' ' + getGenderColorStyles(g).border + ' ' + getGenderColorStyles(g).text : 'bg-white/5 border-transparent text-slate-500'}`}>{g}</button>))}</div>
                                    <div className={`p-6 rounded-3xl border transition-colors flex flex-col gap-5 ${getGenderColorStyles(tempGender).bg} ${getGenderColorStyles(tempGender).border}`}>
                                        <div className="flex gap-4 items-end">
                                            <div className="flex-1 min-w-[100px]"><label className="text-[11px] font-bold uppercase mb-2 block tracking-wider text-slate-400">Talla</label>{useCustomSize ? <input className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-black text-center uppercase" value={customSize} onChange={e=>setCustomSize(e.target.value)} placeholder="TXT"/> : <select className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-black text-center" value={tempSize} onChange={e=>setTempSize(e.target.value)}>{(tempGender==='Niño'||tempGender==='Niña' ? ['2','4','6','8','10','12','14','16'] : ['XS','S','M','L','XL','2XL','3XL']).map(s=><option className="bg-black" key={s}>{s}</option>)}</select>}</div>
                                            <div className="w-24"><label className="text-[11px] font-bold uppercase mb-2 block tracking-wider text-slate-400">Cant.</label><input type="number" min="1" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-black text-center" value={tempQty} onChange={e=>setTempQty(Number(e.target.value))}/></div>
                                            <button onClick={handleAddItem} className={`p-3.5 rounded-xl shadow-lg hover:scale-105 transition-transform active:scale-95 mb-0.5 ${getGenderColorStyles(tempGender).badge}`}><Plus size={24} strokeWidth={3}/></button>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded-xl border border-white/5"><button onClick={()=>setUseSpecificColor(!useSpecificColor)} className="flex items-center gap-3 mb-2 text-[10px] font-bold uppercase text-slate-500">{useSpecificColor ? <ToggleRight size={24} className="text-white"/> : <ToggleLeft size={24}/>} Color Específico?</button>{useSpecificColor && <input type="text" className="bg-transparent border-none text-white text-sm w-full outline-none font-bold" placeholder="Escribe el color..." value={tempColor} onChange={e=>setTempColor(e.target.value)} autoFocus/>}</div>
                                        <button onClick={() => setUseCustomSize(!useCustomSize)} className="text-[10px] font-bold uppercase underline opacity-60 hover:opacity-100 text-left text-slate-400">{useCustomSize ? 'Usar lista estándar' : '¿Talla manual?'}</button>
                                    </div>
                                </>
                            ) : (
                                <div className={`p-6 rounded-3xl border transition-colors flex flex-col gap-5 ${getServiceTheme().bg.replace('bg-', 'bg-opacity-10 ')} ${getServiceTheme().border}`}>
                                    <div className="flex flex-col gap-4">
                                        <div><label className="text-[11px] font-bold uppercase mb-2 block tracking-wider text-slate-400">Ubicación</label><div className="relative"><MousePointer2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" className="w-full pl-10 p-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm" value={serviceLocation} onChange={e=>setServiceLocation(e.target.value)} placeholder="Ej: Pecho"/></div></div>
                                        <div className="flex gap-4 items-end"><div className="flex-1"><label className="text-[11px] font-bold uppercase mb-2 block tracking-wider text-slate-400">Medida</label><input type="text" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-black text-sm" value={serviceDimensions} onChange={e=>setServiceDimensions(e.target.value)} placeholder="Ej: 10x10"/></div><div className="w-24"><label className="text-[11px] font-bold uppercase mb-2 block tracking-wider text-slate-400">Cant.</label><input type="number" min="1" className="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-white font-black text-center" value={tempQty} onChange={e=>setTempQty(Number(e.target.value))}/></div><button onClick={handleAddItem} className={`p-3.5 rounded-xl shadow-lg hover:scale-105 active:scale-95 mb-0.5 ${getServiceTheme().bg} text-white`}><Plus size={24} strokeWidth={3}/></button></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto px-8 pb-6 space-y-3 custom-scrollbar">
                            {orderItems.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60"><Package size={48}/><p className="text-sm font-bold uppercase mt-4">Sin Ítems</p></div>) : 
                                orderItems.slice().reverse().map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-white shadow-lg">{item.size}</div><div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">{orderMode === 'General' ? item.gender : item.notes}</span><div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color || newOrder.fabricColor || '#fff'}}></div><span className="text-xs text-slate-300 font-bold">{item.color || 'Base'}</span></div></div></div>
                                        <div className="flex items-center gap-6"><span className="font-mono text-white font-black text-xl">x{item.quantity}</span><button onClick={() => handleRemoveItem(item.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={18}/></button></div>
                                    </div>
                                ))
                            }
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-[#0a0520] border-t border-white/10 space-y-4 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-6"><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Prendas</p><p className="text-3xl font-black text-white leading-none">{orderItems.reduce((a,b)=>a+b.quantity, 0)}</p></div><div className="w-px bg-white/10 h-10 self-center"></div><div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total</p><div className="flex items-center gap-1"><DollarSign size={18} className="text-primary-400"/><input type="number" className="w-32 bg-transparent text-2xl font-black text-white outline-none placeholder-slate-700" placeholder="0" value={newOrder.totalAmount || ''} onChange={e => setNewOrder({...newOrder, totalAmount: Number(e.target.value)})} /></div></div></div>
                                <button onClick={handleSaveOrder} className="px-8 py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(217,70,239,0.4)] transition-all transform hover:-translate-y-1 flex items-center gap-3 text-sm">{editingId ? 'Guardar' : 'Confirmar'} <ArrowRight size={20}/></button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal is rendered at the top level */}
      {isDetailOpen && selectedOrder && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-0 md:p-6 backdrop-blur-xl">
              {/* Reuse Detail Modal Code logic but ensure it calls handleEditClick and others correctly */}
              {/* I am relying on the existing Render logic for Detail Modal in the main return above as I'm replacing the whole file content */}
              <div className="bg-[#0a0520] md:rounded-3xl w-full max-w-7xl shadow-2xl flex flex-col h-full md:h-[95vh] relative animate-enter overflow-hidden">
                  <div className="hidden print:block fixed inset-0 bg-white text-black z-[9999] overflow-hidden"><PrintTemplate order={selectedOrder} /></div>
                  <div ref={printRef} className="fixed top-0 left-0 bg-white text-black overflow-hidden" style={{ width: '210mm', height: '297mm', zIndex: -1000, visibility: isGeneratingPdf ? 'visible' : 'hidden'}}><PrintTemplate order={selectedOrder} /></div>
                  {/* ... Detail View Header and Body ... */}
                  <div className="flex justify-between items-center px-8 py-5 border-b border-white/10 bg-[#0f0a29] shrink-0 print:hidden">
                      <div className="flex items-center gap-5"><div className="p-3 bg-white/5 rounded-2xl border border-white/10"><FileText className="text-primary-400" size={24}/></div><div><h2 className="text-3xl font-display font-black text-white tracking-wide">{selectedOrder.orderNumber}</h2><span className={`text-xs font-bold px-3 py-1 rounded-md border ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></div></div>
                      <div className="flex gap-3">
                         <button onClick={() => { setIsDetailOpen(false); handleEditClick(selectedOrder); }} className="bg-indigo-600/20 border border-indigo-600/40 text-indigo-300 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-indigo-600/30 font-bold uppercase transition-all text-xs shadow-lg"><Edit size={18} /> Editar</button>
                         <button onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-emerald-500/30 font-bold uppercase transition-all text-xs shadow-lg disabled:opacity-50">{isGeneratingPdf ? <Loader2 size={18} className="animate-spin"/> : <Download size={18} />} {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}</button>
                         <button onClick={() => window.print()} className="bg-white text-black px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-200 font-bold uppercase transition-transform text-xs shadow-lg"><Printer size={18} /> Imprimir</button>
                         <button onClick={() => setIsDetailOpen(false)} className="bg-white/5 border border-white/10 text-slate-400 p-3 rounded-xl hover:bg-white/10 hover:text-white transition-colors"><X size={24}/></button>
                      </div>
                  </div>
                  {/* Detail Body (Recycled from previous view for consistency) */}
                  <div className="p-6 md:p-10 overflow-y-auto flex-1 bg-[#0a0520] print:hidden">
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                          <div className="xl:col-span-8 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="bg-[#150f32] border border-white/5 p-6 rounded-3xl relative overflow-hidden"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Modelo</p><p className="text-xl font-display font-black text-white">{selectedOrder.garmentModel}</p></div>
                                  <div className="bg-[#150f32] border border-white/5 p-6 rounded-3xl relative overflow-hidden"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Tela</p><p className="text-xl font-display font-black text-white">{selectedOrder.fabricType}</p></div>
                                  <div className="bg-[#150f32] border border-white/5 p-6 rounded-3xl relative overflow-hidden"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">Color Base</p><p className="text-xl font-display font-black text-white">{selectedOrder.fabricColor}</p></div>
                              </div>
                              <div className="bg-[#150f32] border border-white/5 rounded-[2rem] p-8">
                                  <div className="flex items-center justify-between mb-8"><h3 className="font-display font-bold text-white text-xl flex items-center gap-3"><Ruler className="text-primary-400" size={24}/> DESGLOSE DE ITEMS</h3><span className="bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-bold border border-white/5">Total: {selectedOrder.items.reduce((a,b)=>a+b.quantity,0)}</span></div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Logic for displaying items in Detail View */}
                                      {GENDER_ORDER.map(g => {
                                          const items = selectedOrder.items.filter(i => i.gender === g).sort((a,b) => getSizeWeight(a.size) - getSizeWeight(b.size));
                                          if (items.length === 0) return null;
                                          const styles = getGenderColorStyles(g);
                                          return (<div key={g} className={`rounded-3xl border ${styles.border} overflow-hidden bg-black/20`}><div className={`px-6 py-4 ${styles.bg} flex justify-between items-center border-b ${styles.border}`}><span className={`font-black uppercase tracking-widest text-xs ${styles.title}`}>{g}</span><span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${styles.badge}`}>{items.reduce((a,b)=>a+b.quantity,0)} pzs</span></div><div className="p-6 grid grid-cols-2 gap-4">{items.map(i => (<div key={i.id} className="flex justify-between items-center bg-[#0a0520] border border-white/5 rounded-xl p-3 shadow-sm"><div className="flex items-center gap-3"><span className={`text-base font-black ${styles.text}`}>{i.size}</span><div className="w-2.5 h-2.5 rounded-full border border-white/10" style={{backgroundColor: i.color || selectedOrder.fabricColor || '#fff'}}></div></div><span className="text-sm font-bold text-white bg-white/5 px-2 py-0.5 rounded">x{i.quantity}</span></div>))}</div></div>)
                                      })}
                                      {selectedOrder.items.filter(i => !GENDER_ORDER.includes(i.gender)).length > 0 && (
                                          <div className="col-span-1 md:col-span-2 rounded-3xl border border-indigo-500/30 overflow-hidden bg-black/20"><div className="px-6 py-4 bg-indigo-500/20 flex justify-between items-center border-b border-indigo-500/30"><span className="font-black uppercase tracking-widest text-xs text-indigo-300">SERVICIOS / INDUSTRIAL</span></div><div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">{selectedOrder.items.filter(i => !GENDER_ORDER.includes(i.gender)).map(i => (<div key={i.id} className="flex justify-between items-center bg-[#0a0520] border border-white/5 rounded-xl p-3 shadow-sm"><div className="flex flex-col"><span className="text-base font-black text-white">{i.size}</span><span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">{i.notes || 'Detalle'}</span></div><span className="text-sm font-bold text-white bg-white/5 px-3 py-1 rounded">x{i.quantity}</span></div>))}</div></div>
                                      )}
                                  </div>
                              </div>
                              <div className="bg-[#150f32] border border-white/5 rounded-3xl p-8"><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Instrucciones & Notas</h4><p className="text-slate-200 font-medium leading-relaxed whitespace-pre-wrap text-base">{selectedOrder.description || "Sin notas adicionales."}</p></div>
                          </div>
                          <div className="xl:col-span-4 space-y-6">
                              <div className="glass-card rounded-[2rem] p-8 border border-white/10"><h4 className="font-bold text-white mb-6 flex items-center gap-2 text-sm uppercase tracking-wide"><ImageIcon size={18} className="text-primary-400"/> REFERENCIAS</h4><div className="space-y-4">{selectedOrder.referenceImages.length > 0 ? (selectedOrder.referenceImages.map((img, idx) => (<div key={idx} className="rounded-2xl border border-white/10 overflow-hidden bg-black cursor-pointer hover:opacity-90 transition-opacity" onClick={()=>window.open(img, '_blank')}><img src={img} className="w-full h-auto object-cover" /></div>))) : (<div className="py-16 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-600"><ImageIcon size={32} className="mb-2 opacity-50"/><span className="text-xs font-bold">Sin imágenes</span></div>)}</div></div>
                              <div className="glass-card rounded-[2rem] p-8 border border-white/10 bg-gradient-to-br from-primary-900/20 to-transparent"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cliente</p><p className="text-2xl font-bold text-white mb-6">{selectedOrder.clientName}</p><div className="h-px bg-white/10 my-6"></div><div className="flex justify-between items-center mb-4"><span className="text-sm text-slate-400 font-medium">Fecha Límite</span><span className="text-white font-mono font-bold">{new Date(selectedOrder.deadline).toLocaleDateString()}</span></div><div className="flex justify-between items-center"><span className="text-sm text-slate-400 font-medium">Total</span><span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-white">${selectedOrder.totalAmount.toLocaleString()}</span></div></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

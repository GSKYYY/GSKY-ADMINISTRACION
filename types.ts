
export interface Client {
  id: string;
  businessName?: string; // Nombre del Negocio/Empresa (Principal)
  name: string; // Nombre del Contacto
  phone: string;
  email: string;
  address: string;
  measurements?: string; 
  createdAt: number;
}

export type Gender = 'Caballero' | 'Dama' | 'Niño' | 'Niña';

export enum OrderStatus {
  RECEIVED = 'Recibido',
  PENDING_CUT = 'Pendiente por cortar',
  CUTTING = 'En corte',
  CUT_READY = 'Cortado',
  PENDING_SEW = 'Pendiente por coser',
  SEWING = 'En costura',
  SEWN = 'Cosido',
  FINISHING = 'En acabados',
  QUALITY_CONTROL = 'Revisión de calidad',
  READY = 'Listo para entrega',
  DELIVERED = 'Entregado',
  PAUSED = 'En pausa',
  CANCELLED = 'Cancelado',
  RETURNED = 'Devuelto para ajustes',
  TRASH = 'Papelera'
}

export type Priority = 'Normal' | 'Urgente' | 'Muy Urgente';

export enum GarmentType {
  UNIFORM = 'Uniforme',
  JACKET = 'Chaqueta',
  PANTS = 'Pantalón',
  SHIRT = 'Camisa',
  DRESS = 'Vestido',
  REPAIR = 'Arreglo',
  OTHER = 'Otro'
}

export interface OrderItem {
  id: string;
  gender: Gender;
  type: string;
  size: string;
  quantity: number;
  color?: string; // New field for specific item color
  notes?: string;
}

export interface UniformTemplate {
  id: string;
  name: string;
  items: Omit<OrderItem, 'id'>[];
}

export interface Order {
  id: string;
  orderNumber: string; // PED-001
  clientId: string;
  clientName: string; // This usually stores the Business Name or Contact Name depending on display preference
  
  // Specs Globales (Predeterminados)
  fabricColor: string;
  fabricType: string;
  garmentModel: string;
  description: string;
  referenceImages: string[];
  
  items: OrderItem[];
  
  // Financials
  unitPrice?: number;
  totalAmount: number;
  
  // Status & Priority
  status: OrderStatus;
  priority: Priority;
  
  // Dates
  receptionDate: number;
  deadline: number;
  createdAt: number;
}

export interface DashboardMetrics {
  totalClients: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

export type ViewState = 'dashboard' | 'clients' | 'orders' | 'stats' | 'social';
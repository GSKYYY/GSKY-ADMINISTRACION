
import { Client, Order, OrderStatus, UniformTemplate } from '../types';

const CLIENTS_KEY = 'cm_clients';
const ORDERS_KEY = 'cm_orders';
const TEMPLATES_KEY = 'cm_templates';

export const StorageService = {
  getClients: (): Client[] => {
    try {
      const data = localStorage.getItem(CLIENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading clients', e);
      return [];
    }
  },

  saveClients: (clients: Client[]) => {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  addClient: (client: Client) => {
    const clients = StorageService.getClients();
    clients.push(client);
    StorageService.saveClients(clients);
  },

  updateClient: (updatedClient: Client) => {
    const clients = StorageService.getClients();
    const index = clients.findIndex(c => c.id === updatedClient.id);
    if (index !== -1) {
      clients[index] = updatedClient;
      StorageService.saveClients(clients);
    }
  },

  deleteClient: (id: string) => {
    const clients = StorageService.getClients();
    const filtered = clients.filter(c => c.id !== id);
    StorageService.saveClients(filtered);
  },

  getOrders: (): Order[] => {
    try {
      const data = localStorage.getItem(ORDERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading orders', e);
      return [];
    }
  },

  saveOrders: (orders: Order[]) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  },

  // Templates
  getTemplates: (): UniformTemplate[] => {
    try {
      const data = localStorage.getItem(TEMPLATES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveTemplate: (template: UniformTemplate) => {
    const templates = StorageService.getTemplates();
    templates.push(template);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  },

  getNextOrderNumber: (): string => {
    const orders = StorageService.getOrders();
    if (orders.length === 0) return 'PED-026'; // Start from specific number per prompt
    
    const maxNum = orders.reduce((max, order) => {
      const num = parseInt(order.orderNumber.replace('PED-', ''));
      return isNaN(num) ? max : (num > max ? num : max);
    }, 25);
    
    return `PED-${String(maxNum + 1).padStart(3, '0')}`;
  },
  
  seedData: () => {
    if (!localStorage.getItem(CLIENTS_KEY)) {
      const initialClients: Client[] = [
        { id: '1', businessName: 'Alimentos Jean Carlos C.A.', name: 'Jean Carlos', phone: '555-0101', email: 'contacto@jeancarlos.com', address: 'Zona Industrial II', createdAt: Date.now() },
        { id: '2', businessName: 'Boutique La Elegancia', name: 'Maria Garcia', phone: '555-0102', email: 'maria@example.com', address: 'Calle Flores 123', createdAt: Date.now() },
      ];
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(initialClients));
    }
    
    if (!localStorage.getItem(ORDERS_KEY)) {
      const initialOrders: Order[] = [
        { 
          id: '101', 
          orderNumber: 'PED-026',
          clientId: '1', 
          clientName: 'Alimentos Jean Carlos C.A.', 
          fabricColor: 'Sublimado',
          fabricType: 'Lycra',
          garmentModel: 'Chaqueta',
          description: '',
          referenceImages: [],
          items: [
            { id: 'i1', gender: 'Caballero', type: 'Chaqueta', size: 'XL', quantity: 1 },
            { id: 'i2', gender: 'Caballero', type: 'Chaqueta', size: 'M', quantity: 3 },
            { id: 'i3', gender: 'Dama', type: 'Chaqueta', size: 'S', quantity: 1 },
            { id: 'i4', gender: 'Dama', type: 'Chaqueta', size: 'M', quantity: 1 },
          ],
          totalAmount: 0, 
          status: OrderStatus.RECEIVED, 
          priority: 'Normal',
          receptionDate: 1770177600000, // Example date matching 04/02/2026 approx
          deadline: 1770955200000, 
          createdAt: Date.now()
        }
      ];
      localStorage.setItem(ORDERS_KEY, JSON.stringify(initialOrders));
    }

    if (!localStorage.getItem(TEMPLATES_KEY)) {
        const initialTemplates: UniformTemplate[] = [
            {
                id: 't1',
                name: 'Dotación Básica Operarios',
                items: [
                    { id: 't1-i1', gender: 'Caballero', type: 'Pantalón', size: '32', quantity: 1 },
                    { id: 't1-i2', gender: 'Caballero', type: 'Camisa', size: 'M', quantity: 2 },
                    { id: 't1-i3', gender: 'Caballero', type: 'Gorra', size: 'Única', quantity: 1 }
                ]
            }
        ];
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(initialTemplates));
    }
  }
};

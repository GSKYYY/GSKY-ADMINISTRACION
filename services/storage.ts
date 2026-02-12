import { Client, Order, OrderStatus, UniformTemplate } from '../types';

const CLIENTS_KEY = 'costura_clients_db';
const ORDERS_KEY = 'costura_orders_db';
const TEMPLATES_KEY = 'costura_templates_db';

const getFromStorage = <T>(key: string): T[] => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
};

const saveToStorage = <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const StorageService = {
  getClients: async (): Promise<Client[]> => {
    return getFromStorage<Client>(CLIENTS_KEY).sort((a, b) => b.createdAt - a.createdAt);
  },

  addClient: async (client: Client): Promise<void> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    clients.push(client);
    saveToStorage(CLIENTS_KEY, clients);
  },

  updateClient: async (updatedClient: Client): Promise<void> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    const index = clients.findIndex(c => c.id === updatedClient.id);
    if (index !== -1) {
        clients[index] = updatedClient;
        saveToStorage(CLIENTS_KEY, clients);
    }
  },

  deleteClient: async (id: string): Promise<void> => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    saveToStorage(CLIENTS_KEY, clients.filter(c => c.id !== id));
  },

  getOrders: async (): Promise<Order[]> => {
    const orders = getFromStorage<Order>(ORDERS_KEY);
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  },

  addOrder: async (order: Order): Promise<void> => {
    const orders = getFromStorage<Order>(ORDERS_KEY);
    orders.push(order);
    saveToStorage(ORDERS_KEY, orders);
  },

  updateOrder: async (order: Order): Promise<void> => {
    const orders = getFromStorage<Order>(ORDERS_KEY);
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
        orders[index] = order;
        saveToStorage(ORDERS_KEY, orders);
    }
  },

  deleteOrder: async (id: string): Promise<void> => {
    const orders = getFromStorage<Order>(ORDERS_KEY);
    saveToStorage(ORDERS_KEY, orders.filter(o => o.id !== id));
  },

  getNextOrderNumber: async (): Promise<string> => {
    const orders = getFromStorage<Order>(ORDERS_KEY);
    if (orders.length === 0) return 'PED-026';
    
    let maxNum = 25;
    orders.forEach(o => {
         const val = o.orderNumber;
         if (!val) return;
         const match = val.match(/(\d+)$/);
         if (match) {
             const num = parseInt(match[1], 10);
             if (num > maxNum) maxNum = num;
         }
    });
    
    return `PED-${String(maxNum + 1).padStart(3, '0')}`;
  },
  
  seedData: async () => {
    const clients = getFromStorage<Client>(CLIENTS_KEY);
    if (clients.length === 0) {
        const initialClients: Client[] = [
            { id: '1', businessName: 'Alimentos Jean Carlos C.A.', name: 'Jean Carlos', phone: '555-0101', email: 'contacto@jeancarlos.com', address: 'Zona Industrial II', createdAt: Date.now() },
            { id: '2', businessName: 'Boutique La Elegancia', name: 'Maria Garcia', phone: '555-0102', email: 'maria@example.com', address: 'Calle Flores 123', createdAt: Date.now() },
        ];
        saveToStorage(CLIENTS_KEY, initialClients);

        const initialOrders: Order[] = [
            { 
                id: '101', 
                orderNumber: 'PED-026', 
                clientId: '1', 
                clientName: 'Alimentos Jean Carlos C.A.', 
                fabricColor: 'Azul Marino',
                fabricType: 'Gabardina',
                garmentModel: 'Chaqueta Impermeable',
                description: 'Ejemplo de pedido inicial del sistema.',
                referenceImages: [],
                items: [
                    { id: 'i1', gender: 'Caballero', type: 'Chaqueta', size: 'XL', quantity: 1 },
                    { id: 'i2', gender: 'Caballero', type: 'Chaqueta', size: 'M', quantity: 3 },
                ],
                totalAmount: 150, 
                status: OrderStatus.RECEIVED, 
                priority: 'Normal',
                receptionDate: Date.now(), 
                deadline: Date.now() + 604800000, 
                createdAt: Date.now()
            }
        ];
        saveToStorage(ORDERS_KEY, initialOrders);
    }
  }
};
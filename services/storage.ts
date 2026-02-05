
import { Client, Order, OrderStatus, UniformTemplate } from '../types';
import { supabase } from './supabaseClient';

const TEMPLATES_KEY = 'cm_templates'; 

// --- MAPPER HELPERS (Traductor App <-> Base de Datos) ---
// Esto asegura que 'businessName' se guarde como 'business_name' en la BD, etc.

const mapClientToDb = (c: Client) => {
    // Aseguramos que measurements sea un string o null
    let measurementsPayload = c.measurements;
    if (measurementsPayload && typeof measurementsPayload !== 'string') {
        measurementsPayload = JSON.stringify(measurementsPayload);
    }

    return {
        id: c.id,
        business_name: c.businessName, // Mapeo explícito
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        measurements: measurementsPayload || null, 
        created_at: new Date(c.createdAt).toISOString() // Postgres prefiere ISO strings
    };
};

const mapDbToClient = (d: any): Client => ({
    id: d.id,
    businessName: d.business_name, // Recuperamos como camelCase
    name: d.name,
    phone: d.phone,
    email: d.email,
    address: d.address,
    measurements: d.measurements, // Supabase devuelve texto o json
    createdAt: new Date(d.created_at).getTime() // Convertimos a milisegundos para la App
});

const mapOrderToDb = (o: Order) => ({
    id: o.id,
    order_number: o.orderNumber,
    client_id: o.clientId,
    client_name: o.clientName,
    fabric_color: o.fabricColor,
    fabric_type: o.fabricType,
    garment_model: o.garmentModel,
    description: o.description,
    reference_images: o.referenceImages,
    items: o.items, // JSONB se maneja automático
    total_amount: o.totalAmount,
    status: o.status,
    priority: o.priority,
    reception_date: new Date(o.receptionDate).toISOString(),
    deadline: new Date(o.deadline).toISOString(),
    created_at: new Date(o.createdAt).toISOString()
});

const mapDbToOrder = (d: any): Order => ({
    id: d.id,
    orderNumber: d.order_number,
    clientId: d.client_id,
    clientName: d.client_name,
    fabricColor: d.fabric_color,
    fabricType: d.fabric_type,
    garmentModel: d.garment_model,
    description: d.description,
    referenceImages: d.reference_images || [],
    items: d.items || [],
    totalAmount: d.total_amount,
    status: d.status as OrderStatus,
    priority: d.priority,
    receptionDate: new Date(d.reception_date).getTime(),
    deadline: new Date(d.deadline).getTime(),
    createdAt: new Date(d.created_at).getTime()
});

export const StorageService = {
  // --- CLIENTS ---
  getClients: async (): Promise<Client[]> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false }); // Usar nombre de columna de BD
      
      if (error) throw error;
      return (data || []).map(mapDbToClient);
    } catch (e) {
      console.error('Error fetching clients:', e);
      return [];
    }
  },

  addClient: async (client: Client): Promise<void> => {
    try {
      const dbPayload = mapClientToDb(client);
      console.log('Intentando guardar cliente (Payload):', dbPayload);

      const { error } = await supabase.from('clients').insert(dbPayload);
      
      if (error) {
          console.error("🔴 ERROR CRÍTICO SUPABASE (addClient):");
          console.error("Mensaje:", error.message);
          console.error("Código:", error.code);
          
          // DETECCION AUTOMATICA DE CUALQUIER COLUMNA FALTANTE
          if (error.code === 'PGRST204') {
             alert(`⚠️ ERROR CRÍTICO DE BASE DE DATOS:\n\nFaltan columnas en Supabase.\nDetalle: ${error.message}\n\nSOLUCIÓN: Ejecuta el nuevo archivo 'SETUP_DB.sql' en el SQL Editor de Supabase.`);
          } else {
             alert(`Error al guardar: ${error.message}`);
          }
          throw error;
      } else {
          console.log('✅ Cliente guardado con éxito');
      }
    } catch (e) {
      console.error('Excepción en addClient:', e);
    }
  },

  updateClient: async (updatedClient: Client): Promise<void> => {
    try {
      const dbPayload = mapClientToDb(updatedClient);
      const { error } = await supabase
        .from('clients')
        .update(dbPayload)
        .eq('id', updatedClient.id);
      
      if (error) throw error;
    } catch (e) {
      console.error('Error updating client:', e);
      alert('Error al actualizar cliente.');
    }
  },

  deleteClient: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.error('Error deleting client:', e);
      alert('No se pudo eliminar el cliente.');
    }
  },

  // --- ORDERS ---
  getOrders: async (): Promise<Order[]> => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapDbToOrder);
    } catch (e) {
      console.error('Error fetching orders:', e);
      return [];
    }
  },

  addOrder: async (order: Order): Promise<void> => {
      try {
          const dbPayload = mapOrderToDb(order);
          const { error } = await supabase.from('orders').insert(dbPayload);
          
          if (error) {
              console.error("🔴 ERROR CRÍTICO SUPABASE (addOrder):", error);
              if (error.code === 'PGRST204') {
                  alert(`⚠️ FALTAN COLUMNAS EN SUPABASE.\nPor favor ejecuta el script 'SETUP_DB.sql'.\n\nDetalle: ${error.message}`);
              }
              throw error;
          }
      } catch(e) {
          console.error('Error adding order:', e);
          alert('Error al crear pedido. Ver consola.');
      }
  },

  updateOrder: async (order: Order): Promise<void> => {
      try {
          const dbPayload = mapOrderToDb(order);
          const { error } = await supabase.from('orders').update(dbPayload).eq('id', order.id);
          if (error) throw error;
      } catch(e) {
          console.error('Error updating order:', e);
      }
  },

  // --- TEMPLATES (Local Storage Fallback) ---
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

  // --- UTILS ---
  getNextOrderNumber: async (): Promise<string> => {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select('order_number'); // Snake Case select
        
        if (error || !orders || orders.length === 0) return 'PED-026';
        
        let maxNum = 25;
        orders.forEach((o: any) => {
             // Handle both case just in case
             const val = o.order_number || o.orderNumber;
             if (!val) return;
             const match = val.match(/(\d+)$/);
             if (match) {
                 const num = parseInt(match[1], 10);
                 if (num > maxNum) maxNum = num;
             }
        });
        
        return `PED-${String(maxNum + 1).padStart(3, '0')}`;
    } catch (e) {
        console.error("Error calculating next order number", e);
        return 'PED-000';
    }
  },
  
  seedData: async () => {
    try {
        // Verificar conexión primero
        const { count, error } = await supabase.from('clients').select('*', { count: 'exact', head: true });
        
        if (error) {
            console.warn("⚠️ No se pudo verificar seed data. Posible error de conexión o tabla inexistente.", error.message);
            return;
        }

        if (count === 0) {
            console.log("Base de datos vacía. Insertando datos de prueba...");
            const initialClients: Client[] = [
                { id: '1', businessName: 'Alimentos Jean Carlos C.A.', name: 'Jean Carlos', phone: '555-0101', email: 'contacto@jeancarlos.com', address: 'Zona Industrial II', createdAt: Date.now() },
                { id: '2', businessName: 'Boutique La Elegancia', name: 'Maria Garcia', phone: '555-0102', email: 'maria@example.com', address: 'Calle Flores 123', createdAt: Date.now() },
            ];
            
            const initialOrders: Order[] = [
                { 
                id: '101', 
                orderNumber: 'PED-026',
                clientId: '1', 
                clientName: 'Alimentos Jean Carlos C.A.', 
                fabricColor: 'Sublimado',
                fabricType: 'Lycra',
                garmentModel: 'Chaqueta',
                description: 'Prueba de sistema',
                referenceImages: [],
                items: [
                    { id: 'i1', gender: 'Caballero', type: 'Chaqueta', size: 'XL', quantity: 1 },
                    { id: 'i2', gender: 'Caballero', type: 'Chaqueta', size: 'M', quantity: 3 },
                    { id: 'i3', gender: 'Dama', type: 'Chaqueta', size: 'S', quantity: 1 },
                    { id: 'i4', gender: 'Dama', type: 'Chaqueta', size: 'M', quantity: 1 },
                ],
                totalAmount: 150, 
                status: OrderStatus.RECEIVED, 
                priority: 'Normal',
                receptionDate: Date.now(), 
                deadline: Date.now() + 604800000, 
                createdAt: Date.now()
                }
            ];

            // Map seeded data as well
            const mappedClients = initialClients.map(mapClientToDb);
            const mappedOrders = initialOrders.map(mapOrderToDb);

            const { error: err1 } = await supabase.from('clients').insert(mappedClients);
            const { error: err2 } = await supabase.from('orders').insert(mappedOrders);
            
            if (err1 || err2) console.error("Error en seed:", err1, err2);
            else console.log("Seed completado exitosamente.");
        }
    } catch (e) {
        console.error("Seed Data Error:", e);
    }
  }
};

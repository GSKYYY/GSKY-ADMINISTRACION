import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { OrdersView } from './components/OrdersView';
import { StatsView } from './components/StatsView';
import { SocialView } from './components/SocialView';
import { GeminiView } from './components/GeminiView';
import { TrashView } from './components/TrashView';
import { Assistant } from './components/Assistant';
import { StorageService } from './services/storage';
import { Client, Order, ViewState, OrderStatus } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
      try {
        const [c, o] = await Promise.all([
            StorageService.getClients(),
            StorageService.getOrders()
        ]);
        setClients(c);
        setOrders(o);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    const init = async () => {
        await StorageService.seedData(); 
        await fetchData();
    };
    init();
  }, []);

  const handleAddClient = async (client: Client) => {
    await StorageService.addClient(client);
    await fetchData();
  };

  const handleUpdateClient = async (client: Client) => {
    await StorageService.updateClient(client);
    await fetchData();
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('¿Estás seguro? Esta acción es irreversible.')) {
        await StorageService.deleteClient(id);
        await fetchData();
    }
  };

  const handleAddOrder = async (order: Order) => {
    await StorageService.addOrder(order);
    await fetchData();
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    await StorageService.updateOrder(updatedOrder);
    await fetchData();
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const allOrders = await StorageService.getOrders();
    const orderToUpdate = allOrders.find(o => o.id === id);
    if (orderToUpdate) {
        await StorageService.updateOrder({ ...orderToUpdate, status });
        await fetchData();
    }
  };

  const handleRestoreOrder = async (id: string) => {
      await handleUpdateOrderStatus(id, OrderStatus.RECEIVED);
  };

  const handleDeletePermanently = async (id: string) => {
      if (confirm('¿Eliminar permanentemente?')) {
          await StorageService.deleteOrder(id);
          await fetchData();
      }
  };

  const renderContent = () => {
    if (isLoading && clients.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white min-h-[50vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-primary-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-slate-400 font-medium animate-pulse tracking-wide uppercase text-xs">Cargando base de datos local...</p>
            </div>
        );
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardView clients={clients} orders={orders} />;
      case 'clients':
        return (
          <ClientsView 
            clients={clients} 
            orders={orders}
            onAddClient={handleAddClient} 
            onUpdateClient={handleUpdateClient} 
            onDeleteClient={handleDeleteClient}
          />
        );
      case 'orders':
        return (
          <OrdersView 
            orders={orders} 
            clients={clients}
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onAddClient={handleAddClient}
          />
        );
      case 'stats':
        return <StatsView orders={orders} clients={clients} />;
      case 'social':
        return <SocialView />;
      case 'ai':
        return <GeminiView />;
      case 'trash':
        return <TrashView orders={orders} onRestore={handleRestoreOrder} onDeletePermanently={handleDeletePermanently} />;
      default:
        return <DashboardView clients={clients} orders={orders} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
      <Assistant />
    </Layout>
  );
}

export default App;
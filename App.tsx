import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { OrdersView } from './components/OrdersView';
import { StatsView } from './components/StatsView';
import { SocialView } from './components/SocialView';
import { StorageService } from './services/storage';
import { supabase } from './services/supabaseClient';
import { Client, Order, ViewState, OrderStatus } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized Data Fetching
  const fetchData = async () => {
      try {
        const [c, o] = await Promise.all([
            StorageService.getClients(),
            StorageService.getOrders()
        ]);
        setClients(c);
        setOrders(o);
      } catch (error) {
        console.error("Error syncing data:", error);
      } finally {
        setIsLoading(false);
      }
  };

  // Initial Load & Realtime Subscriptions
  useEffect(() => {
    // 1. Initial Load
    const init = async () => {
        await StorageService.seedData(); // Check if seed needed
        await fetchData();
    };
    init();

    // 2. Realtime Subscription (Magic happens here)
    const channel = supabase.channel('schema-db-changes')
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to INSERT, UPDATE, DELETE
                schema: 'public',
            },
            (payload) => {
                console.log('Cambio detectado en BD:', payload);
                // Simple strategy: Refetch to ensure consistency. 
                // For massive datasets, we would update state manually based on payload.
                fetchData();
            }
        )
        .subscribe();

    // Cleanup subscription on unmount
    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // Actions (Now they just trigger the DB call, Realtime handles the UI update)
  
  // Client Actions
  const handleAddClient = async (client: Client) => {
    await StorageService.addClient(client);
  };

  const handleUpdateClient = async (client: Client) => {
    await StorageService.updateClient(client);
  };

  const handleDeleteClient = async (id: string) => {
    await StorageService.deleteClient(id);
  };

  // Order Actions
  const handleAddOrder = async (order: Order) => {
    await StorageService.addOrder(order);
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    await StorageService.updateOrder(updatedOrder);
  };

  const handleUpdateOrderStatus = async (id: string, status: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (orderToUpdate) {
        // Optimistic UI update for instant feedback locally
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        // Actual DB update
        await StorageService.updateOrder({ ...orderToUpdate, status });
    }
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
                <p className="animate-pulse">Sincronizando con la Nube...</p>
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
          />
        );
      case 'stats':
        return <StatsView orders={orders} clients={clients} />;
      case 'social':
        return <SocialView />;
      default:
        return <DashboardView clients={clients} orders={orders} />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;
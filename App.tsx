import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { OrdersView } from './components/OrdersView';
import { StatsView } from './components/StatsView';
import { SocialView } from './components/SocialView';
import { StorageService } from './services/storage';
import { Client, Order, ViewState, OrderStatus } from './types';

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [clients, setClients] = useState<Client[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Initialize data
  useEffect(() => {
    StorageService.seedData(); // Ensure some data exists
    setClients(StorageService.getClients());
    setOrders(StorageService.getOrders());
  }, []);

  // Client Actions
  const handleAddClient = (client: Client) => {
    StorageService.addClient(client);
    setClients(StorageService.getClients());
  };

  const handleUpdateClient = (client: Client) => {
    StorageService.updateClient(client);
    setClients(StorageService.getClients());
  };

  const handleDeleteClient = (id: string) => {
    StorageService.deleteClient(id);
    setClients(StorageService.getClients());
  };

  // Order Actions
  const handleAddOrder = (order: Order) => {
    const allOrders = [...orders, order];
    StorageService.saveOrders(allOrders);
    setOrders(allOrders);
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const updatedList = orders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
    StorageService.saveOrders(updatedList);
    setOrders(updatedList);
  };

  const handleUpdateOrderStatus = (id: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => o.id === id ? { ...o, status } : o);
    StorageService.saveOrders(updatedOrders);
    setOrders(updatedOrders);
  };

  const renderContent = () => {
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
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Trash2, ArchiveRestore, Search, XCircle } from 'lucide-react';

interface TrashViewProps {
  orders: Order[];
  onRestore: (id: string) => void;
  onDeletePermanently: (id: string) => void;
}

export const TrashView: React.FC<TrashViewProps> = ({ orders, onRestore, onDeletePermanently }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const trashOrders = orders.filter(o => 
      o.status === OrderStatus.TRASH &&
      (o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
       o.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-enter h-full pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#0f0529]/80 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-3xl font-display font-black text-white mb-1 flex items-center gap-3">
            <Trash2 className="text-red-500" size={32}/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">PAPELERA</span>
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest ml-1 md:ml-11">
            Gestión de elementos eliminados ({trashOrders.length})
          </p>
        </div>
        
        <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
                type="text" 
                placeholder="Buscar en papelera..." 
                className="w-full md:w-64 pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:border-red-500 outline-none transition-colors"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {trashOrders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trashOrders.map(order => (
            <div key={order.id} className="bg-[#150a25] border border-white/5 rounded-3xl p-6 relative group hover:border-red-500/30 transition-all hover:-translate-y-1 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/5 border border-white/5 px-2 py-1 rounded text-slate-400 font-mono text-xs font-bold">
                        {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 font-bold uppercase tracking-wider">
                        Eliminado
                    </span>
                </div>
                
                <h3 className="font-bold text-white text-lg mb-1 truncate">{order.clientName}</h3>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{order.garmentModel} - {order.fabricType}</p>
                
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{order.items.length} items</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                    <button 
                        onClick={() => { if(confirm('¿Restaurar este pedido?')) onRestore(order.id); }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <ArchiveRestore size={16}/> Restaurar
                    </button>
                    <button 
                        onClick={() => { if(confirm('⚠️ ¿Borrar permanentemente?')) onDeletePermanently(order.id); }}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-wider"
                    >
                        <XCircle size={16}/> Eliminar
                    </button>
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
            <Trash2 size={48} className="mb-4 opacity-50"/>
            <p className="text-lg font-bold">La papelera está vacía</p>
        </div>
      )}
    </div>
  );
};
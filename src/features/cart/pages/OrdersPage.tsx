import { useEffect, useState } from 'react';
import { orderApi } from '../services/orderApi';
import {type Order } from '../types/order.types';

export const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getMyOrders()
      .then(res => setOrders(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 antialiased text-left font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight">My Orders</h1>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Order History & Status</p>
      </div>

      {orders.length === 0 && (
        <div className="bg-white dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-2xl p-10 sm:p-20 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h12l1 12H4L5 9z"/></svg>
            </div>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No orders yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-[#16171d] border border-gray-100 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-50 dark:border-gray-800">
                <div>
                    <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight block mb-1">Order #{order.id}</span>
                    <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        {new Date(order.created_at).toLocaleDateString()}
                    </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-tight border ${
                        order.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800' :
                        order.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800' :
                        'bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                    }`}>
                        {order.status}
                    </span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">${Number(order.total_amount).toLocaleString()}</span>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="text-[10px] font-black text-gray-400 dark:text-gray-500 hover:text-blue-600 uppercase tracking-[0.2em] transition-colors flex items-center gap-2">
                    View Details
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
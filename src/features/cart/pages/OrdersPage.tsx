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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map(order => (
        <div key={order.id} className="border rounded p-4 mb-4">
          <div className="flex justify-between">
            <span>Order #{order.id}</span>
            <span className="capitalize">Status: {order.status}</span>
            <span>${order.total_amount}</span>
          </div>
          <div className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
};
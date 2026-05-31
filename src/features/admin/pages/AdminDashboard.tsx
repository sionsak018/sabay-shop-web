import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400 font-bold uppercase animate-pulse">Loading Dashboard...</div>;

  const stats = [
    { label: 'Total Users', value: data.stats.total_users, change: '', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>, color: 'bg-blue-500' },
    { label: 'Total Products', value: data.stats.total_products, change: '', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>, color: 'bg-green-500' },
    { label: 'Total Orders', value: data.stats.total_orders, change: '', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>, color: 'bg-purple-500' },
    { label: 'Revenue', value: `$${data.stats.revenue.toLocaleString()}`, change: '', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider font-bold">{stat.label}</h3>
            <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity / Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Recent Products</h2>
            <Link to="/admin/products" className="text-xs font-bold text-blue-600 hover:underline uppercase">View All</Link>
          </div>
          <div className="p-0">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase">Product</th>
                        <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase">Price</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.recent_products.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{p.title}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{p.category?.name}</div>
                            </td>
                            <td className="px-6 py-4 text-sm font-black text-blue-600">${p.price}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Latest Users</h2>
            <Link to="/admin/users" className="text-xs font-bold text-blue-600 hover:underline uppercase">View All</Link>
          </div>
          <div className="p-0">
             <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase">User</th>
                        <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase">Joined</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {data.recent_users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="text-sm font-bold text-gray-800">{u.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium">{u.email}</div>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-gray-500 font-bold uppercase">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AdminPagination } from '../components/AdminPagination';

export const ProductPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/products?page=${page}&search=${search}`);
      setProducts(res.data.data);
      setPagination({
        currentPage: res.data.current_page,
        lastPage: res.data.last_page,
        total: res.data.total
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm);
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/products/${id}`, { status });
      fetchData(pagination.currentPage, searchTerm);
    } catch (error) {
      alert('Failed to update product');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this product?')) {
      try {
        await api.delete(`/admin/products/${id}`);
        fetchData(pagination.currentPage, searchTerm);
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Product Management</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Found {pagination.total} Products</p>
        </div>
        <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-gray-200 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Seller</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase animate-pulse">Loading products...</td></tr>
                ) : products.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-bold uppercase">No products found</td></tr>
                ) : products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="text-sm font-black text-gray-800">{p.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{p.category?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-600">{p.seller?.name}</td>
                    <td className="px-6 py-4 text-sm font-black text-blue-600">${p.price}</td>
                    <td className="px-6 py-4">
                        <select
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                            className={`text-[10px] font-black uppercase px-2 py-1 rounded border-none focus:ring-0 cursor-pointer ${
                                p.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="sold">Sold</option>
                        </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        <AdminPagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

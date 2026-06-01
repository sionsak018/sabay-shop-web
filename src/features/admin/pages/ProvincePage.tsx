import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AdminPagination } from '../components/AdminPagination';
import { useAlert } from '../../../context/AlertContext';

export const ProvincePage = () => {
  const { showAlert } = useAlert();
  const [provinces, setProvinces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProv, setEditingProv] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination & Search
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProvinces = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/provinces?page=${page}&search=${search}`);
      const provData = res.data;
      setProvinces(provData.data || []);
      setPagination({
        currentPage: provData.current_page,
        lastPage: provData.last_page,
        total: provData.total
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProvinces();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProvinces(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchProvinces(page, searchTerm);
  };

  const handleOpenModal = (prov: any | null = null) => {
    setErrors({});
    if (prov) {
      setEditingProv(prov);
      setFormData({ name: prov.name, code: prov.code });
    } else {
      setEditingProv(null);
      setFormData({ name: '', code: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.code.trim()) newErrors.code = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      if (editingProv) {
        await api.put(`/admin/provinces/${editingProv.id}`, formData);
        showAlert({ title: 'Success!', message: 'Province updated.', type: 'success' });
      } else {
        await api.post('/admin/provinces', formData);
        showAlert({ title: 'Success!', message: 'Province created.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchProvinces(pagination.currentPage, searchTerm);
    } catch (error) {
      showAlert({ title: 'Error!', message: 'Failed to save province.', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this province?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/provinces/${id}`);
          showAlert({ title: 'Deleted!', message: 'Province removed.', type: 'success' });
          fetchProvinces(pagination.currentPage, searchTerm);
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete.', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Province Management</h1>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Found {pagination.total} Provinces</p>
        </div>
        <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search province..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-gray-200 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-black text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                Add Province
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Code</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase animate-pulse">Loading data...</td></tr>
                ) : provinces.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase">No provinces found</td></tr>
                ) : provinces.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">#{p.id}</td>
                    <td className="px-6 py-4 text-sm font-black text-gray-800">{p.name}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-500">{p.code}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{editingProv ? 'Edit Province' : 'New Province'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Province Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-bold outline-none transition-all ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                    placeholder="e.g. Phnom Penh"
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Code <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                        setFormData({ ...formData, code: e.target.value });
                        if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium outline-none transition-all ${errors.code ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                    placeholder="e.g. PP"
                />
                {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.code}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20">{editingProv ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

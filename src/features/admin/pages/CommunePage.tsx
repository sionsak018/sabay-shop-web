import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AdminPagination } from '../components/AdminPagination';
import { useAlert } from '../../../context/AlertContext';

export const CommunePage = () => {
  const { showAlert } = useAlert();
  const [communes, setCommunes] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]); // Current filtered or fetched districts
  const [allDistricts, setAllDistricts] = useState<any[]>([]); // For table display lookup
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommune, setEditingCommune] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', district_id: '', province_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination & Search
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const [comRes, distRes, provRes] = await Promise.all([
        api.get(`/admin/communes?page=${page}&search=${search}`),
        api.get('/admin/districts?per_page=1000'),
        api.get('/admin/provinces?per_page=100')
      ]);

      const comData = comRes.data;
      setCommunes(comData.data || []);
      setPagination({
        currentPage: comData.current_page,
        lastPage: comData.last_page,
        total: comData.total
      });

      setAllDistricts(distRes.data.data || distRes.data || []);
      setProvinces(provRes.data.data || provRes.data || []);
    } catch (error) {
      console.error('Failed to fetch commune data:', error);
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

  // Sync districts dropdown when province changes
  useEffect(() => {
    if (formData.province_id) {
      const filtered = allDistricts.filter(d => String(d.province_id) === String(formData.province_id));
      setDistricts(filtered);
    } else {
      setDistricts([]);
    }
  }, [formData.province_id, allDistricts]);

  const handleOpenModal = (commune: any | null = null) => {
    setErrors({});
    if (commune) {
      const district = allDistricts.find(d => String(d.id) === String(commune.district_id));
      setEditingCommune(commune);
      setFormData({
        name: commune.name,
        code: commune.code,
        district_id: String(commune.district_id),
        province_id: String(district?.province_id || '')
      });
    } else {
      setEditingCommune(null);
      setFormData({
        name: '',
        code: '',
        district_id: '',
        province_id: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.province_id) newErrors.province_id = Msg;
    if (!formData.district_id) newErrors.district_id = Msg;
    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.code.trim()) newErrors.code = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      if (editingCommune) {
        await api.put(`/admin/communes/${editingCommune.id}`, formData);
        showAlert({ title: 'Success!', message: 'Commune updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/communes', formData);
        showAlert({ title: 'Success!', message: 'Commune created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData(pagination.currentPage, searchTerm);
    } catch (error) {
      showAlert({ title: 'Error!', message: 'Failed to save commune', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this commune?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/communes/${id}`);
          showAlert({ title: 'Deleted!', message: 'Commune removed.', type: 'success' });
          fetchData(pagination.currentPage, searchTerm);
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Commune Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Found {pagination.total} Communes</p>
        </div>
        <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search commune..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm dark:text-gray-200"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-black text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                Add Commune
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">District</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Province</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase animate-pulse">Loading...</td></tr>
                ) : communes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase">No communes found</td></tr>
                ) : communes.map((c) => {
                const district = allDistricts.find(d => String(d.id) === String(c.district_id));
                const province = provinces.find(p => String(p.id) === String(district?.province_id));

                return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-gray-800 dark:text-gray-200">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-bold">{district?.name || 'N/A'}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black uppercase tracking-tight border border-blue-100 dark:border-blue-800">{province?.name || 'N/A'}</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(c)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
                        <button onClick={() => handleDelete(c.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </td>
                    </tr>
                );
                })}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingCommune ? 'Edit Commune' : 'New Commune'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Province <span className="text-red-500">*</span></label>
                <select
                    value={formData.province_id}
                    onChange={(e) => {
                        setFormData({ ...formData, province_id: e.target.value, district_id: '' });
                        if (errors.province_id) setErrors(prev => ({ ...prev, province_id: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200 transition-all ${errors.province_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                >
                  <option value="">Select Province</option>
                  {provinces.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                </select>
                {errors.province_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.province_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">District <span className="text-red-500">*</span></label>
                <select
                    value={formData.district_id}
                    onChange={(e) => {
                        setFormData({ ...formData, district_id: e.target.value });
                        if (errors.district_id) setErrors(prev => ({ ...prev, district_id: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200 transition-all ${errors.district_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                >
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                </select>
                {errors.district_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.district_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Commune Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    placeholder="e.g. Boeng Keng Kang I"
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Code <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                        setFormData({ ...formData, code: e.target.value });
                        if (errors.code) setErrors(prev => ({ ...prev, code: '' }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm font-medium outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.code ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    placeholder="e.g. BKK1"
                />
                {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.code}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20">{editingCommune ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
};

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AdminPagination } from '../components/AdminPagination';
import { useAlert } from '../../../context/AlertContext';

export const VillagePage = () => {
  const { showAlert } = useAlert();
  const [villages, setVillages] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [allDistricts, setAllDistricts] = useState<any[]>([]);
  const [allCommunes, setAllCommunes] = useState<any[]>([]);

  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', commune_id: '', district_id: '', province_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pagination & Search
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const [vilRes, comRes, distRes, provRes] = await Promise.all([
        api.get(`/admin/villages?page=${page}&search=${search}`),
        api.get('/admin/communes?per_page=1000'), // Get all for dropdowns
        api.get('/admin/districts?per_page=1000'),
        api.get('/admin/provinces?per_page=100')
      ]);

      const vilData = vilRes.data;
      setVillages(vilData.data || []);
      setPagination({
        currentPage: vilData.current_page,
        lastPage: vilData.last_page,
        total: vilData.total
      });

      setAllCommunes(comRes.data.data || comRes.data || []);
      setAllDistricts(distRes.data.data || distRes.data || []);
      setProvinces(provRes.data.data || provRes.data || []);
    } catch (error) {
      console.error('Failed to fetch village data:', error);
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

  // Sync districts when province changes
  useEffect(() => {
    if (formData.province_id) {
      setDistricts(allDistricts.filter(d => String(d.province_id) === String(formData.province_id)));
    } else {
      setDistricts([]);
    }
  }, [formData.province_id, allDistricts]);

  // Sync communes when district changes
  useEffect(() => {
    if (formData.district_id) {
      setCommunes(allCommunes.filter(c => String(c.district_id) === String(formData.district_id)));
    } else {
      setCommunes([]);
    }
  }, [formData.district_id, allCommunes]);

  const handleOpenModal = (village: any | null = null) => {
    setErrors({});
    if (village) {
      const commune = allCommunes.find(c => String(c.id) === String(village.commune_id));
      const district = allDistricts.find(d => String(d.id) === String(commune?.district_id));

      setEditingVillage(village);
      setFormData({
        name: village.name,
        code: village.code,
        commune_id: String(village.commune_id),
        district_id: String(commune?.district_id || ''),
        province_id: String(district?.province_id || '')
      });
    } else {
      setEditingVillage(null);
      setFormData({ name: '', code: '', commune_id: '', district_id: '', province_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.province_id) newErrors.province_id = Msg;
    if (!formData.district_id) newErrors.district_id = Msg;
    if (!formData.commune_id) newErrors.commune_id = Msg;
    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.code.trim()) newErrors.code = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      if (editingVillage) {
        await api.put(`/admin/villages/${editingVillage.id}`, formData);
        showAlert({ title: 'Success!', message: 'Village updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/villages', formData);
        showAlert({ title: 'Success!', message: 'Village created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData(pagination.currentPage, searchTerm);
    } catch (error) {
      showAlert({ title: 'Error!', message: 'Failed to save village', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this village?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/villages/${id}`);
          showAlert({ title: 'Deleted!', message: 'Village removed.', type: 'success' });
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
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">Village Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Found {pagination.total} Villages</p>
        </div>
        <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search village..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all w-64 shadow-sm dark:text-gray-200"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-black text-xs shadow-lg shadow-blue-600/20 flex items-center gap-2 transition active:scale-95 uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                New Village
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Village Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Commune</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">District</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Province</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase animate-pulse">Loading data...</td></tr>
                ) : villages.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase">No villages found</td></tr>
                ) : villages.map((v) => {
                const commune = allCommunes.find(c => String(c.id) === String(v.commune_id));
                const district = allDistricts.find(d => String(d.id) === String(commune?.district_id));
                const province = provinces.find(p => String(p.id) === String(district?.province_id));

                return (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-black text-gray-800 dark:text-gray-200">{v.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-bold">{commune?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-bold">{district?.name || 'N/A'}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black uppercase tracking-tight border border-blue-100 dark:border-blue-800">{province?.name || 'N/A'}</span></td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(v)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
                        <button onClick={() => handleDelete(v.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
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
          <div className="bg-white dark:bg-[#1c1c1d] rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingVillage ? 'Edit Village' : 'New Village'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                <form id="village-form" onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Province <span className="text-red-500">*</span></label>
                    <select
                        value={formData.province_id}
                        onChange={(e) => {
                            setFormData({ ...formData, province_id: e.target.value, district_id: '', commune_id: '' });
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
                            setFormData({ ...formData, district_id: e.target.value, commune_id: '' });
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
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Commune <span className="text-red-500">*</span></label>
                    <select
                        value={formData.commune_id}
                        onChange={(e) => {
                            setFormData({ ...formData, commune_id: e.target.value });
                            if (errors.commune_id) setErrors(prev => ({ ...prev, commune_id: '' }));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200 transition-all ${errors.commune_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    >
                    <option value="">Select Commune</option>
                    {communes.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
                    </select>
                    {errors.commune_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.commune_id}</p>}
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Village Name <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        placeholder="e.g. Village 1"
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
                        className={`w-full px-4 py-2 border rounded-lg text-sm font-medium outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.code ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        placeholder="e.g. VIL1"
                    />
                    {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.code}</p>}
                </div>
                </form>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-800 flex gap-3 flex-shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" form="village-form" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all">{editingVillage ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

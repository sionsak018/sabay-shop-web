import React, { useState, useEffect } from 'react';
import { productSpecApi, type BrandModel, type Brand } from '../services/productSpecApi';
import { useAlert } from '../../../context/AlertContext';

export const ModelPage = () => {
  const { showAlert } = useAlert();
  const [models, setModels] = useState<BrandModel[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<BrandModel | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', brand_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [modelRes, brandRes] = await Promise.all([
        productSpecApi.getModels(),
        productSpecApi.getBrands()
      ]);
      setModels(modelRes.data);
      setBrands(brandRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (model: BrandModel | null = null) => {
    setErrors({});
    if (model) {
      setEditingModel(model);
      setFormData({
        name: model.name,
        slug: model.slug,
        brand_id: String(model.brand_id)
      });
    } else {
      setEditingModel(null);
      setFormData({ name: '', slug: '', brand_id: brands[0]?.id ? String(brands[0].id) : '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.brand_id) newErrors.brand_id = Msg;
    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.slug.trim()) newErrors.slug = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      const data = { ...formData, brand_id: Number(formData.brand_id) };
      if (editingModel) {
        await productSpecApi.updateModel(editingModel.id, data);
        showAlert({ title: 'Success!', message: 'Model updated successfully.', type: 'success' });
      } else {
        await productSpecApi.createModel(data);
        showAlert({ title: 'Success!', message: 'Model created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showAlert({ title: 'Error!', message: error.response?.data?.message || 'Failed to save model', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this model?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await productSpecApi.deleteModel(id);
          showAlert({ title: 'Deleted!', message: 'Model removed.', type: 'success' });
          fetchData();
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete model', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Models</h1>
        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          Add Model
        </button>
      </div>

      <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Brand</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase animate-pulse">Loading...</td></tr>
            ) : models.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 italic">No models found.</td></tr>
            ) : (
              models.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-gray-400 dark:text-gray-500">#{m.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-gray-200">{m.name}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black uppercase border border-blue-100 dark:border-blue-800">
                      {m.brand?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(m)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingModel ? 'Edit Model' : 'New Model'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Brand <span className="text-red-500">*</span></label>
                <select
                    value={formData.brand_id}
                    onChange={(e) => {
                        setFormData({ ...formData, brand_id: e.target.value });
                        if (errors.brand_id) setErrors(prev => ({ ...prev, brand_id: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200 transition-all ${errors.brand_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.brand_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.brand_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Slug <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                        setFormData({ ...formData, slug: e.target.value });
                        if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.slug ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                />
                {errors.slug && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.slug}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all">{editingModel ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

  );
};

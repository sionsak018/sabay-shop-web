import React, { useState, useEffect } from 'react';
import { productSpecApi, type BodyType } from '../services/productSpecApi';
import { getImageUrl } from '../../../utils/imageUrl';
import { useAlert } from '../../../context/AlertContext';

export const BodyTypePage = () => {
  const { showAlert } = useAlert();
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBodyType, setEditingBodyType] = useState<BodyType | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await productSpecApi.getBodyTypes();
      setBodyTypes(res.data);
    } catch (error) {
      console.error('Failed to fetch body types', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (bt: BodyType | null = null) => {
    setErrors({});
    if (bt) {
      setEditingBodyType(bt);
      setFormData({ name: bt.name, slug: bt.slug });
      setImagePreview(bt.image_url ? getImageUrl(bt.image_url) : null);
    } else {
      setEditingBodyType(null);
      setFormData({ name: '', slug: '' });
      setImagePreview(null);
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.slug.trim()) newErrors.slug = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingBodyType) {
        await productSpecApi.updateBodyType(editingBodyType.id, data);
        showAlert({ title: 'Success!', message: 'Body type updated successfully.', type: 'success' });
      } else {
        await productSpecApi.createBodyType(data);
        showAlert({ title: 'Success!', message: 'Body type created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      showAlert({ title: 'Error!', message: error.response?.data?.message || 'Failed to save body type', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this body type?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await productSpecApi.deleteBodyType(id);
          showAlert({ title: 'Deleted!', message: 'Body type removed.', type: 'success' });
          fetchData();
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete body type', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Body Types</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-95">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          Add Body Type
        </button>
      </div>

      <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden overflow-x-auto transition-colors">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="bg-gray-50 dark:bg-gray-800/50 border-b dark:border-gray-800">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Icon</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Slug</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {bodyTypes.map((bt) => (
              <tr key={bt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    {bt.image_url ? (
                      <img src={getImageUrl(bt.image_url)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-[10px]">No img</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-gray-800 dark:text-gray-200">{bt.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{bt.slug}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(bt)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                  </button>
                  <button onClick={() => handleDelete(bt.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingBodyType ? 'Edit Body Type' : 'New Body Type'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div className="flex justify-center">
                <label className={`relative w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden ${errors.image ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10'}`}>
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg className={`w-8 h-8 ${errors.image ? 'text-red-400' : 'text-gray-400 dark:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className={`text-[10px] font-bold uppercase mt-1 ${errors.image ? 'text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>Icon</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
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
                    placeholder="e.g. Sedan"
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
                    placeholder="e.g. sedan"
                />
                {errors.slug && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.slug}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all">{editingBodyType ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


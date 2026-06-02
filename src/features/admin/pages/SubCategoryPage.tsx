import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import { getImageUrl } from '../../../utils/imageUrl';
import { useAlert } from '../../../context/AlertContext';

export const SubCategoryPage = () => {
  const { showAlert } = useAlert();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', parent_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async (search = '') => {
    setLoading(true);
    try {
      const res = await categoryApi.getAll();
      const all = res.data;
      let subs = all.filter((c: any) => c.parent_id);
      if (search) {
          subs = subs.filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()));
      }
      setCategories(subs);
      setMainCategories(all.filter((c: any) => !c.parent_id));
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCategories(searchTerm);
  };

  const handleOpenModal = (category: Category | null = null) => {
    setErrors({});
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        parent_id: String(category.parent_id || '')
      });
      setImagePreview(category.image_url ? getImageUrl(category.image_url) : null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        parent_id: mainCategories.length > 0 ? String(mainCategories[0].id) : ''
      });
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.parent_id) newErrors.parent_id = Msg;
    if (!formData.name.trim()) newErrors.name = Msg;
    if (!formData.slug.trim()) newErrors.slug = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug);
    data.append('parent_id', formData.parent_id);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingCategory) {
        await categoryApi.adminUpdate(editingCategory.id, data);
        showAlert({ title: 'Success!', message: 'Sub-category updated.', type: 'success' });
      } else {
        await categoryApi.adminCreate(data);
        showAlert({ title: 'Success!', message: 'Sub-category created.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      showAlert({ title: 'Error!', message: error.response?.data?.message || 'Failed to save category', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this sub-category?',
      type: 'confirm',
      confirmText: 'Yes, Delete',
      cancelText: 'No',
      onConfirm: async () => {
        try {
          await categoryApi.adminDelete(id);
          showAlert({ title: 'Deleted!', message: 'Sub-category removed.', type: 'success' });
          fetchCategories();
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete sub-category', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Sub Categories</h1>
        <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative group">
                <input
                    type="text"
                    placeholder="Search subcategory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white border border-gray-200 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-all w-64 shadow-sm"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
            <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition active:scale-95 shadow-lg shadow-blue-600/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
                New Sub Category
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Image</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Main Category</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat) => {
              const parent = mainCategories.find(p => p.id === cat.parent_id);
              return (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                      {cat.image_url ? (
                        <img src={getImageUrl(cat.image_url)} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">{cat.name}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-black uppercase">{parent?.name || 'Unknown'}</span></td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(cat)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{editingCategory ? 'Edit Sub Category' : 'New Sub Category'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
              <div className="flex justify-center">
                <div className="relative group">
                    {imagePreview && (
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all scale-0 group-hover:scale-100"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    )}
                    <label className={`relative w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden ${errors.image ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'}`}>
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <svg className={`w-8 h-8 ${errors.image ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span className={`text-[10px] font-bold uppercase mt-1 ${errors.image ? 'text-red-400' : 'text-gray-400'}`}>Image</span>
                        </>
                      )}
                      <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                    </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Main Category <span className="text-red-500">*</span></label>
                <select
                    value={formData.parent_id}
                    onChange={(e) => {
                        setFormData({ ...formData, parent_id: e.target.value });
                        if (errors.parent_id) setErrors(prev => ({ ...prev, parent_id: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white transition-all ${errors.parent_id ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                >
                  <option value="">Select Main Category</option>
                  {mainCategories.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {errors.parent_id && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.parent_id}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Slug <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                        setFormData({ ...formData, slug: e.target.value });
                        if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm outline-none transition-all ${errors.slug ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                />
                {errors.slug && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.slug}</p>}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm">{editingCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

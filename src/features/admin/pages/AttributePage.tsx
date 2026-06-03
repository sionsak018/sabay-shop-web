import React, { useState, useEffect } from 'react';
import { productSpecApi } from '../services/productSpecApi';
import api from '../../../services/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { useAlert } from '../../../context/AlertContext';

interface OptionItem {
  value: string;
  image: File | null;
  image_url?: string;
}

export const AttributePage = () => {
  const { showAlert } = useAlert();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'text',
    options: [{ value: '', image: null }] as OptionItem[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchAttributes = async () => {
    try {
      const res = await api.get('/admin/attributes');
      setAttributes(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleOpenModal = (attr: any | null = null) => {
    setErrors({});
    if (attr) {
      setEditingAttr(attr);
      setFormData({
        name: attr.name,
        type: attr.type,
        options: attr.options.length > 0
          ? attr.options.map((o: any) => ({ value: o.value, image: null, image_url: o.image_url }))
          : [{ value: '', image: null }]
      });
    } else {
      setEditingAttr(null);
      setFormData({ name: '', type: 'text', options: [{ value: '', image: null }] });
    }
    setIsModalOpen(true);
  };

  const handleAddOption = () => setFormData({
    ...formData,
    options: [...formData.options, { value: '', image: null }]
  });

  const handleOptionValueChange = (idx: number, val: string) => {
    const newOptions = [...formData.options];
    newOptions[idx].value = val;
    setFormData({ ...formData, options: newOptions });
  };

  const handleOptionImageChange = (idx: number, file: File | null) => {
    const newOptions = [...formData.options];
    newOptions[idx].image = file;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOptionImage = (idx: number) => {
    const newOptions = [...formData.options];
    newOptions[idx].image = null;
    newOptions[idx].image_url = undefined;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (idx: number) => {
    setFormData({ ...formData, options: formData.options.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.name.trim()) newErrors.name = Msg;

    if (formData.type === 'select') {
        const emptyOptions = formData.options.some(o => !o.value.trim());
        if (emptyOptions) newErrors.options = 'សូមបំពេញគ្រប់ជម្រើសទាំងអស់';
        if (formData.options.length === 0) newErrors.options = Msg;
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('type', formData.type);

      if (formData.type === 'select') {
        formData.options.forEach((opt, idx) => {
          if (opt.value.trim()) {
            submitData.append(`options[${idx}][value]`, opt.value);
            if (opt.image_url) {
              submitData.append(`options[${idx}][image_url]`, opt.image_url);
            }
            if (opt.image) {
              submitData.append(`option_images[${idx}]`, opt.image);
            }
          }
        });
      }

      if (editingAttr) {
        submitData.append('_method', 'PUT');
        await api.post(`/admin/attributes/${editingAttr.id}`, submitData);
        showAlert({ title: 'Success!', message: 'Field updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/attributes', submitData);
        showAlert({ title: 'Success!', message: 'Field created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchAttributes();
    } catch (error) {
      showAlert({ title: 'Error!', message: 'Failed to save field.', type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this field? Items using it will lose this data.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/attributes/${id}`);
          showAlert({ title: 'Deleted!', message: 'Field removed.', type: 'success' });
          fetchAttributes();
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete.', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Custom Fields</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          New Field
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Options</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">Loading fields...</td></tr>
            ) : attributes.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">No custom fields created yet.</td></tr>
            ) : attributes.map((attr) => (
              <tr key={attr.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-800 block">{attr.name}</span>
                </td>
                <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-black text-gray-500 uppercase tracking-tighter">{attr.type}</span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-wrap gap-2">
                      {attr.options?.map((o: any, i: number) => (
                        <div key={i} className="group relative">
                            {o.image_url ? (
                                <div className="size-8 rounded-full border border-gray-200 p-0.5 overflow-hidden bg-white shadow-sm" title={o.value}>
                                    <img src={getImageUrl(o.image_url)} className="w-full h-full object-contain" alt={o.value} />
                                </div>
                            ) : (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">{o.value}</span>
                            )}
                        </div>
                      ))}
                      {!attr.options?.length && <span className="text-xs text-gray-300">-</span>}
                   </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(attr)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
                  <button onClick={() => handleDelete(attr.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest">{editingAttr ? 'Edit Custom Field' : 'Create New Field'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-full transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form id="attr-form" onSubmit={handleSubmit} noValidate className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Field Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl text-sm font-bold outline-none focus:bg-white transition-all ${errors.name ? 'border-red-300' : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'}`}
                    placeholder="Enter field name..."
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.name}</p>}
                </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Input Type for Users</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none cursor-pointer focus:bg-white focus:border-blue-500 transition-all">
                  <option value="text">Short Text Input</option>
                  <option value="number">Number Input (Year, Size, etc.)</option>
                  <option value="select">Dropdown List (Brand, Model, Type)</option>
                </select>
              </div>

              {formData.type === 'select' && (
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <div className="flex items-center justify-between">
                    <label className={`block text-[10px] font-black uppercase tracking-widest ${errors.options ? 'text-red-500' : 'text-gray-400'}`}>Define Options & Icons</label>
                    <button type="button" onClick={() => {
                        handleAddOption();
                        if (errors.options) setErrors(prev => ({ ...prev, options: '' }));
                    }} className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter transition-colors">+ Add Option</button>
                  </div>

                  {errors.options && <p className="text-red-500 text-[10px] font-bold mb-2 ml-1">{errors.options}</p>}

                  <div className="space-y-3">
                    {formData.options.map((opt, idx) => (
                        <div key={idx} className={`flex items-center gap-3 bg-gray-50/50 p-3 rounded-2xl border transition-all ${errors.options && !opt.value.trim() ? 'border-red-300 bg-red-50/30' : 'border-gray-100'}`}>
                            <div className="relative group size-12 flex-shrink-0">
                                { (opt.image || opt.image_url) && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleRemoveOptionImage(idx);
                                        }}
                                        className="absolute -top-1 -right-1 z-10 size-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors border-2 border-white scale-0 group-hover:scale-100 transition-transform"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                    </button>
                                )}
                                <label className="size-12 rounded-full border-2 border-dashed border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all overflow-hidden shadow-sm">
                                    {opt.image || opt.image_url ? (
                                        <img
                                            src={opt.image ? URL.createObjectURL(opt.image) : getImageUrl(opt.image_url!)}
                                            className="w-full h-full object-contain p-1"
                                            alt="Icon"
                                        />
                                    ) : (
                                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                                    )}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleOptionImageChange(idx, e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>

                            <input
                                type="text"
                                value={opt.value}
                                onChange={(e) => {
                                    handleOptionValueChange(idx, e.target.value);
                                    if (errors.options) setErrors(prev => ({ ...prev, options: '' }));
                                }}
                                className="flex-1 min-w-0 bg-transparent text-sm font-bold outline-none border-b-2 border-transparent focus:border-blue-500 transition-all py-1"
                                placeholder="Option label (e.g. Toyota)"
                            />

                            <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    ))}
                  </div>
                </div>
              )}
              </form>
            </div>
            <div className="p-8 bg-gray-50 border-t flex gap-4 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
              <button type="submit" form="attr-form" className="flex-1 px-6 py-3.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98]">
                {editingAttr ? 'Save Changes' : 'Create Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { productSpecApi } from '../services/productSpecApi';
import api from '../../../services/api';

export const AttributePage = () => {
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<any | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'text', options: [''] });

  const fetchAttributes = async () => {
    try {
      const res = await productSpecApi.getAttributes();
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
    if (attr) {
      setEditingAttr(attr);
      setFormData({
        name: attr.name,
        type: attr.type,
        options: attr.options.length > 0 ? attr.options.map((o: any) => o.value) : ['']
      });
    } else {
      setEditingAttr(null);
      setFormData({ name: '', type: 'text', options: [''] });
    }
    setIsModalOpen(true);
  };

  const handleAddOption = () => setFormData({ ...formData, options: [...formData.options, ''] });

  const handleOptionChange = (idx: number, val: string) => {
    const newOptions = [...formData.options];
    newOptions[idx] = val;
    setFormData({ ...formData, options: newOptions });
  };

  const handleRemoveOption = (idx: number) => {
    setFormData({ ...formData, options: formData.options.filter((_, i) => i !== idx) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        options: formData.type === 'select' ? formData.options.filter(o => o.trim() !== '') : []
      };

      if (editingAttr) {
        await productSpecApi.updateAttribute(editingAttr.id, data);
      } else {
        await productSpecApi.createAttribute(data);
      }
      setIsModalOpen(false);
      fetchAttributes();
    } catch (error) {
      alert('Failed to save attribute');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this field? Items using it will lose this data.')) {
      try {
        await productSpecApi.deleteAttribute(id);
        fetchAttributes();
      } catch (error) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-6">
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
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Type</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Options</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : attributes.map((attr) => (
              <tr key={attr.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm font-bold text-gray-800">{attr.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 capitalize">{attr.type}</td>
                <td className="px-6 py-4 text-xs text-gray-400 max-w-xs truncate">
                  {attr.options?.map((o: any) => o.value).join(', ') || '-'}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleOpenModal(attr)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
                  <button onClick={() => handleDelete(attr.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{editingAttr ? 'Edit Field' : 'New Custom Field'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Field Name (e.g. Transmission)</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-colors" />
                </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Input Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-bold outline-none bg-white focus:border-blue-500 transition-colors">
                  <option value="text">Short Text</option>
                  <option value="number">Number (e.g. Year)</option>
                  <option value="select">Dropdown List</option>
                </select>
              </div>

              {formData.type === 'select' && (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dropdown Options</label>
                  {formData.options.map((opt: any, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500 transition-colors"
                        placeholder={`Option ${idx + 1}`}
                      />
                      <button type="button" onClick={() => handleRemoveOption(idx)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                    </div>
                  ))}
                  <button type="button" onClick={handleAddOption} className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest">+ Add another option</button>
                </div>
              )}
              </form>
            </div>
            <div className="p-6 bg-gray-50 border-t flex gap-3 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={(e: any) => {
                const form = e.currentTarget.closest('.bg-white').querySelector('form');
                if (form) form.requestSubmit();
              }} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">
                {editingAttr ? 'Update Field' : 'Create Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

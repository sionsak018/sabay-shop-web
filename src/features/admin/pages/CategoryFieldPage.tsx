import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../categories/services/categoryApi';
import { productSpecApi } from '../services/productSpecApi';
import api from '../../../services/api';

export const CategoryFieldPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [mappedFields, setMappedFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(res.data));
    productSpecApi.getAttributes().then(res => setAttributes(res.data));
  }, []);

  const loadMapping = async (id: string) => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/category-attributes/${id}`);
      setMappedFields(res.data.map((f: any) => ({
        id: f.id,
        name: f.name,
        is_required: !!f.pivot.is_required,
        sort_order: f.pivot.sort_order
      })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCatId) loadMapping(selectedCatId);
    else setMappedFields([]);
  }, [selectedCatId]);

  const toggleField = (attr: any) => {
    if (mappedFields.find(f => f.id === attr.id)) {
      setMappedFields(mappedFields.filter(f => f.id !== attr.id));
    } else {
      setMappedFields([...mappedFields, { id: attr.id, name: attr.name, is_required: false, sort_order: 0 }]);
    }
  };

  const handleSave = async () => {
    try {
      await api.post(`/admin/category-attributes/${selectedCatId}`, { fields: mappedFields });
      alert('Mapping saved successfully');
    } catch (error) {
      alert('Failed to save mapping');
    }
  };

  const subCategories = categories.filter(c => c.parent_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Category Fields Mapping</h1>
        {selectedCatId && (
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg">Save Changes</button>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-8">
        {/* Step 1: Select Sub-Category */}
        <div className="md:w-1/3">
          <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">1. Select Sub-Category</label>
          <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {subCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(String(cat.id))}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${selectedCatId === String(cat.id) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Assign Fields */}
        <div className="flex-1">
          <label className="block text-xs font-black text-gray-400 uppercase mb-3 tracking-widest">2. Assign Fields to Category</label>
          {!selectedCatId ? (
            <div className="h-64 flex items-center justify-center text-gray-300 font-bold border-2 border-dashed border-gray-50 rounded-xl">Select a category to begin</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {attributes.map(attr => {
                  const mapped = mappedFields.find(f => f.id === attr.id);
                  return (
                    <div
                      key={attr.id}
                      className={`p-4 border rounded-xl text-left transition-all flex items-center justify-between group ${mapped ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' : 'border-gray-100 hover:border-blue-400'}`}
                    >
                      <button onClick={() => toggleField(attr)} className="flex-1 text-left">
                        <p className={`text-sm font-black ${mapped ? 'text-blue-700' : 'text-gray-700'}`}>{attr.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{attr.type}</p>
                      </button>
                      {mapped && (
                        <div className="flex items-center gap-4">
                           <div className="flex flex-col items-center gap-1">
                              <span className="text-[8px] font-black text-blue-400 uppercase">Required</span>
                              <input
                                type="checkbox"
                                checked={mapped.is_required}
                                onChange={(e) => {
                                  const newFields = [...mappedFields];
                                  const idx = newFields.findIndex(f => f.id === attr.id);
                                  newFields[idx].is_required = e.target.checked;
                                  setMappedFields(newFields);
                                }}
                                className="w-4 h-4 rounded text-blue-600"
                              />
                           </div>
                           <button onClick={() => toggleField(attr)} className="bg-blue-600 text-white p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg></button>
                        </div>
                      )}
                      {!mapped && (
                        <button onClick={() => toggleField(attr)} className="w-6 h-6 border border-gray-200 rounded-full group-hover:border-blue-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

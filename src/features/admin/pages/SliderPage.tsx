import React, { useState, useEffect } from 'react';
import { sliderApi, type Slider } from '../services/sliderApi';
import { getImageUrl } from '../../../utils/imageUrl';

export const SliderPage = () => {
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [formData, setFormData] = useState({ title: '', link_url: '', sort_order: '0' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await sliderApi.getAll();
      setSliders(res.data);
    } catch (error) {
      console.error('Failed to fetch sliders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleOpenModal = (slider: Slider | null = null) => {
    if (slider) {
      setEditingSlider(slider);
      setFormData({
        title: slider.title || '',
        link_url: slider.link_url || '',
        sort_order: String(slider.sort_order)
      });
      setImagePreview(getImageUrl(slider.image_url));
    } else {
      setEditingSlider(null);
      setFormData({ title: '', link_url: '', sort_order: '0' });
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
    const data = new FormData();
    data.append('title', formData.title);
    data.append('link_url', formData.link_url);
    data.append('sort_order', formData.sort_order);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingSlider) {
        await sliderApi.update(editingSlider.id, data);
      } else {
        if (!imageFile) return alert('Please select an image');
        await sliderApi.create(data);
      }
      setIsModalOpen(false);
      fetchSliders();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save slider');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Delete this slider?')) {
      try {
        await sliderApi.delete(id);
        fetchSliders();
      } catch (error) {
        alert('Failed to delete slider');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Home Sliders</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          Add Slider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)
        ) : sliders.map((slider) => (
          <div key={slider.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
            <div className="relative aspect-[21/9] bg-gray-100">
              <img src={getImageUrl(slider.image_url)} className="w-full h-full object-cover" alt={slider.title || 'Slider'} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => handleOpenModal(slider)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                </button>
                <button onClick={() => handleDelete(slider.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="font-bold text-gray-800 text-sm truncate">{slider.title || 'No Title'}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Order: {slider.sort_order}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">{editingSlider ? 'Edit Slider' : 'New Slider'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex justify-center">
                <label className="relative w-full aspect-[21/9] rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className="text-xs font-bold text-gray-400 uppercase mt-2">Upload Banner (21:9 ratio recommended)</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Title (Optional)</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="Promo title" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Sort Order</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Link URL (Optional)</label>
                <input type="text" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white focus:border-blue-500 transition-all outline-none" placeholder="https://..." />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all">{editingSlider ? 'Update Slider' : 'Create Slider'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

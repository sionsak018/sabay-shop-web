import React, { useState, useEffect } from 'react';
import { sliderApi, type Slider } from '../services/sliderApi';
import { getImageUrl } from '../../../utils/imageUrl';
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';

export const SliderPage = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [sliders, setSliders] = useState<Slider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlider, setEditingSlider] = useState<Slider | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', link_url: '', sort_order: '0' });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});
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

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = t('validation.required');

    if (!editingSlider && !imageFile) newErrors.image = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setSaving(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('link_url', formData.link_url);
    data.append('sort_order', formData.sort_order);
    if (imageFile) {
        data.append('image', imageFile);
    } else if (editingSlider && !imagePreview && editingSlider.image_url) {
        data.append('remove_image', '1');
    }

    try {
      if (editingSlider) {
        await sliderApi.update(editingSlider.id, data);
        showAlert({ title: t('common.success'), message: t('common.update_success'), type: 'success' });
      } else {
        await sliderApi.create(data);
        showAlert({ title: t('common.success'), message: t('common.create_success'), type: 'success' });
      }
      setIsModalOpen(false);
      fetchSliders();
    } catch (error: any) {
      showAlert({ title: t('common.error'), message: error.response?.data?.message || t('common.error_occurred'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: t('common.are_you_sure'),
      message: t('common.delete_confirm'),
      type: 'confirm',
      onConfirm: async () => {
        try {
          await sliderApi.delete(id);
          showAlert({ title: t('common.success'), message: t('common.delete_success'), type: 'success' });
          fetchSliders();
        } catch (error) {
          showAlert({ title: t('common.error'), message: t('common.error_occurred'), type: 'error' });
        }
      }
    });
  };

  if (loading && sliders.length === 0) return <div className="p-12 text-center text-gray-400 font-bold uppercase animate-pulse">{t('admin.loading_sliders')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{t('admin.slider_management')}</h1>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-95 whitespace-nowrap uppercase">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          {t('admin.create_slider')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)
        ) : sliders.map((slider) => (
          <div key={slider.id} className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden group transition-colors">
            <div className="relative aspect-[21/9] bg-gray-100 dark:bg-gray-800">
              <img
                src={getImageUrl(slider.image_url)}
                className="w-full h-full object-cover"
                alt={slider.title || 'Slider'}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/800x400?text=Image+Not+Found';
                }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2">
                <button onClick={() => handleOpenModal(slider)} className="p-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                </button>
                <button onClick={() => handleDelete(slider.id)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">{slider.title || t('home.no_results')}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mt-1">{t('admin.sort_order')}: {slider.sort_order}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 sm:hidden">
                <button
                  onClick={() => handleOpenModal(slider)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50 text-[10px] font-black uppercase tracking-widest transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg>
                  {t('common.update')}
                </button>
                <button
                  onClick={() => handleDelete(slider.id)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50 text-[10px] font-black uppercase tracking-widest transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  {t('common.clear_filters')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingSlider ? t('admin.edit_slider') : t('admin.create_slider')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
              <div className="flex justify-center">
                <label className={`relative w-full aspect-[21/9] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition overflow-hidden group ${errors.image ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-red-900/10'}`}>
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                        <img
                          src={imagePreview}
                          className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-all scale-100 sm:scale-0 sm:group-hover:scale-100"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                  ) : (
                    <>
                      <svg className={`w-10 h-10 ${errors.image ? 'text-red-400' : 'text-gray-300 dark:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span className={`text-[10px] font-black uppercase mt-2 ${errors.image ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>{t('admin.slider_image')} (21:9 ratio)</span>
                    </>
                  )}
                  <input type="file" className="hidden" onChange={(e) => {
                      handleImageChange(e);
                      if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
                  }} accept="image/*" />
                </label>
              </div>
              {errors.image && <p className="text-red-500 text-[10px] font-bold -mt-4 ml-1">{errors.image}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">{t('admin.slider_title')}</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#08060d] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-[#08060d] focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none dark:text-gray-200" placeholder="Promo title" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">{t('admin.sort_order')}</label>
                  <input type="number" value={formData.sort_order} onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#08060d] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-[#08060d] focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none dark:text-gray-200" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest">{t('admin.slider_link')}</label>
                <input type="text" value={formData.link_url} onChange={(e) => setFormData({ ...formData, link_url: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-[#08060d] border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold focus:bg-white dark:focus:bg-[#08060d] focus:border-blue-500 dark:focus:border-blue-400 transition-all outline-none dark:text-gray-200" placeholder="https://..." />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={saving} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl font-bold text-sm disabled:opacity-50 uppercase">{t('common.cancel')}</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 uppercase">
                    {saving ? t('create_product.processing') : editingSlider ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productApi } from '../services/productApi';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { MapPickerModal } from '../../../components/common/MapPickerModal';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { MapView } from '../../../components/common/MapView';
import { getImageUrl } from '../../../utils/imageUrl';

// Toast UI Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';

export const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    price: '',
    condition: 'used',
    location: 'Phnom Penh',
    category_id: '',
    province_id: '',
    district_id: '',
    commune_id: '',
    village_id: '',
    address: '',
    poster_name: '',
    poster_email: '',
    poster_phones: ['', '', ''],
    company_name: '',
    lat: '',
    lng: '',
  });

  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});
  const [phones, setPhones] = useState<string[]>(['']);

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, provRes, productRes] = await Promise.all([
          categoryApi.getAll(),
          api.get('/provinces'),
          productApi.getOne(Number(id))
        ]);

        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []);
        setProvinces(Array.isArray(provRes.data) ? provRes.data : provRes.data.data || []);

        const p = productRes.data;
        let phonesArray = [''];
        try {
          if (p.poster_phones) {
            const parsed = typeof p.poster_phones === 'string' ? JSON.parse(p.poster_phones) : p.poster_phones;
            if (Array.isArray(parsed) && parsed.length > 0) {
              phonesArray = parsed;
            }
          }
        } catch (e) { console.error(e); }
        setPhones(phonesArray);

        setFormData({
          title: p.title,
          description: p.description,
          price: String(p.price),
          condition: p.condition || 'used',
          location: p.location,
          category_id: String(p.category?.id || ''),
          province_id: String(p.province_id || ''),
          district_id: String(p.district_id || ''),
          commune_id: String(p.commune_id || ''),
          village_id: String(p.village_id || ''),
          address: p.address || '',
          poster_name: p.poster_name || '',
          poster_email: p.poster_email || '',
          poster_phones: phonesArray,
          company_name: p.company_name || '',
          lat: p.lat || '',
          lng: p.lng || '',
        });
        setExistingImages(p.images || []);

        // Map existing attribute values
        const attrVals: Record<number, string> = {};
        p.attribute_values?.forEach((av: any) => {
          attrVals[av.attribute_id] = av.value;
        });
        setAttributeValues(attrVals);

        // Set editor content
        if (editorRef.current) {
          editorRef.current.getInstance().setMarkdown(p.description || '');
        }

        // Fetch dynamic fields for this category
        if (p.category?.id) {
          const fieldsRes = await api.get(`/category-attributes/${p.category.id}`);
          setDynamicAttributes(fieldsRes.data);
        }

      } catch (err) {
        console.error('Failed to load data', err);
        setError('Failed to load product data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Filter districts based on province
  useEffect(() => {
    if (formData.province_id) {
      api.get(`/districts?province_id=${formData.province_id}`)
        .then(res => {
            setDistricts(res.data);
            setCommunes([]);
            setVillages([]);
        })
        .catch(() => setDistricts([]));
    }
  }, [formData.province_id]);

  // Filter communes based on district
  useEffect(() => {
    if (formData.district_id) {
      api.get(`/communes?district_id=${formData.district_id}`)
        .then(res => {
            setCommunes(res.data);
            setVillages([]);
        })
        .catch(() => setCommunes([]));
    }
  }, [formData.district_id]);

  // Filter villages based on commune
  useEffect(() => {
    if (formData.commune_id) {
      api.get(`/villages?commune_id=${formData.commune_id}`)
        .then(res => setVillages(res.data))
        .catch(() => setVillages([]));
    }
  }, [formData.commune_id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + existingImages.length + selectedFiles.length > 10) {
        alert('Max 10 photos allowed');
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addPhone = () => {
    if (phones.length < 3) setPhones([...phones, '']);
  };

  const handlePhoneValueChange = (idx: number, val: string) => {
    const newPhones = [...phones];
    newPhones[idx] = val;
    setPhones(newPhones);
  };

  const removePhoneField = (idx: number) => {
    if (phones.length > 1) {
        setPhones(phones.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const description = editorRef.current?.getInstance().getMarkdown();
    if (!description || description.trim().length < 5) {
      return setError('Please provide a description');
    }

    setSaving(true);
    setError(null);

    const submitForm = new FormData();
    // Use the latest formData state here
    Object.entries(formData).forEach(([key, value]) => {
      if (value && key !== 'poster_phones' && key !== 'condition') {
          submitForm.append(key, value as string);
      }
    });

    submitForm.set('poster_phones', JSON.stringify(phones.filter(p => p.trim() !== '')));

    // Ensure condition is explicitly set from the current state
    submitForm.set('condition', formData.condition);

    // Set combined location string for backend validation
    const provName = provinces.find(p => String(p.id) === String(formData.province_id))?.name || '';
    const distName = districts.find(d => String(d.id) === String(formData.district_id))?.name || '';
    const commName = communes.find(c => String(c.id) === String(formData.commune_id))?.name || '';
    const villName = villages.find(v => String(v.id) === String(formData.village_id))?.name || '';
    const locationString = [villName, commName, distName, provName].filter(Boolean).join(', ');
    submitForm.set('location', locationString || 'Cambodia');

    submitForm.set('description', description);
    submitForm.append('attributes', JSON.stringify(attributeValues));

    images.forEach((img) => {
      submitForm.append('images[]', img);
    });

    try {
      await productApi.update(Number(id), submitForm);
      navigate('/profile', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update ad');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-gray-400 uppercase tracking-widest text-left">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 antialiased text-left font-sans">
      <div className="bg-white border-b border-gray-200 py-6 mb-8 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 max-w-5xl flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          </button>
          <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Edit Your Ad</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
          {error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl text-sm font-bold shadow-sm">{error}</div>}

          {/* Photos */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Ad Photos</h2>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{images.length + existingImages.length}/10</span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                {existingImages.map((img, idx) => (
                  <div key={`exist-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-100 group shadow-sm opacity-80">
                    <img src={getImageUrl(img.image_url)} className="w-full h-full object-cover" />
                  </div>
                ))}
                {previews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-100 group shadow-sm">
                    <img src={src} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                ))}
                {images.length + existingImages.length < 10 && (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600 bg-gray-50/50">
                    <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          {(dynamicAttributes.length > 0 || (formData.category_id)) && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
                <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Item Specifications</h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Condition Field - Fixed */}
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Condition <span className="text-red-500">*</span></label>
                  <div className="flex p-1 bg-gray-100 rounded-xl gap-1">
                    {['New', 'Used'].map(c => (
                      <button
                          key={c}
                          type="button"
                          onClick={() => setFormData((prev: any) => ({...prev, condition: c.toLowerCase()}))}
                          className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${formData.condition === c.toLowerCase() ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {dynamicAttributes.map(attr => (
                  <div key={attr.id}>
                    <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">
                      {attr.name} {attr.pivot.is_required && <span className="text-red-500">*</span>}
                    </label>
                    {attr.type === 'select' ? (
                      <select
                        required={!!attr.pivot.is_required}
                        value={attributeValues[attr.id] || ''}
                        onChange={e => setAttributeValues({ ...attributeValues, [attr.id]: e.target.value })}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner"
                      >
                        <option value="">Select {attr.name}</option>
                        {attr.options?.map((o: any) => <option key={o.id} value={o.value}>{o.value}</option>)}
                      </select>
                    ) : (
                      <input
                        type={attr.type === 'number' ? 'number' : 'text'}
                        required={!!attr.pivot.is_required}
                        value={attributeValues[attr.id] || ''}
                        autoComplete="off"
                        onChange={e => {
                            let val = e.target.value;
                            // Prevent negative numbers and force empty string if invalid for discount/price
                            if (attr.type === 'number' && Number(val) < 0) val = '';
                            setAttributeValues({ ...attributeValues, [attr.id]: val });
                        }}
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner"
                        placeholder={`Enter ${attr.name.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General Information */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
              <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">General Information</h2>
            </div>
            <div className="p-8 space-y-8">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Ad Title</label>
                <input type="text" required placeholder="e.g. iPhone 15 Pro Max 256GB Gold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800" />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Price ($)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-lg">$</span>
                  <input type="number" required placeholder="0.00" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full pl-10 pr-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-black text-gray-800 text-lg shadow-inner" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Description</label>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-inner">
                  <Editor
                    ref={editorRef}
                    initialValue={formData.description}
                    placeholder="Tell buyers about your item (specs, warranty, features...)"
                    previewStyle="vertical"
                    height="400px"
                    initialEditType="wysiwyg"
                    useCommandShortcut={true}
                    toolbarItems={[
                      ['heading', 'bold', 'italic', 'strike'],
                      ['hr', 'quote'],
                      ['ul', 'ol', 'task', 'indent', 'outdent'],
                      ['table', 'link'],
                      ['code', 'codeblock']
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Item Location</h2>
                </div>
                <div className="p-8 space-y-8">

                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Select Location <span className="text-red-500">*</span></label>
                        <button
                            type="button"
                            onClick={() => setIsLocationModalOpen(true)}
                            className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl hover:border-blue-500 transition-all text-left group shadow-inner"
                        >
                            {formData.province_id ? (
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Current Selection</span>
                                    <span className="text-sm font-bold text-gray-800">
                                        {provinces.find(p => String(p.id) === formData.province_id)?.name}
                                        {formData.district_id && ` > ${districts.find(d => String(d.id) === formData.district_id)?.name}`}
                                        {formData.commune_id && ` > ${communes.find(c => String(c.id) === formData.commune_id)?.name}`}
                                        {formData.village_id && ` > ${villages.find(v => String(v.id) === formData.village_id)?.name}`}
                                    </span>
                                </div>
                            ) : (
                                <span className="text-sm font-bold text-gray-400">Tap to choose province, district, commune...</span>
                            )}
                            <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                        </button>

                        <LocationPickerModal
                            isOpen={isLocationModalOpen}
                            onClose={() => setIsLocationModalOpen(false)}
                            onSelect={(data) => {
                                setFormData({
                                    ...formData,
                                    province_id: data.province_id,
                                    district_id: data.district_id,
                                    commune_id: data.commune_id,
                                    village_id: data.village_id
                                });
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Detail Address</label>
                        <input type="text" placeholder="House number, Street name, or Landmarks..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner" />
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Location on Map</label>
                        <button
                            type="button"
                            onClick={() => setIsMapModalOpen(true)}
                            className="w-full h-48 bg-gray-50 border-2 border-gray-200 rounded-2xl overflow-hidden relative group hover:border-blue-400 transition-all shadow-sm"
                        >
                            {/* Mini Map Preview */}
                            <div className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                <MapView lat={formData.lat} lng={formData.lng} />
                            </div>

                            {/* Overlay UI */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[1px] group-hover:bg-white/5 transition-all">
                                <div className="p-3 bg-white rounded-full shadow-lg text-blue-600 transform group-hover:scale-110 transition-transform">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                </div>
                                <span className="text-[10px] font-black text-gray-700 bg-white/95 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                    Tap to Update Location Pin
                                </span>
                            </div>
                        </button>

                        <MapPickerModal
                            isOpen={isMapModalOpen}
                            onClose={() => setIsMapModalOpen(false)}
                            lat={formData.lat}
                            lng={formData.lng}
                            onSelect={(lat, lng) => setFormData((prev: any) => ({ ...prev, lat, lng }))}
                        />
                    </div>
                </div>
            </div>

            {/* Contact Info Section */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-8 py-5 border-b border-gray-100">
                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-widest">Contact Information</h2>
                </div>
                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Poster Name</label>
                            <input type="text" required placeholder="Enter your name" value={formData.poster_name} onChange={e => setFormData({...formData, poster_name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner" />
                        </div>
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Email Address</label>
                            <input type="email" placeholder="email@example.com" value={formData.poster_email} onChange={e => setFormData({...formData, poster_email: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner" />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Numbers</label>
                            {phones.length < 3 && (
                                <button
                                    type="button"
                                    onClick={addPhone}
                                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                    Add Phone
                                </button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {phones.map((phone, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-3">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{idx + 1}</span>
                                        </div>
                                        <input
                                            type="tel"
                                            required={idx === 0}
                                            placeholder="012 345 678"
                                            value={phone}
                                            onChange={e => handlePhoneValueChange(idx, e.target.value)}
                                            className="w-full pl-16 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner"
                                        />
                                    </div>
                                    {phones.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removePhoneField(idx)}
                                            className="p-4 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest">Company Name (Optional)</label>
                        <input type="text" placeholder="Enter company name if you are a business" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-inner" />
                    </div>
                </div>
            </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-6">
            <p className="text-xs text-gray-500">Updating your ad will keep it relevant for buyers.</p>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto min-w-[300px] bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Ad Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

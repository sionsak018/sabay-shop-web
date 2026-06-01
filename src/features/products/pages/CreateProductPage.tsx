import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export const CreateProductPage = () => {
  const navigate = useNavigate();
  const editorRef = useRef<any>(null);

  const [step, setStep] = useState(1); // 1: Category, 2: Information
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<Category | null>(null);

  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [formData, setFormData] = useState<any>({
    title: '',
    description: '',
    price: '',
    category_id: '',
    province_id: '',
    district_id: '',
    commune_id: '',
    village_id: '',
    address: '',
    poster_name: '',
    poster_email: '',
    condition: 'used',
    company_name: '',
    lat: '11.5564',
    lng: '104.9282',
  });

  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});
  const [phones, setPhones] = useState<string[]>(['']);

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, provRes, limitRes] = await Promise.all([
          categoryApi.getAll(),
          api.get('/provinces'),
          api.get('/my-products/check-limit')
        ]);
        setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.data || []);
        setProvinces(Array.isArray(provRes.data) ? provRes.data : provRes.data.data || []);
        setLimitInfo(limitRes.data);
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.province_id) {
      api.get(`/districts?province_id=${formData.province_id}`)
        .then(res => {
          setDistricts(res.data);
          setCommunes([]);
        })
        .catch(() => setDistricts([]));
    }
  }, [formData.province_id]);

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

  useEffect(() => {
    if (formData.commune_id) {
      api.get(`/villages?commune_id=${formData.commune_id}`)
        .then(res => setVillages(res.data))
        .catch(() => setVillages([]));
    }
  }, [formData.commune_id]);

  useEffect(() => {
    if (formData.category_id) {
      api.get(`/category-attributes/${formData.category_id}`)
        .then(res => setDynamicAttributes(res.data))
        .catch(() => setDynamicAttributes([]));
    }
  }, [formData.category_id]);

  const handleSelectMainCat = (cat: Category) => {
    setSelectedMainCat(cat);
    const subs = categories.filter(c => c.parent_id === cat.id);
    if (subs.length === 0) {
      setFormData({ ...formData, category_id: String(cat.id) });
      setStep(2);
    }
  };

  const handleSelectSubCat = (cat: Category) => {
    setFormData({ ...formData, category_id: String(cat.id) });
    setStep(2);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (images.length + selectedFiles.length > 10) {
        alert('Max 10 photos allowed');
        return;
      }
      setImages(prev => [...prev, ...selectedFiles]);
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index: number) => {
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
    if (idx === 0 && val.trim() && errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const removePhoneField = (idx: number) => {
    if (phones.length > 1) {
        setPhones(phones.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = 'ព័ត៌មាននេះត្រូវបានទាមទារ';

    if (!formData.category_id) newErrors.category_id = Msg;
    if (images.length === 0) newErrors.images = Msg;
    if (!formData.title.trim()) newErrors.title = Msg;
    if (!formData.price) newErrors.price = Msg;
    if (!formData.province_id) newErrors.province_id = Msg;
    if (!formData.district_id) newErrors.district_id = Msg;
    if (!formData.poster_name.trim()) newErrors.poster_name = Msg;
    if (!phones[0]?.trim()) newErrors.phone = Msg;

    const description = editorRef.current?.getInstance().getMarkdown();
    if (!description || description.trim().length < 5) {
      newErrors.description = Msg;
    }

    // Validate dynamic attributes
    dynamicAttributes.forEach(attr => {
        if (attr.pivot.is_required && !attributeValues[attr.id]) {
            newErrors[`attr_${attr.id}`] = Msg;
        }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError('សូមពិនិត្យមើលទិន្នន័យដែលខ្វះខាត');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setError(null);
    setErrors({});

    const submitForm = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value && key !== 'poster_phones' && key !== 'condition') {
          submitForm.append(key, value as string);
      }
    });

    submitForm.set('poster_phones', JSON.stringify(phones.filter(p => p.trim() !== '')));
    submitForm.set('condition', formData.condition);

    const provName = provinces.find(p => String(p.id) === String(formData.province_id))?.name || '';
    const distName = districts.find(d => String(d.id) === String(formData.district_id))?.name || '';
    const commName = communes.find(c => String(c.id) === String(formData.commune_id))?.name || '';
    const villName = villages.find(v => String(v.id) === String(formData.village_id))?.name || '';
    const locationString = [villName, commName, distName, provName].filter(Boolean).join(', ');
    submitForm.set('location', locationString || 'Cambodia');

    submitForm.set('description', description);
    submitForm.append('attributes', JSON.stringify(attributeValues));

    // Fix: Explicitly append each image to 'images[]'
    if (images.length > 0) {
      images.forEach((img) => {
        submitForm.append('images[]', img);
      });
    }

    try {
      await productApi.create(submitForm);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post ad. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-gray-50 py-10 antialiased text-left font-sans">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 bg-white py-5 mb-32 border border-gray-200 rounded shadow-sm">

        {/* Step Header */}
        <div className="flex items-center border-b border-gray-200 mb-4 pb-4">
          <div className="flex-1">
            <h1 className="font-semibold text-2xl mb-4">Post an Ad</h1>
            <div className="flex gap-4 items-center text-md">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</span>
                Choose a category
              </div>
              <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
                Fill Information
              </div>
            </div>
          </div>
          {limitInfo && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ad Usage</div>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-lg font-black ${limitInfo.limit_reached ? 'text-red-500' : 'text-blue-600'}`}>{limitInfo.active_count}/{limitInfo.post_limit}</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase">{limitInfo.account_type}</span>
              </div>
            </div>
          )}
        </div>

        {limitInfo?.limit_reached && (
          <div className="bg-red-50 border border-red-100 p-8 rounded-2xl flex flex-col md:flex-row items-start gap-6 mb-8 animate-in slide-in-from-top-4 duration-500">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0 shadow-inner">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </div>
             <div className="flex-1">
                <h3 className="font-black text-red-900 text-xl uppercase tracking-tight mb-2">Ad Limit Reached</h3>
                <p className="text-red-700 text-base font-bold">You have used all your active ad slots ({limitInfo.active_count}/{limitInfo.post_limit}).</p>
                <p className="text-red-600/80 text-sm mt-3 leading-relaxed max-w-2xl">
                    To continue posting, you can either delete your old or sold items to free up slots, or upgrade your account to a <b>Store Member</b> for unlimited postings and more features.
                </p>

                <div className="flex flex-wrap gap-4 mt-8">
                    <Link
                      to="/profile?tab=ads"
                      className="px-8 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2.5 shadow-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        Manage My Ads
                    </Link>
                    <a
                      href="https://t.me/Sion_Sak"
                      target="_blank"
                      rel="noreferrer"
                      className="px-8 py-3 bg-[#0088cc] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0077b5] transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2.5"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.543.26l.195-2.98 5.414-4.89c.235-.213-.054-.333-.37-.14l-6.685 4.21-2.888-.905c-.628-.196-.64-.628.13-.93l11.28-4.35c.52-.196.97.12.766 1.05z"/></svg>
                        Become a Store Member
                    </a>
                </div>
             </div>
          </div>
        )}


        {step === 1 && (
          <div className="animate-in fade-in duration-500">
            <h2 className="font-semibold text-lg mt-6 mb-4">Category</h2>

            {/* Split Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-200 rounded-lg overflow-hidden h-[500px] sm:h-[600px]">

              {/* Parent Categories */}
              <div className="bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">
                  <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-600">1</span>
                  Choose a category
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar py-1 min-h-0">
                  <ul className="divide-y divide-gray-50">
                    {mainCategories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedMainCat(cat)}
                          onClick={() => handleSelectMainCat(cat)}
                          className={`w-full group flex gap-4 items-center py-3 px-4 hover:bg-gray-50 transition-all text-left ${selectedMainCat?.id === cat.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                        >
                          {cat.image_url ? (
                            <img src={getImageUrl(cat.image_url)} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></div>
                          )}
                          <p className={`flex-1 text-sm font-bold ${selectedMainCat?.id === cat.id ? 'text-blue-600' : 'text-gray-600'}`}>{cat.name}</p>
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sub Categories */}
              <div className="bg-white flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest shrink-0">
                  <span className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-[10px] text-gray-600">2</span>
                  Select a subcategory
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar py-1 min-h-0">
                  {!selectedMainCat ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        </div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Please choose a main category first</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50 animate-in slide-in-from-right-4 duration-300">
                      {categories.filter(sub => sub.parent_id === selectedMainCat.id).map(sub => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSubCat(sub)}
                            className="w-full group flex gap-4 items-center py-3 px-6 hover:bg-blue-50 transition-all text-left"
                          >
                            {sub.image_url ? (
                              <img src={getImageUrl(sub.image_url)} className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></div>
                            )}
                            <p className="flex-1 text-sm font-bold text-gray-700 group-hover:text-blue-600">{sub.name}</p>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="animate-in fade-in duration-500">

            <div className="flex items-center justify-between mb-8">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1 uppercase tracking-widest">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                   Change Category
                </button>
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100">
                   {selectedMainCat?.name} {'>'} {categories.find(c => String(c.id) === formData.category_id)?.name}
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl text-sm font-bold mb-8">{error}</div>}

            <div className="space-y-12">
                {/* Photos Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Ad Photos
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                                <img src={src} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                        ))}
                        {images.length < 10 && (
                            <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all bg-gray-50/50 ${errors.images ? 'border-red-300 bg-red-50/30 text-red-400' : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'}`}>
                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                    {errors.images && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 animate-pulse">{errors.images}</p>}
                </div>

                {/* Specifications Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Item Specifications
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-6 border border-gray-100 rounded-2xl bg-gray-50/30">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Condition <span className="text-red-500">*</span></label>
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
                                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">
                                    {attr.name} {attr.pivot.is_required && <span className="text-red-500">*</span>}
                                </label>
                                {attr.type === 'select' ? (
                                    <select
                                    required={!!attr.pivot.is_required}
                                    value={attributeValues[attr.id] || ''}
                                    onChange={e => {
                                        setAttributeValues({ ...attributeValues, [attr.id]: e.target.value });
                                        if (errors[`attr_${attr.id}`]) setErrors(prev => ({ ...prev, [`attr_${attr.id}`]: '' }));
                                    }}
                                    className={`w-full px-5 py-3.5 bg-white border rounded-xl outline-none transition font-bold text-gray-800 shadow-sm ${errors[`attr_${attr.id}`] ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
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
                                        // Prevent negative numbers for fields like price/discount
                                        if (attr.type === 'number' && Number(val) < 0) val = '';
                                        setAttributeValues({ ...attributeValues, [attr.id]: val });
                                        if (errors[`attr_${attr.id}`]) setErrors(prev => ({ ...prev, [`attr_${attr.id}`]: '' }));
                                    }}
                                    className={`w-full px-5 py-3.5 bg-white border rounded-xl outline-none transition font-bold text-gray-800 shadow-sm ${errors[`attr_${attr.id}`] ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                    placeholder={`Enter ${attr.name.toLowerCase()}`}
                                />
                            )}
                            {errors[`attr_${attr.id}`] && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors[`attr_${attr.id}`]}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* General Info */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Basic Information
                    </h2>
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Ad Title <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                                                placeholder="e.g. iPhone 15 Pro Max 256GB Gold"
                                value={formData.title}
                                onChange={e => {
                                    setFormData({...formData, title: e.target.value});
                                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                                }}
                                className={`w-full px-6 py-4 border rounded-2xl focus:bg-white outline-none transition font-bold text-gray-800 shadow-sm ${errors.title ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                            />
                            {errors.title && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Price ($) <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-lg ${errors.price ? 'text-red-300' : 'text-gray-400'}`}>$</span>
                                <input
                                    type="number"
                                                                        placeholder="0.00"
                                    value={formData.price}
                                    onChange={e => {
                                        setFormData({...formData, price: e.target.value});
                                        if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                                    }}
                                    className={`w-full pl-12 pr-6 py-4 border rounded-2xl focus:bg-white outline-none transition font-black text-gray-800 text-lg shadow-sm ${errors.price ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                />
                            </div>
                            {errors.price && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.price}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Description <span className="text-red-500">*</span></label>
                            <div className={`border rounded-2xl overflow-hidden shadow-sm ${errors.description ? 'border-red-300' : 'border-gray-200'}`}>
                                <Editor
                                    ref={editorRef}
                                    initialValue=""
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
                            {errors.description && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.description}</p>}
                        </div>
                    </div>
                </div>

                {/* Location Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Item Location
                    </h2>
                    <div className="space-y-8 p-6 border border-gray-100 rounded-2xl bg-gray-50/30">

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Select Location <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => setIsLocationModalOpen(true)}
                                className={`w-full flex items-center justify-between px-6 py-4 bg-white border rounded-2xl transition-all text-left group shadow-sm ${errors.province_id || errors.district_id ? 'border-red-300' : 'border-gray-200 hover:border-blue-500'}`}
                            >
                                {formData.province_id ? (
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${errors.province_id || errors.district_id ? 'text-red-500' : 'text-blue-600'}`}>Current Selection</span>
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
                                <svg className={`w-5 h-5 transition-colors ${errors.province_id || errors.district_id ? 'text-red-300' : 'text-gray-300 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                            </button>
                            {(errors.province_id || errors.district_id) && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.province_id || errors.district_id}</p>}

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
                                    if (errors.province_id || errors.district_id) {
                                        setErrors(prev => ({ ...prev, province_id: '', district_id: '' }));
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Detail Address</label>
                            <input type="text" placeholder="House number, Street name, or Landmarks..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-sm" />
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Location on Map</label>
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(true)}
                                className="w-full h-48 bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden relative group hover:border-blue-400 transition-all shadow-sm"
                            >
                                <div className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                                    <MapView lat={formData.lat} lng={formData.lng} />
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 backdrop-blur-[1px] group-hover:bg-white/5 transition-all">
                                    <div className="p-3 bg-white rounded-full shadow-lg text-blue-600 transform group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-700 bg-white/95 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                        Tap to Pin Exact Location
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

                {/* Contact Info */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Contact Details
                    </h2>
                    <div className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Poster Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                                                        placeholder="Enter your name"
                                    value={formData.poster_name}
                                    onChange={e => {
                                        setFormData({...formData, poster_name: e.target.value});
                                        if (errors.poster_name) setErrors(prev => ({ ...prev, poster_name: '' }));
                                    }}
                                    className={`w-full px-6 py-4 border rounded-2xl focus:bg-white outline-none transition font-bold text-gray-800 shadow-sm ${errors.poster_name ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`}
                                />
                                {errors.poster_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.poster_name}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Email Address</label>
                                <input type="email" placeholder="email@example.com" value={formData.poster_email} onChange={e => setFormData({...formData, poster_email: e.target.value})} className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-sm" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3 ml-1">
                                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Numbers (Max 3) <span className="text-red-500">*</span></label>
                                {phones.length < 3 && (
                                    <button type="button" onClick={addPhone} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                        Add Phone
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {phones.map((phone, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 pr-3">
                                                <svg className={`w-4 h-4 ${idx === 0 && errors.phone ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                                <span className={`text-[10px] font-black ${idx === 0 && errors.phone ? 'text-red-400' : 'text-gray-400'}`}>{idx + 1}</span>
                                            </div>
                                            <input type="tel" ={idx === 0} placeholder="012 345 678" value={phone} onChange={e => handlePhoneValueChange(idx, e.target.value)} className={`w-full pl-16 pr-4 py-4 border rounded-2xl focus:bg-white outline-none transition font-bold text-gray-800 shadow-sm ${idx === 0 && errors.phone ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'}`} />
                                        </div>
                                        {phones.length > 1 && (
                                            <button type="button" onClick={() => removePhoneField(idx)} className="p-4 text-gray-400 hover:text-red-500 transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.phone}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Business/Company Name (Optional)</label>
                            <input type="text" placeholder="Enter company name if applicable" value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} className="w-full px-6 py-4 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition font-bold text-gray-800 shadow-sm" />
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-12 mt-12 border-t border-gray-100">
              <div className="flex items-start gap-3 max-w-md">
                 <input type="checkbox"  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                 <p className="text-[11px] text-gray-500 leading-relaxed font-bold uppercase tracking-tight">
                   I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms and Conditions</span> and <span className="text-blue-600 hover:underline cursor-pointer">Safety Guidelines</span> of Sabay Shop.
                 </p>
              </div>
              <button
                type="submit"
                disabled={loading || limitInfo?.limit_reached}
                className="w-full sm:w-auto min-w-[300px] bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Processing...' : limitInfo?.limit_reached ? 'Limit Reached' : 'Post Ad Now'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

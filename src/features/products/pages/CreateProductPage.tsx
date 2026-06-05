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
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';

// Toast UI Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';

export const CreateProductPage = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
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
    condition: '',
    company_name: '',
    lat: '',
    lng: '',
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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    const Msg = t('create_product.required');

    if (!formData.category_id) newErrors.category_id = Msg;
    if (images.length === 0) newErrors.images = Msg;
    if (!formData.title.trim()) newErrors.title = Msg;
    if (!formData.price) newErrors.price = Msg;
    if (!formData.province_id) newErrors.province_id = Msg;
    if (!formData.district_id) newErrors.district_id = Msg;
    if (!formData.condition) newErrors.condition = Msg;
    if (!formData.poster_name.trim()) newErrors.poster_name = Msg;
    if (!phones[0]?.trim()) newErrors.phone = Msg;

    if (!formData.poster_email.trim()) {
        newErrors.poster_email = Msg;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.poster_email)) {
        newErrors.poster_email = t('create_product.invalid_email', { defaultValue: 'Invalid email address' });
    }

    if (!formData.company_name.trim()) newErrors.company_name = Msg;

    if (!formData.address.trim()) newErrors.address = Msg;
    if (!formData.lat || !formData.lng) newErrors.lat = Msg;
    if (!agreedToTerms) newErrors.terms = Msg;

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
      setError(t('create_product.check_data', { defaultValue: 'Please check the missing data' }));
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
      showAlert({
        title: t('create_product.success_title'),
        message: t('create_product.success_message'),
        type: 'success',
        onClose: () => navigate('/', { replace: true })
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t('create_product.failed_to_post', { defaultValue: 'Failed to post ad. Please try again.' }));
      showAlert({
        title: t('create_product.error_title', { defaultValue: 'Problem!' }),
        message: err.response?.data?.message || t('create_product.failed_to_post', { defaultValue: 'Cannot submit the ad, please try again.' }),
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08060d] py-10 antialiased text-left font-sans transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 bg-white dark:bg-[#16171d] py-5 mb-32 border border-gray-200 dark:border-gray-800 rounded shadow-sm">

        {/* Step Header */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-800 mb-4 pb-4">
          <div className="flex-1">
            <h1 className="font-semibold text-2xl mb-4 text-gray-900 dark:text-gray-100">{t('create_product.title')}</h1>
            <div className="flex gap-4 items-center text-md">
              <div className={`flex items-center gap-2 ${step === 1 ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>1</span>
                {t('create_product.step_1')}
              </div>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              <div className={`flex items-center gap-2 ${step === 2 ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>2</span>
                {t('create_product.step_2')}
              </div>
            </div>
          </div>
          {limitInfo && (
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Ad Usage</div>
              <div className="flex items-center gap-2 justify-end">
                <span className={`text-lg font-black ${limitInfo.limit_reached ? 'text-red-500' : 'text-blue-600'}`}>{limitInfo.active_count}/{limitInfo.post_limit}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">{limitInfo.account_type}</span>
              </div>
            </div>
          )}
        </div>

        {limitInfo?.limit_reached && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-8 rounded-2xl flex flex-col md:flex-row items-start gap-6 mb-8 animate-in slide-in-from-top-4 duration-500">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-500 shrink-0 shadow-inner">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
             </div>
             <div className="flex-1">
                <h3 className="font-black text-red-900 dark:text-red-400 text-xl uppercase tracking-tight mb-2">Ad Limit Reached</h3>
                <p className="text-red-700 dark:text-red-500 text-base font-bold">You have used all your active ad slots ({limitInfo.active_count}/{limitInfo.post_limit}).</p>
                <p className="text-red-600/80 dark:text-red-400/80 text-sm mt-3 leading-relaxed max-w-2xl">
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
            <h2 className="font-semibold text-lg mt-6 mb-4">{t('common.categories')}</h2>

            {/* Split Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden h-[700px] md:h-[600px]">

              {/* Parent Categories */}
              <div className="bg-white dark:bg-[#16171d] border-r border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest shrink-0">
                  <span className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">1</span>
                  {t('create_product.step_1')}
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar py-1 min-h-0">
                  <ul className="divide-y divide-gray-50 dark:divide-gray-800/50">
                    {mainCategories.map((cat) => (
                      <li key={cat.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setSelectedMainCat(cat)}
                          onClick={() => handleSelectMainCat(cat)}
                          className={`w-full group flex gap-4 items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all text-left ${selectedMainCat?.id === cat.id ? 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}
                        >
                          {cat.image_url ? (
                            <img src={getImageUrl(cat.image_url)} className="w-10 h-10 object-contain" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center"><svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></div>
                          )}
                          <p className={`flex-1 text-sm font-bold ${selectedMainCat?.id === cat.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>{cat.name}</p>
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sub Categories */}
              <div className="bg-white dark:bg-[#16171d] flex flex-col h-full overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest shrink-0">
                  <span className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] text-gray-600 dark:text-gray-300">2</span>
                  {t('create_product.select_sub_category', { defaultValue: 'Select a subcategory' })}
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar py-1 min-h-0">
                  {!selectedMainCat ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-200 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                        </div>
                        <p className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest">{t('create_product.choose_main_first', { defaultValue: 'Please choose a main category first' })}</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800/50 animate-in slide-in-from-right-4 duration-300">
                      {categories.filter(sub => sub.parent_id === selectedMainCat.id).map(sub => (
                        <li key={sub.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSubCat(sub)}
                            className="w-full group flex gap-4 items-center py-3 px-6 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left"
                          >
                            {sub.image_url ? (
                              <img src={getImageUrl(sub.image_url)} className="w-8 h-8 object-contain" />
                            ) : (
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center"><svg className="w-4 h-4 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"/></svg></div>
                            )}
                            <p className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">{sub.name}</p>
                            <svg className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
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
          <form onSubmit={handleSubmit} noValidate className="animate-in fade-in duration-500">

            <div className="flex items-center justify-between mb-8">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 uppercase tracking-widest">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                   {t('create_product.change_category')}
                </button>
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                   {selectedMainCat?.name} {'>'} {categories.find(c => String(c.id) === formData.category_id)?.name}
                </div>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-500 px-6 py-4 rounded-xl text-sm font-bold mb-8">{error}</div>}

            <div className="space-y-12">
                {/* Photos Section */}
                <div className="space-y-6">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                        <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
                        {t('create_product.ad_photos')}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {previews.map((src, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group shadow-sm">
                                <img src={src} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(idx)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                </button>
                            </div>
                        ))}
                        {images.length < 10 && (
                            <label className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-800/50 ${errors.images ? 'border-red-300 bg-red-50/30 text-red-400' : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                                <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('create_product.add_photo')}</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                    {errors.images && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1 animate-pulse">{errors.images}</p>}
                </div>

                {/* Specifications Section */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {t('create_product.specifications')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-8 p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.condition')} <span className="text-red-500">*</span></label>
                            <div className={`flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1 border transition-colors ${errors.condition ? 'border-red-300' : 'border-transparent'}`}>
                                {['New', 'Used'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            setFormData((prev: any) => ({...prev, condition: c.toLowerCase()}));
                                            if (errors.condition) setErrors(prev => ({ ...prev, condition: '' }));
                                        }}
                                        className={`flex-1 py-3 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${formData.condition === c.toLowerCase() ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                                    >
                                        {c === 'New' ? t('create_product.new') : t('create_product.used')}
                                    </button>
                                ))}
                            </div>
                            {errors.condition && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors.condition}</p>}
                        </div>

                        {dynamicAttributes.map(attr => (
                            <div key={attr.id}>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">
                                    {attr.name} {attr.pivot.is_required && <span className="text-red-500">*</span>}
                                </label>
                                {attr.type === 'select' ? (
                                    <select
                                    value={attributeValues[attr.id] || ''}
                                    onChange={e => {
                                        setAttributeValues({ ...attributeValues, [attr.id]: e.target.value });
                                        if (errors[`attr_${attr.id}`]) setErrors(prev => ({ ...prev, [`attr_${attr.id}`]: '' }));
                                    }}
                                    className={`w-full px-5 py-3.5 bg-white dark:bg-[#08060d] border rounded-xl outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm ${errors[`attr_${attr.id}`] ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                                >
                                    <option value="">{t('create_product.select_attr', { defaultValue: 'Select {{name}}', name: attr.name })}</option>
                                    {attr.options?.map((o: any) => <option key={o.id} value={o.value}>{o.value}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={attr.type === 'number' ? 'number' : 'text'}
                                    value={attributeValues[attr.id] || ''}
                                    autoComplete="off"
                                    onChange={e => {
                                        let val = e.target.value;
                                        // Prevent negative numbers for fields like price/discount
                                        if (attr.type === 'number' && Number(val) < 0) val = '';
                                        setAttributeValues({ ...attributeValues, [attr.id]: val });
                                        if (errors[`attr_${attr.id}`]) setErrors(prev => ({ ...prev, [`attr_${attr.id}`]: '' }));
                                    }}
                                    className={`w-full px-5 py-3.5 bg-white dark:bg-[#08060d] border rounded-xl outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm ${errors[`attr_${attr.id}`] ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                                    placeholder={t('create_product.enter_attr', { defaultValue: 'Enter {{name}}', name: attr.name.toLowerCase() })}
                                />
                            )}
                            {errors[`attr_${attr.id}`] && <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">{errors[`attr_${attr.id}`]}</p>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* General Info */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {t('create_product.basic_info')}
                    </h2>
                    <div className="space-y-8">
                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.ad_title')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder={t('create_product.ad_title_placeholder', { defaultValue: 'e.g. iPhone 15 Pro Max 256GB Gold' })}
                                value={formData.title}
                                onChange={e => {
                                    setFormData({...formData, title: e.target.value});
                                    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                                }}
                                className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.title ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                            />
                            {errors.title && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.price')} ($) <span className="text-red-500">*</span></label>
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
                                    className={`w-full pl-12 pr-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-black text-gray-800 dark:text-gray-100 text-lg shadow-sm bg-white dark:bg-[#08060d] ${errors.price ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                                />
                            </div>
                            {errors.price && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.price}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.description')} <span className="text-red-500">*</span></label>
                            <div className={`border rounded-2xl overflow-hidden shadow-sm ${errors.description ? 'border-red-300' : 'border-gray-200 dark:border-gray-800'}`}>
                                <Editor
                                    ref={editorRef}
                                    initialValue=""
                                    placeholder={t('create_product.description_placeholder', { defaultValue: 'Tell buyers about your item (specs, warranty, features...)' })}
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
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {t('create_product.location_section')}
                    </h2>
                    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20">

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.select_location')} <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => setIsLocationModalOpen(true)}
                                className={`w-full flex items-center justify-between px-6 py-4 bg-white dark:bg-[#08060d] border rounded-2xl transition-all text-left group shadow-sm ${errors.province_id || errors.district_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-400'}`}
                            >
                                {formData.province_id ? (
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${errors.province_id || errors.district_id ? 'text-red-500' : 'text-blue-600'}`}>{t('create_product.current_selection')}</span>
                                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                            {provinces.find(p => String(p.id) === formData.province_id)?.name}
                                            {formData.district_id && ` > ${districts.find(d => String(d.id) === formData.district_id)?.name}`}
                                            {formData.commune_id && ` > ${communes.find(c => String(c.id) === formData.commune_id)?.name}`}
                                            {formData.village_id && ` > ${villages.find(v => String(v.id) === formData.village_id)?.name}`}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold text-gray-400 dark:text-gray-600">{t('create_product.tap_to_choose')}</span>
                                )}
                                <svg className={`w-5 h-5 transition-colors ${errors.province_id || errors.district_id ? 'text-red-300' : 'text-gray-300 dark:text-gray-700 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
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
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.detail_address')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder={t('create_product.detail_address_placeholder', { defaultValue: 'House number, Street name, or Landmarks...' })}
                                value={formData.address}
                                onChange={e => {
                                    setFormData({...formData, address: e.target.value});
                                    if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                                }}
                                className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.address ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                            />
                            {errors.address && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.address}</p>}
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.location_on_map')} <span className="text-red-500">*</span></label>
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(true)}
                                className={`w-full h-48 bg-gray-50 dark:bg-gray-800 border rounded-2xl overflow-hidden relative group transition-all shadow-sm ${errors.lat ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-400'}`}
                            >
                                <div className="absolute inset-0 pointer-events-none opacity-50 dark:opacity-30 group-hover:opacity-100 transition-opacity">
                                    <MapView lat={formData.lat} lng={formData.lng} />
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] group-hover:bg-white/5 transition-all">
                                    <div className="p-3 bg-white dark:bg-gray-900 rounded-full shadow-lg text-blue-600 transform group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    </div>
                                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 bg-white/95 dark:bg-gray-900/95 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                                        {t('create_product.pin_location')}
                                    </span>
                                </div>
                            </button>
                            {errors.lat && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.lat}</p>}
                            <MapPickerModal
                                isOpen={isMapModalOpen}
                                onClose={() => setIsMapModalOpen(false)}
                                lat={formData.lat}
                                lng={formData.lng}
                                onSelect={(lat, lng) => {
                                    setFormData((prev: any) => ({ ...prev, lat, lng }));
                                    if (errors.lat) setErrors(prev => ({ ...prev, lat: '' }));
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {t('create_product.contact_details')}
                    </h2>
                    <div className="p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20 space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.poster_name')} <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                                                        placeholder={t('create_product.poster_name_placeholder', { defaultValue: 'Enter your name' })}
                                    value={formData.poster_name}
                                    onChange={e => {
                                        setFormData({...formData, poster_name: e.target.value});
                                        if (errors.poster_name) setErrors(prev => ({ ...prev, poster_name: '' }));
                                    }}
                                    className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.poster_name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                                />
                                {errors.poster_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.poster_name}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.email')} <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={formData.poster_email}
                                    onChange={e => {
                                        setFormData({...formData, poster_email: e.target.value});
                                        if (errors.poster_email) setErrors(prev => ({ ...prev, poster_email: '' }));
                                    }}
                                    className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.poster_email ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                                />
                                {errors.poster_email && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.poster_email}</p>}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3 ml-1">
                                <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('create_product.phone_numbers')} (Max 3) <span className="text-red-500">*</span></label>
                                {phones.length < 3 && (
                                    <button type="button" onClick={addPhone} className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 uppercase tracking-widest flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"/></svg>
                                        {t('create_product.add_phone')}
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {phones.map((phone, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="relative flex-grow">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-gray-200 dark:border-gray-800 pr-3">
                                                <svg className={`w-4 h-4 ${idx === 0 && errors.phone ? 'text-red-400' : 'text-gray-400 dark:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                                <span className={`text-[10px] font-black ${idx === 0 && errors.phone ? 'text-red-400' : 'text-gray-400 dark:text-gray-600'}`}>{idx + 1}</span>
                                            </div>
                                            <input type="tel" placeholder="012 345 678" value={phone} onChange={e => handlePhoneValueChange(idx, e.target.value)} className={`w-full pl-16 pr-4 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${idx === 0 && errors.phone ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`} />
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
                            <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.company_name')} <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                placeholder={t('create_product.company_name_placeholder', { defaultValue: 'Enter company name if applicable' })}
                                value={formData.company_name}
                                onChange={e => {
                                    setFormData({...formData, company_name: e.target.value});
                                    if (errors.company_name) setErrors(prev => ({ ...prev, company_name: '' }));
                                }}
                                className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.company_name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                            />
                            {errors.company_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.company_name}</p>}
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-12 mt-12 border-t border-gray-100 dark:border-gray-800 transition-colors">
              <div className="flex flex-col gap-2 max-w-md">
                <div className="flex items-start gap-3">
                    <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={e => {
                            setAgreedToTerms(e.target.checked);
                            if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                        }}
                        className={`mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 ${errors.terms ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                    />
                    <p className={`text-[11px] leading-relaxed font-bold uppercase tracking-tight ${errors.terms ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('create_product.agree_terms')}
                    </p>
                </div>
                {errors.terms && <p className="text-red-500 text-[10px] font-bold ml-7">{errors.terms}</p>}
              </div>
              <button
                type="submit"
                disabled={loading || limitInfo?.limit_reached}
                className="w-full sm:w-auto sm:min-w-[300px] bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 disabled:opacity-50"
              >
                {loading ? t('create_product.processing') : limitInfo?.limit_reached ? t('create_product.limit_reached') : t('create_product.post_now')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

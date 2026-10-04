import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { productApi } from '../services/productApi';
import { categoryApi } from '../../categories/services/categoryApi';
import { type Category } from '../../categories/types/category.types';
import api from '../../../services/api';
import { MapPickerModal } from '../../../components/common/MapPickerModal';
import { LocationPickerModal } from '../../../components/common/LocationPickerModal';
import { MapView } from '../../../components/common/MapView';
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/hooks/useAuth';

// Toast UI Editor
import '@toast-ui/editor/dist/toastui-editor.css';
import { Editor } from '@toast-ui/react-editor';
import SmartImage from '../../../components/common/SmartImage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOTAL_STEPS = 4;

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  discount_price: '',
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
};

interface Draft {
  version: number;
  step: number;
  formData: Record<string, string>;
  phones: string[];
  attributeValues: Record<number, string>;
  description: string;
  descriptionHtml: string;
}

export const CreateProductPage = ({ adminMode = false, editId }: { adminMode?: boolean; editId?: number }) => {
  const isEdit = editId != null;
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { t } = useTranslation();
  const { user } = useAuth();
  const editorRef = useRef<any>(null);
  const submittedRef = useRef(false);

  const draftKey = `product_draft_${adminMode ? 'admin' : 'user'}_${user?.id ?? 'guest'}`;

  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMainCat, setSelectedMainCat] = useState<Category | null>(null);

  const [dynamicAttributes, setDynamicAttributes] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [communes, setCommunes] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  const [formData, setFormData] = useState<Record<string, string>>({ ...EMPTY_FORM });

  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});
  const [phones, setPhones] = useState<string[]>(['']);

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const [description, setDescription] = useState('');
  const [initialDescription, setInitialDescription] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      // Reset transient state so reusing this component for another product
      // never carries over uploaded files or removed-image ids into it.
      submittedRef.current = false;
      setStep(1);
      setErrors({});
      setError(null);
      setImages([]);
      setPreviews([]);
      setDeletedImageIds([]);
      setAttributeValues({});
      setDescription('');
      setInitialDescription('');
      setDescriptionHtml('');
      setAgreedToTerms(false);
      setSelectedMainCat(null);
      try {
        const [catRes, provRes] = await Promise.all([
          categoryApi.getAll(),
          api.get('/provinces'),
        ]);
        const catPayload = catRes.data as any;
        setCategories(Array.isArray(catPayload) ? catPayload : catPayload?.data || []);
        setProvinces(Array.isArray(provRes.data) ? provRes.data : provRes.data.data || []);

        if (isEdit && editId != null) {
          const productRes = await productApi.getOne(editId);
          const p = productRes.data as any;

          let phonesArray = [''];
          try {
            if (p.poster_phones) {
              const parsed = typeof p.poster_phones === 'string' ? JSON.parse(p.poster_phones) : p.poster_phones;
              if (Array.isArray(parsed) && parsed.length > 0) phonesArray = parsed;
            }
          } catch {
            // ignore malformed phone payload
          }
          setPhones(phonesArray);

          const desc = p.description || '';
          setFormData({
            ...EMPTY_FORM,
            title: p.title ?? '',
            description: desc,
            price: p.price != null ? String(p.price) : '',
            discount_price: p.discount_price ? String(p.discount_price) : '',
            category_id: String(p.category?.id ?? p.category_id ?? ''),
            province_id: String(p.province_id || ''),
            district_id: String(p.district_id || ''),
            commune_id: String(p.commune_id || ''),
            village_id: String(p.village_id || ''),
            address: p.address || '',
            poster_name: p.poster_name || '',
            poster_email: p.poster_email || '',
            condition: p.condition || '',
            company_name: p.company_name || '',
            lat: p.lat != null ? String(p.lat) : '',
            lng: p.lng != null ? String(p.lng) : '',
          });
          setExistingImages(p.images || []);
          setDescription(desc);
          setInitialDescription(desc);
          setDescriptionHtml('');
          setAgreedToTerms(true);

          const attrVals: Record<number, string> = {};
          p.attribute_values?.forEach((av: any) => { attrVals[av.attribute_id] = av.value; });
          setAttributeValues(attrVals);
        } else if (!adminMode) {
          const limitRes = await api.get('/my-products/check-limit');
          setLimitInfo(limitRes.data);
        }
      } catch (err) {
        console.error('Failed to load data', err);
        if (isEdit) setError(t('create_product.failed_to_load', { defaultValue: 'Failed to load this ad.' }));
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [adminMode, isEdit, editId, t]);

  // Cascade location selects
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

  // Prefill contact info from the signed-in account (never overwrite a draft)
  useEffect(() => {
    if (isEdit || !user) return;
    setFormData(prev => ({
      ...prev,
      poster_name: prev.poster_name || user.name || '',
      poster_email: prev.poster_email || user.email || '',
    }));
    setPhones(prev => (prev.length === 1 && !prev[0] && user.phone ? [user.phone] : prev));
  }, [isEdit, user]);

  // Restore a saved draft once
  useEffect(() => {
    if (isEdit) return;
    const raw = localStorage.getItem(draftKey);
    if (!raw) return;

    try {
      const draft = JSON.parse(raw) as Draft;
      if (!draft || draft.version !== 1 || !draft.formData) return;

      setFormData(prev => ({ ...prev, ...draft.formData }));
      if (Array.isArray(draft.phones) && draft.phones.length) setPhones(draft.phones);
      if (draft.attributeValues) setAttributeValues(draft.attributeValues);
      if (typeof draft.description === 'string') {
        setDescription(draft.description);
        setInitialDescription(draft.description);
      }
      if (typeof draft.descriptionHtml === 'string') setDescriptionHtml(draft.descriptionHtml);
      if (draft.step && draft.step >= 1 && draft.step <= TOTAL_STEPS) setStep(draft.step);
      setDraftRestored(true);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [isEdit, draftKey]);

  // Resolve the chosen category's parent for the wizard header
  useEffect(() => {
    if (selectedMainCat || !formData.category_id || categories.length === 0) return;
    const cat = categories.find(c => String(c.id) === String(formData.category_id));
    if (!cat) return;
    const parent = cat.parent_id ? categories.find(c => c.id === cat.parent_id) : cat;
    setSelectedMainCat(parent ?? cat);
  }, [categories, formData.category_id, selectedMainCat]);

  // Debounced draft autosave
  useEffect(() => {
    if (isEdit || submittedRef.current) return;
    const hasData = Boolean(
      formData.title || formData.price || formData.category_id || formData.poster_name || description,
    );
    if (!hasData) return;

    const timer = setTimeout(() => {
      const draft: Draft = {
        version: 1,
        step,
        formData,
        phones,
        attributeValues,
        description,
        descriptionHtml,
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    }, 800);

    return () => clearTimeout(timer);
  }, [isEdit, draftKey, step, formData, phones, attributeValues, description, descriptionHtml]);

  // Keep the editor content in sync when (re)entering the details step
  useEffect(() => {
    if (step !== 2) return;
    const instance = editorRef.current?.getInstance();
    if (!instance) return;
    if (description && instance.getMarkdown() !== description) {
      instance.setMarkdown(description);
    }
    setDescriptionHtml(instance.getHTML());
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before leaving with unsaved data
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (submittedRef.current) return;
      const hasData = formData.title || formData.price || formData.category_id || images.length > 0;
      if (hasData) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData, images.length]);

  const handleSelectMainCat = (cat: Category) => {
    setSelectedMainCat(cat);
    const subs = categories.filter(c => c.parent_id === cat.id);
    if (subs.length === 0) {
      setFormData(prev => ({ ...prev, category_id: String(cat.id) }));
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectSubCat = (cat: Category) => {
    setFormData(prev => ({ ...prev, category_id: String(cat.id) }));
    if (errors.category_id) setErrors(prev => ({ ...prev, category_id: '' }));
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    if (images.length + existingImages.length + selectedFiles.length > 10) {
      showAlert({
        title: t('create_product.ad_photos'),
        message: t('create_product.max_photos', { defaultValue: 'You can upload up to 10 photos.' }),
        type: 'warning',
      });
      e.target.value = '';
      return;
    }
    setImages(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (id: number) => {
    setDeletedImageIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setExistingImages(prev => prev.filter(img => img.id !== id));
    if (errors.images) setErrors(prev => ({ ...prev, images: '' }));
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

  const getLocationString = useCallback(() => {
    const provName = provinces.find(p => String(p.id) === String(formData.province_id))?.name || '';
    const distName = districts.find(d => String(d.id) === String(formData.district_id))?.name || '';
    const commName = communes.find(c => String(c.id) === String(formData.commune_id))?.name || '';
    const villName = villages.find(v => String(v.id) === String(formData.village_id))?.name || '';
    return [villName, commName, distName, provName].filter(Boolean).join(', ');
  }, [provinces, districts, communes, villages, formData.province_id, formData.district_id, formData.commune_id, formData.village_id]);

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    const Msg = t('create_product.required');

    if (s === 1) {
      if (!formData.category_id) e.category_id = Msg;
    } else if (s === 2) {
      if (images.length === 0 && existingImages.length === 0) e.images = Msg;
      if (!formData.title.trim()) e.title = Msg;
      if (!formData.price) e.price = Msg;
      if (formData.discount_price && Number(formData.discount_price) >= Number(formData.price)) {
        e.discount_price = t('create_product.discount_must_be_lower', { defaultValue: 'Discount price must be lower than original price' });
      }
      if (!description || description.trim().length < 5) e.description = Msg;
      if (!formData.condition) e.condition = Msg;
      dynamicAttributes.forEach(attr => {
        if (attr.pivot.is_required && !attributeValues[attr.id]) {
          e[`attr_${attr.id}`] = Msg;
        }
      });
    } else if (s === 3) {
      if (!formData.province_id) e.province_id = Msg;
      if (!formData.district_id) e.district_id = Msg;
      if (!formData.address.trim()) e.address = Msg;
      if (!formData.lat || !formData.lng) e.lat = Msg;
      if (!formData.poster_name.trim()) e.poster_name = Msg;
      if (!formData.poster_email.trim()) {
        e.poster_email = Msg;
      } else if (!EMAIL_RE.test(formData.poster_email)) {
        e.poster_email = t('create_product.invalid_email', { defaultValue: 'Invalid email address' });
      }
      if (!phones[0]?.trim()) e.phone = Msg;
      if (!formData.company_name.trim()) e.company_name = Msg;
    } else if (s === 4) {
      if (!agreedToTerms) e.terms = Msg;
    }
    return e;
  };

  const focusFirstError = (s: number, stepErrors: Record<string, string>) => {
    const order: Record<number, string[]> = {
      1: ['category_id'],
      2: ['images', 'title', 'price', 'discount_price', 'description', 'condition'],
      3: ['province_id', 'address', 'lat', 'poster_name', 'poster_email', 'phone', 'company_name'],
      4: ['terms'],
    };
    const first = (order[s] || []).find(k => stepErrors[k]) || Object.keys(stepErrors)[0];
    if (!first) return;
    const el = document.getElementById(`field-${first}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      try {
        (el as HTMLElement).focus();
      } catch {
        // element is not focusable; scrolling is enough
      }
    }
  };

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setError(t('create_product.check_data', { defaultValue: 'Please check the missing data' }));
      focusFirstError(step, stepErrors);
      return;
    }
    setErrors({});
    setError(null);
    setStep(s => Math.min(TOTAL_STEPS, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors({});
    setError(null);
    setStep(s => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const discardDraft = () => {
    localStorage.removeItem(draftKey);
    setDraftRestored(false);
    setFormData({ ...EMPTY_FORM });
    setPhones(['']);
    setAttributeValues({});
    setDescription('');
    setInitialDescription('');
    setDescriptionHtml('');
    setSelectedMainCat(null);
    setImages([]);
    setPreviews([]);
    setStep(1);
    setErrors({});
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Defensively validate every step and jump to the first one with a problem
    for (let s = 1; s <= TOTAL_STEPS; s++) {
      const stepErrors = validateStep(s);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setError(t('create_product.check_data', { defaultValue: 'Please check the missing data' }));
        setStep(s);
        setTimeout(() => focusFirstError(s, stepErrors), 0);
        return;
      }
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
    submitForm.set('location', getLocationString() || 'Cambodia');
    submitForm.set('description', description);
    submitForm.append('attributes', JSON.stringify(attributeValues));

    images.forEach((img) => {
      submitForm.append('images[]', img);
    });

    try {
      let createdId: number | undefined;
      if (isEdit && editId != null) {
        submitForm.append('deleted_image_ids', JSON.stringify(deletedImageIds));
        await productApi.update(editId, submitForm);
      } else if (adminMode) {
        const res = await api.post('/admin/products', submitForm);
        createdId = res.data?.id;
      } else {
        const res = await productApi.create(submitForm);
        createdId = res.data?.id;
      }

      submittedRef.current = true;
      if (!isEdit) localStorage.removeItem(draftKey);

      showAlert({
        title: isEdit ? t('create_product.updated_title', { defaultValue: 'Ad Updated' }) : t('create_product.success_title'),
        message: isEdit ? t('create_product.updated_message', { defaultValue: 'Your changes have been saved.' }) : t('create_product.success_message'),
        type: 'success',
        onClose: () => navigate(
          isEdit
            ? `/product/${editId}`
            : adminMode
              ? '/admin/products'
              : createdId
                ? `/product/${createdId}`
                : '/',
          { replace: true },
        ),
      });
    } catch (err: any) {
      setError(err.response?.data?.message || t('create_product.failed_to_post', { defaultValue: 'Failed to post ad. Please try again.' }));
      showAlert({
        title: t('create_product.error_title', { defaultValue: 'Problem!' }),
        message: err.response?.data?.message || t('create_product.failed_to_post', { defaultValue: 'Cannot submit the ad, please try again.' }),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const subCategories = selectedMainCat
    ? categories.filter(sub => sub.parent_id === selectedMainCat.id)
    : [];
  const selectedCategory = categories.find(c => String(c.id) === formData.category_id);
  const locationString = getLocationString();
  const coverImage = previews[0] || existingImages[0]?.image_url || '';
  const galleryImages: string[] = previews.length > 0
    ? [...previews.slice(1), ...existingImages.map((img: any) => img.image_url)]
    : existingImages.slice(1).map((img: any) => img.image_url);
  const totalPhotos = previews.length + existingImages.length;
  const steps = [
    { n: 1, label: t('create_product.step_1') },
    { n: 2, label: t('create_product.step_2') },
    { n: 3, label: t('create_product.step_3', { defaultValue: 'Location & Contact' }) },
    { n: 4, label: t('create_product.step_4', { defaultValue: 'Review & Post' }) },
  ];

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#08060d] flex items-center justify-center">
        <div className="animate-pulse font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest text-xs">{t('common.loading', { defaultValue: 'Loading...' })}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#08060d] py-6 sm:py-10 antialiased text-left font-sans transition-colors duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 bg-white dark:bg-[#16171d] py-5 mb-16 border border-gray-200 dark:border-gray-800 rounded shadow-sm">

        {/* Restored draft banner */}
        {draftRestored && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 px-4 py-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <div>
                <p className="text-xs font-bold text-blue-700 dark:text-blue-300">{t('create_product.draft_restored', { defaultValue: 'We restored your unsaved draft.' })}</p>
                <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">{t('create_product.draft_photos_note', { defaultValue: 'Photos are not saved in drafts — please add them again.' })}</p>
              </div>
            </div>
            <button type="button" onClick={discardDraft} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 whitespace-nowrap">
              {t('create_product.discard_draft', { defaultValue: 'Discard' })}
            </button>
          </div>
        )}

        {/* Step Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-gray-200 dark:border-gray-800 mb-4 pb-4 gap-4">
          <div className="flex-1">
            <h1 className="font-semibold text-2xl mb-4 text-gray-900 dark:text-gray-100">{isEdit ? t('create_product.edit_title', { defaultValue: 'Edit Your Ad' }) : t('create_product.title')}</h1>
            <div className="flex flex-wrap gap-x-3 gap-y-2 items-center text-sm">
              {steps.map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => s.n < step && setStep(s.n)}
                    className={`flex items-center gap-2 ${step === s.n ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'} ${s.n < step ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span className={`rounded-full w-5 h-5 flex items-center justify-center text-[10px] ${step >= s.n ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{s.n}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                  )}
                </div>
              ))}
            </div>
          </div>
          {!adminMode && limitInfo && (
            <div className="text-left sm:text-right shrink-0">
              <div className="text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest mb-1">Ad Usage</div>
              <div className="flex items-center gap-2 sm:justify-end">
                <span className={`text-lg font-black ${limitInfo.limit_reached ? 'text-red-500' : 'text-blue-600'}`}>{limitInfo.active_count}/{limitInfo.post_limit}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">{limitInfo.account_type}</span>
              </div>
            </div>
          )}
        </div>

        {/* Limit reached upsell — shown up front, before any data entry */}
        {!adminMode && limitInfo?.limit_reached && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row items-start gap-6 mb-8 animate-in slide-in-from-top-4 duration-500">
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
                <Link to="/profile?tab=ads" className="px-8 py-3 bg-white border-2 border-red-200 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2.5 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                  Manage My Ads
                </Link>
                <a href="https://t.me/Sion_Sak" target="_blank" rel="noreferrer" className="px-8 py-3 bg-[#0088cc] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0077b5] transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.14-.26.26-.543.26l.195-2.98 5.414-4.89c.235-.213-.054-.333-.37-.14l-6.685 4.21-2.888-.905c-.628-.196-.64-.628.13-.93l11.28-4.35c.52-.196.97.12.766 1.05z"/></svg>
                  Become a Store Member
                </a>
              </div>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-500 px-6 py-4 rounded-xl text-sm font-bold mb-6">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* ================= STEP 1: CATEGORY ================= */}
          {step === 1 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="font-semibold text-lg mt-6 mb-4">{t('common.categories')}</h2>

              <div id="field-category_id" tabIndex={-1} className={`grid grid-cols-1 md:grid-cols-2 border rounded-lg overflow-hidden h-[560px] md:h-[600px] ${errors.category_id ? 'border-red-300' : 'border-gray-200 dark:border-gray-800'}`}>
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
                              <SmartImage src={cat.image_url} alt={cat.name} width={80} height={80} widths={[80, 160]} sizes="40px" className="w-10 h-10 object-contain" />
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
                    ) : subCategories.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                        <p className="text-gray-400 dark:text-gray-600 text-xs font-bold uppercase tracking-widest">{selectedMainCat.name}</p>
                        <button type="button" onClick={() => handleSelectMainCat(selectedMainCat)} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition">
                          {t('create_product.continue', { defaultValue: 'Continue' })}
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50 dark:divide-gray-800/50 animate-in slide-in-from-right-4 duration-300">
                        {subCategories.map(sub => (
                          <li key={sub.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectSubCat(sub)}
                              className="w-full group flex gap-4 items-center py-3 px-6 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all text-left"
                            >
                              {sub.image_url ? (
                                <SmartImage src={sub.image_url} alt={sub.name} width={64} height={64} widths={[64, 128]} sizes="32px" className="w-8 h-8 object-contain" />
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
              {errors.category_id && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.category_id}</p>}
            </div>
          )}

          {/* ================= STEP 2: DETAILS ================= */}
          {step === 2 && (
            <div className="animate-in fade-in duration-500 space-y-12">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep(1)} className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 uppercase tracking-widest">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
                  {t('create_product.change_category')}
                </button>
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-900/30">
                  {selectedMainCat?.name} {'>'} {selectedCategory?.name}
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-6">
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
                  {t('create_product.ad_photos')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {existingImages.map((img, idx) => (
                    <div key={`exist-${img.id}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group shadow-sm">
                      {previews.length === 0 && idx === 0 && (
                        <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow">Cover</span>
                      )}
                      <SmartImage src={img.image_url} alt="" width={160} height={160} widths={[160, 320]} sizes="25vw" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingImage(img.id)} aria-label="Remove photo" className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  {previews.map((src, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 group shadow-sm">
                      {existingImages.length === 0 && idx === 0 && (
                        <span className="absolute top-2 left-2 z-10 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow">Cover</span>
                      )}
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(idx)} aria-label="Remove photo" className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                  {images.length + existingImages.length < 10 && (
                    <label id="field-images" tabIndex={-1} className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all bg-gray-50/50 dark:bg-gray-800/50 ${errors.images ? 'border-red-300 bg-red-50/30 text-red-400' : 'border-gray-200 dark:border-gray-800 text-gray-400 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400'}`}>
                      <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4"/></svg>
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('create_product.add_photo')}</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
                {errors.images && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.images}</p>}
              </div>

              {/* Basic info */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {t('create_product.basic_info')}
                </h2>
                <div className="space-y-8">
                  <div>
                    <label htmlFor="field-title" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.ad_title')} <span className="text-red-500">*</span></label>
                    <input
                      id="field-title"
                      type="text"
                      placeholder={t('create_product.ad_title_placeholder', { defaultValue: 'e.g. iPhone 15 Pro Max 256GB Gold' })}
                      value={formData.title}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, title: e.target.value }));
                        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
                      }}
                      className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.title ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    />
                    {errors.title && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="field-price" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.price')} ($) <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-lg ${errors.price ? 'text-red-300' : 'text-gray-400'}`}>$</span>
                        <input
                          id="field-price"
                          type="number"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={e => {
                            setFormData(prev => ({ ...prev, price: e.target.value }));
                            if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                          }}
                          className={`w-full pl-12 pr-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-black text-gray-800 dark:text-gray-100 text-lg shadow-sm bg-white dark:bg-[#08060d] ${errors.price ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        />
                      </div>
                      {errors.price && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.price}</p>}
                    </div>

                    <div>
                      <label htmlFor="field-discount_price" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.discount_price', { defaultValue: 'Discount Price (Optional)' })} ($)</label>
                      <div className="relative">
                        <span className={`absolute left-6 top-1/2 -translate-y-1/2 font-black text-lg ${errors.discount_price ? 'text-red-300' : 'text-gray-400'}`}>$</span>
                        <input
                          id="field-discount_price"
                          type="number"
                          placeholder={t('create_product.discount_price_placeholder', { defaultValue: 'Enter a lower price for sale' })}
                          value={formData.discount_price}
                          onChange={e => {
                            setFormData(prev => ({ ...prev, discount_price: e.target.value }));
                            if (errors.discount_price) setErrors(prev => ({ ...prev, discount_price: '' }));
                          }}
                          className={`w-full pl-12 pr-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-black text-gray-800 dark:text-gray-100 text-lg shadow-sm bg-white dark:bg-[#08060d] ${errors.discount_price ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        />
                      </div>
                      {errors.discount_price && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.discount_price}</p>}
                    </div>
                  </div>

                  <div id="field-description" tabIndex={-1}>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.description')} <span className="text-red-500">*</span></label>
                    <div className={`border rounded-2xl overflow-hidden shadow-sm ${errors.description ? 'border-red-300' : 'border-gray-200 dark:border-gray-800'}`}>
                      <Editor
                        ref={editorRef}
                        initialValue={initialDescription}
                        placeholder={t('create_product.description_placeholder', { defaultValue: 'Tell buyers about your item (specs, warranty, features...)' })}
                        previewStyle="vertical"
                        height="400px"
                        initialEditType="wysiwyg"
                        useCommandShortcut={true}
                        onChange={() => {
                          const instance = editorRef.current?.getInstance();
                          if (!instance) return;
                          setDescription(instance.getMarkdown());
                          setDescriptionHtml(instance.getHTML());
                        }}
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

              {/* Specifications */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {t('create_product.specifications')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20">
                  <div id="field-condition" tabIndex={-1}>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.condition')} <span className="text-red-500">*</span></label>
                    <div className={`flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl gap-1 border transition-colors ${errors.condition ? 'border-red-300' : 'border-transparent'}`} role="radiogroup" aria-label={t('create_product.condition')}>
                      {['New', 'Used'].map(c => (
                        <button
                          key={c}
                          type="button"
                          role="radio"
                          aria-checked={formData.condition === c.toLowerCase()}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, condition: c.toLowerCase() }));
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
                    <div key={attr.id} id={`field-attr_${attr.id}`} tabIndex={-1}>
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
            </div>
          )}

          {/* ================= STEP 3: LOCATION & CONTACT ================= */}
          {step === 3 && (
            <div className="animate-in fade-in duration-500 space-y-12">
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {t('create_product.location_section')}
                </h2>
                <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20">
                  <div>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.select_location')} <span className="text-red-500">*</span></label>
                    <button
                      id="field-province_id"
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
                        setFormData(prev => ({
                          ...prev,
                          province_id: data.province_id,
                          district_id: data.district_id,
                          commune_id: data.commune_id,
                          village_id: data.village_id,
                        }));
                        if (errors.province_id || errors.district_id) {
                          setErrors(prev => ({ ...prev, province_id: '', district_id: '' }));
                        }
                      }}
                    />
                  </div>

                  <div>
                    <label htmlFor="field-address" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.detail_address')} <span className="text-red-500">*</span></label>
                    <input
                      id="field-address"
                      type="text"
                      placeholder={t('create_product.detail_address_placeholder', { defaultValue: 'House number, Street name, or Landmarks...' })}
                      value={formData.address}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, address: e.target.value }));
                        if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                      }}
                      className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.address ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    />
                    {errors.address && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.address}</p>}
                  </div>

                  <div id="field-lat" tabIndex={-1}>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.location_on_map')} <span className="text-red-500">*</span></label>
                    <div
                      onClick={() => setIsMapModalOpen(true)}
                      className={`w-full h-48 bg-gray-50 dark:bg-gray-800 border rounded-2xl overflow-hidden relative group transition-all shadow-sm cursor-pointer ${errors.lat ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-400'}`}
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
                    </div>
                    {errors.lat && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.lat}</p>}
                    <MapPickerModal
                      isOpen={isMapModalOpen}
                      onClose={() => setIsMapModalOpen(false)}
                      lat={formData.lat}
                      lng={formData.lng}
                      onSelect={(lat, lng) => {
                        setFormData(prev => ({ ...prev, lat, lng }));
                        if (errors.lat) setErrors(prev => ({ ...prev, lat: '' }));
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {t('create_product.contact_details')}
                </h2>
                <div className="p-4 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/30 dark:bg-gray-800/20 space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="field-poster_name" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.poster_name')} <span className="text-red-500">*</span></label>
                      <input
                        id="field-poster_name"
                        type="text"
                        placeholder={t('create_product.poster_name_placeholder', { defaultValue: 'Enter your name' })}
                        value={formData.poster_name}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, poster_name: e.target.value }));
                          if (errors.poster_name) setErrors(prev => ({ ...prev, poster_name: '' }));
                        }}
                        className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.poster_name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                      />
                      {errors.poster_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.poster_name}</p>}
                    </div>
                    <div>
                      <label htmlFor="field-poster_email" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.email')} <span className="text-red-500">*</span></label>
                      <input
                        id="field-poster_email"
                        type="email"
                        placeholder="email@example.com"
                        value={formData.poster_email}
                        onChange={e => {
                          setFormData(prev => ({ ...prev, poster_email: e.target.value }));
                          if (errors.poster_email) setErrors(prev => ({ ...prev, poster_email: '' }));
                        }}
                        className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.poster_email ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                      />
                      {errors.poster_email && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.poster_email}</p>}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3 ml-1">
                      <label htmlFor="field-phone" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('create_product.phone_numbers')} (Max 3) <span className="text-red-500">*</span></label>
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
                            <input
                              id={idx === 0 ? 'field-phone' : undefined}
                              type="tel"
                              placeholder="012 345 678"
                              value={phone}
                              onChange={e => handlePhoneValueChange(idx, e.target.value)}
                              className={`w-full pl-16 pr-4 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${idx === 0 && errors.phone ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                            />
                          </div>
                          {phones.length > 1 && (
                            <button type="button" onClick={() => removePhoneField(idx)} aria-label="Remove phone" className="p-4 text-gray-400 hover:text-red-500 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.phone && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor="field-company_name" className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase mb-3 tracking-widest ml-1">{t('create_product.company_name')} <span className="text-red-500">*</span></label>
                    <input
                      id="field-company_name"
                      type="text"
                      placeholder={t('create_product.company_name_placeholder', { defaultValue: 'Enter company name if applicable' })}
                      value={formData.company_name}
                      onChange={e => {
                        setFormData(prev => ({ ...prev, company_name: e.target.value }));
                        if (errors.company_name) setErrors(prev => ({ ...prev, company_name: '' }));
                      }}
                      className={`w-full px-6 py-4 border rounded-2xl focus:bg-white dark:focus:bg-[#08060d] outline-none transition font-bold text-gray-800 dark:text-gray-200 shadow-sm bg-white dark:bg-[#08060d] ${errors.company_name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    />
                    {errors.company_name && <p className="text-red-500 text-[10px] font-bold mt-2 ml-1">{errors.company_name}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: REVIEW & POST ================= */}
          {step === 4 && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                {t('create_product.review', { defaultValue: 'Review Your Ad' })}
              </h2>

              {/* Preview card */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-[#08060d]">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 shrink-0">
                    {coverImage ? (
                      <img src={coverImage} alt="" className="w-full h-48 sm:h-full object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-widest">No photo</div>
                    )}
                  </div>
                  <div className="flex-1 p-5 sm:p-6 space-y-3">
                    <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                      {selectedMainCat?.name} {'>'} {selectedCategory?.name}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formData.title || '—'}</h3>
                    <div className="flex items-baseline gap-3">
                      {formData.discount_price ? (
                        <>
                          <span className="text-2xl font-black text-blue-600 dark:text-blue-400">${Number(formData.discount_price).toLocaleString()}</span>
                          <span className="text-sm text-gray-400 line-through">${Number(formData.price || 0).toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-gray-900 dark:text-gray-100">${Number(formData.price || 0).toLocaleString()}</span>
                      )}
                      {formData.condition && (
                        <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{formData.condition}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                      <div>
                        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{t('create_product.location_section')}</div>
                        <div className="font-bold text-gray-700 dark:text-gray-300">{locationString || '—'}{formData.address ? `, ${formData.address}` : ''}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-0.5">{t('create_product.contact_details')}</div>
                        <div className="font-bold text-gray-700 dark:text-gray-300">{formData.poster_name} · {formData.poster_email}</div>
                        <div className="font-bold text-gray-700 dark:text-gray-300">{phones.filter(p => p.trim()).join(', ')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description preview */}
                {descriptionHtml && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-5 sm:p-6">
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('create_product.description')}</div>
                    <div className="prose prose-sm max-w-none dark:prose-invert text-left" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                  </div>
                )}

                {/* Extra photos */}
                {totalPhotos > 1 && (
                  <div className="border-t border-gray-100 dark:border-gray-800 p-5 sm:p-6">
                    <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{t('create_product.ad_photos')} ({totalPhotos})</div>
                    <div className="flex flex-wrap gap-2">
                      {galleryImages.map((src, i) => (
                        <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-800" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div id="field-terms" tabIndex={-1} className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <input
                    id="field-terms-checkbox"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.terms) setErrors(prev => ({ ...prev, terms: '' }));
                    }}
                    className={`mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 ${errors.terms ? 'border-red-300' : 'border-gray-300 dark:border-gray-700'}`}
                  />
                  <label htmlFor="field-terms-checkbox" className={`text-[11px] leading-relaxed font-bold uppercase tracking-tight cursor-pointer ${errors.terms ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t('create_product.agree_terms')}
                  </label>
                </div>
                {errors.terms && <p className="text-red-500 text-[10px] font-bold ml-7">{errors.terms}</p>}
              </div>
            </div>
          )}

          {/* Sticky wizard footer */}
          <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 mt-10 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#16171d]/95 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 1}
              className="px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
              {t('create_product.back', { defaultValue: 'Back' })}
            </button>

            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-600">
              {step} / {TOTAL_STEPS}
            </div>

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!adminMode && limitInfo?.limit_reached}
                className="px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {t('create_product.next', { defaultValue: 'Next' })}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || (!adminMode && limitInfo?.limit_reached)}
                className="px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-blue-600 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? t('create_product.processing') : (!adminMode && limitInfo?.limit_reached) ? t('create_product.limit_reached') : t('create_product.post_now')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

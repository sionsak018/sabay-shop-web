import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

interface LocationPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (data: { province_id: string; district_id: string; commune_id: string; village_id: string; locationName: string }) => void;
    initialData?: { province_id: string; district_id: string; commune_id: string; village_id: string };
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onSelect, initialData }) => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1); // 1: Province, 2: District, 3: Commune, 4: Village
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [communes, setCommunes] = useState<any[]>([]);
    const [villages, setVillages] = useState<any[]>([]);

    const [selectedProvince, setSelectedProvince] = useState<any>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
    const [selectedCommune, setSelectedCommune] = useState<any>(null);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProvinces();
            // Reset to step 1 when opening unless we want to support editing
            setStep(1);
            setSelectedProvince(null);
            setSelectedDistrict(null);
            setSelectedCommune(null);
        }
    }, [isOpen]);

    const fetchProvinces = async () => {
        setLoading(true);
        try {
            const res = await api.get('/provinces');
            setProvinces(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProvince = async (p: any) => {
        setSelectedProvince(p);
        setLoading(true);
        try {
            const res = await api.get(`/districts?province_id=${p.id}`);
            setDistricts(Array.isArray(res.data) ? res.data : res.data.data || []);
            setStep(2);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectDistrict = async (d: any) => {
        setSelectedDistrict(d);
        setLoading(true);
        try {
            const res = await api.get(`/communes?district_id=${d.id}`);
            setCommunes(Array.isArray(res.data) ? res.data : res.data.data || []);
            setStep(3);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCommune = async (c: any) => {
        setSelectedCommune(c);
        setLoading(true);
        try {
            const res = await api.get(`/villages?commune_id=${c.id}`);
            const data = Array.isArray(res.data) ? res.data : res.data.data || [];
            if (data.length === 0) {
                // No villages, finish here
                completeSelection(c, null);
            } else {
                setVillages(data);
                setStep(4);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectVillage = (v: any) => {
        completeSelection(selectedCommune, v);
    };

    const completeSelection = (commune: any, village: any | null) => {
        const parts = [
            village?.name,
            commune.name,
            selectedDistrict.name,
            selectedProvince.name
        ].filter(Boolean);

        onSelect({
            province_id: String(selectedProvince.id),
            district_id: String(selectedDistrict.id),
            commune_id: String(commune.id),
            village_id: village ? String(village.id) : '',
            locationName: parts.join(', ')
        });
        onClose();
    };

    const handleClear = () => {
        setStep(1);
        setSelectedProvince(null);
        setSelectedDistrict(null);
        setSelectedCommune(null);
        onSelect({ province_id: '', district_id: '', commune_id: '', village_id: '', locationName: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="flex flex-col p-0 w-full max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="shrink-0">
                    <div className="w-full p-4 flex justify-between items-center gap-2 border-b border-gray-100 bg-white">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>

                        <div className="flex-1 min-w-0 flex justify-center px-1">
                            <div className="text-sm w-full flex justify-center overflow-x-auto no-scrollbar">
                                <ul className="flex items-center gap-2 whitespace-nowrap">
                                    <li className="flex items-center gap-2">
                                        <button
                                            onClick={() => setStep(1)}
                                            className={`text-sm font-bold uppercase tracking-tight ${step === 1 ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {t('create_product.select_location')}
                                        </button>
                                    </li>
                                    {selectedProvince && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                            <button
                                                onClick={() => setStep(2)}
                                                className={`text-sm font-bold uppercase tracking-tight ${step === 2 ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {selectedProvince.name}
                                            </button>
                                        </li>
                                    )}
                                    {selectedDistrict && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                            <button
                                                onClick={() => setStep(3)}
                                                className={`text-sm font-bold uppercase tracking-tight ${step === 3 ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                {selectedDistrict.name}
                                            </button>
                                        </li>
                                    )}
                                    {selectedCommune && (
                                        <li className="flex items-center gap-2">
                                            <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                            <button
                                                className="text-sm font-bold uppercase tracking-tight text-blue-600"
                                            >
                                                {selectedCommune.name}
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        <button
                            onClick={handleClear}
                            className="px-4 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full text-xs font-black uppercase tracking-widest transition-colors shrink-0"
                        >
                            {t('common.clear_filters')}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="grow overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('create_product.processing')}</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {step === 1 && (
                                <li
                                    onClick={handleClear}
                                    className="flex items-center justify-between px-6 py-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                                >
                                    <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{t('common.all_cambodia')}</span>
                                    <svg className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                </li>
                            )}
                            {step === 1 && provinces.map(p => (
                                <li key={p.id} onClick={() => handleSelectProvince(p)} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">{p.name}</span>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                </li>
                            ))}
                            {step === 2 && districts.map(d => (
                                <li key={d.id} onClick={() => handleSelectDistrict(d)} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">{d.name}</span>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                </li>
                            ))}
                            {step === 3 && communes.map(c => (
                                <li key={c.id} onClick={() => handleSelectCommune(c)} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">{c.name}</span>
                                    <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                </li>
                            ))}
                            {step === 4 && villages.map(v => (
                                <li key={v.id} onClick={() => handleSelectVillage(v)} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600">{v.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                                        <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"/></svg>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

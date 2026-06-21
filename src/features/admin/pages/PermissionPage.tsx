import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTranslation } from 'react-i18next';

export const PermissionPage = () => {
    const { t } = useTranslation();
    const [permissions, setPermissions] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        group: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/permissions');
            setPermissions(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (permission: any = null) => {
        setErrors({});
        if (permission) {
            setEditingPermission(permission);
            setFormData({
                name: permission.name,
                display_name: permission.display_name,
                group: permission.group
            });
        } else {
            setEditingPermission(null);
            setFormData({ name: '', display_name: '', group: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const newErrors: Record<string, string> = {};
        const Msg = t('validation.required');

        if (!formData.name.trim()) newErrors.name = Msg;
        if (!formData.display_name.trim()) newErrors.display_name = Msg;
        if (!formData.group.trim()) newErrors.group = Msg;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            if (editingPermission) {
                await api.put(`/admin/permissions/${editingPermission.id}`, formData);
            } else {
                await api.post('/admin/permissions', formData);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (err: any) {
            if (err.response?.status === 422) {
                const backendErrors = err.response.data.errors;
                const formattedErrors: Record<string, string> = {};
                Object.keys(backendErrors).forEach(key => {
                    formattedErrors[key] = backendErrors[key][0];
                });
                setErrors(formattedErrors);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.are_you_sure'))) {
            try {
                await api.delete(`/admin/permissions/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400 font-bold uppercase animate-pulse">Loading Permissions...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{t('admin.system_permissions')}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('admin.manage_permissions_desc')}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 uppercase"
                >
                    {t('admin.create_permission')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(permissions).map(([group, groupPerms]: [string, any]) => (
                    <div key={group} className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-widest">{group}</h2>
                            <span className="text-[10px] font-black bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">{groupPerms.length}</span>
                        </div>
                        <div className="p-4 flex-1 space-y-4">
                            {groupPerms.map((perm: any) => (
                                <div key={perm.id} className="flex items-center justify-between group/item">
                                    <div className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                                        <div>
                                            <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{perm.display_name}</div>
                                            <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-tighter">{perm.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(perm)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                        </button>
                                        <button onClick={() => handleDelete(perm.id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#16171d] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{editingPermission ? t('admin.edit_permission') : t('admin.create_permission')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.internal_name')}</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => {
                                        setFormData({ ...formData, name: e.target.value });
                                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100 font-bold`}
                                    placeholder="e.g. view_reports"
                                />
                                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.display_name')}</label>
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={e => {
                                        setFormData({ ...formData, display_name: e.target.value });
                                        if (errors.display_name) setErrors(prev => ({ ...prev, display_name: '' }));
                                    }}
                                    className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.display_name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100 font-bold`}
                                    placeholder="e.g. View Reports"
                                />
                                {errors.display_name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.display_name}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.group')}</label>
                                <input
                                    type="text"
                                    value={formData.group}
                                    onChange={e => {
                                        setFormData({ ...formData, group: e.target.value });
                                        if (errors.group) setErrors(prev => ({ ...prev, group: '' }));
                                    }}
                                    className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.group ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100 font-bold`}
                                    placeholder="e.g. Reports Management"
                                />
                                {errors.group && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.group}</p>}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors uppercase"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 uppercase"
                                >
                                    {editingPermission ? t('common.update') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

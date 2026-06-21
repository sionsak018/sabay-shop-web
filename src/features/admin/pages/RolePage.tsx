import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useTranslation } from 'react-i18next';

export const RolePage = () => {
    const { t } = useTranslation();
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
        permissions: [] as number[]
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/admin/roles'),
                api.get('/admin/permissions')
            ]);
            setRoles(rolesRes.data);
            setPermissions(permsRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (role: any = null) => {
        setErrors({});
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name,
                display_name: role.display_name,
                description: role.description || '',
                permissions: role.permissions.map((p: any) => p.id)
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', display_name: '', description: '', permissions: [] });
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

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            if (editingRole) {
                await api.put(`/admin/roles/${editingRole.id}`, formData);
            } else {
                await api.post('/admin/roles', formData);
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
                await api.delete(`/admin/roles/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const togglePermission = (id: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(pId => pId !== id)
                : [...prev.permissions, id]
        }));
    };

    if (loading) return <div className="p-12 text-center text-gray-400 font-bold uppercase animate-pulse">{t('admin.loading_roles')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-tight">{t('admin.role_management')}</h1>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 uppercase"
                >
                    {t('admin.create_role')}
                </button>
            </div>

            <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.roles')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.description')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.permissions')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">{t('admin.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {roles.map(role => (
                            <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-800 dark:text-gray-100">{role.display_name}</div>
                                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase">{role.name}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{role.description}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase">
                                        {t('admin.permissions_count', { count: role.permissions.length })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(role)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                                        </button>
                                        {role.name !== 'admin' && (
                                            <button onClick={() => handleDelete(role.id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#16171d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 uppercase">{editingRole ? t('admin.edit_role') : t('admin.create_role')}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.internal_name')}</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        disabled={editingRole?.name === 'admin'}
                                        className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100`}
                                        placeholder="e.g. manager"
                                    />
                                    {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.display_name')}</label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                        className={`w-full bg-gray-50 dark:bg-gray-800/50 border ${errors.display_name ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100`}
                                        placeholder="e.g. Manager"
                                    />
                                    {errors.display_name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.display_name}</p>}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.description')}</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-100 h-20 resize-none"
                                    placeholder="Brief description of the role..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('admin.permissions')}</label>
                                {Object.entries(permissions).map(([group, groupPerms]: [string, any]) => (
                                    <div key={group} className="space-y-2">
                                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase border-b border-gray-100 dark:border-gray-800 pb-1">{group}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {groupPerms.map((perm: any) => (
                                                <label key={perm.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.permissions.includes(perm.id)}
                                                        onChange={() => togglePermission(perm.id)}
                                                        disabled={editingRole?.name === 'admin'}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{perm.display_name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors uppercase"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 uppercase"
                                >
                                    {editingRole ? t('admin.update_role') : t('admin.create_role')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { AdminPagination } from '../components/AdminPagination';
import { useAlert } from '../../../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../../hooks/useDebounce';

export const UserPage = () => {
  const { t } = useTranslation();
  const { showAlert } = useAlert();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    phone: '',
    account_type: 'private',
    post_limit: 5,
    roles: [] as number[]
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const [userRes, rolesRes] = await Promise.all([
        api.get(`/admin/users?page=${page}&search=${search}`),
        api.get('/admin/roles')
      ]);
      setUsers(userRes.data.data);
      setRoles(rolesRes.data);
      setPagination({
        currentPage: userRes.data.current_page,
        lastPage: userRes.data.last_page,
        total: userRes.data.total
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, debouncedSearch);
  }, [debouncedSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchData(page, searchTerm);
  };

  const handleOpenModal = (user: any = null) => {
    setErrors({});
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        phone: user.phone || '',
        account_type: user.account_type || 'private',
        post_limit: user.post_limit || 5,
        roles: user.roles ? user.roles.map((r: any) => Number(r.id)) : []
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        account_type: 'private',
        post_limit: 5,
        roles: []
      });
    }
    setIsModalOpen(true);
  };

  const toggleRole = (roleId: number) => {
      const id = Number(roleId);
      setFormData(prev => ({
          ...prev,
          roles: prev.roles.includes(id)
            ? prev.roles.filter(rid => rid !== id)
            : [...prev.roles, id]
      }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const Msg = t('validation.required');

    if (!formData.name.trim()) newErrors.name = Msg;
    if (!editingUser && !formData.email.trim()) newErrors.email = Msg;
    if (!editingUser && !formData.password.trim()) newErrors.password = Msg;
    if (!formData.role) newErrors.role = Msg;

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, formData);
        showAlert({ title: 'Success!', message: 'User updated successfully.', type: 'success' });
      } else {
        await api.post('/admin/users', formData);
        showAlert({ title: 'Success!', message: 'User created successfully.', type: 'success' });
      }
      setIsModalOpen(false);
      fetchData(pagination.currentPage, searchTerm);
    } catch (error: any) {
      if (error.response?.status === 422) {
          const backendErrors = error.response.data.errors;
          const formattedErrors: Record<string, string> = {};
          Object.keys(backendErrors).forEach(key => {
              formattedErrors[key] = backendErrors[key][0];
          });
          setErrors(formattedErrors);
          return;
      }
      const message = error.response?.data?.message || 'Failed to save user.';
      showAlert({ title: 'Error!', message, type: 'error' });
    }
  };

  const handleDelete = (id: number) => {
    showAlert({
      title: 'Are you sure?',
      message: 'Delete this user?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${id}`);
          showAlert({ title: 'Deleted!', message: 'User removed.', type: 'success' });
          fetchData(pagination.currentPage, searchTerm);
        } catch (error) {
          showAlert({ title: 'Error!', message: 'Failed to delete user.', type: 'error' });
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">{t('admin.user_management')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">{t('admin.found_users', { count: pagination.total })}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
                onClick={() => handleOpenModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-blue-600/20 uppercase"
            >
                {t('admin.create_user')}
            </button>
            <form onSubmit={handleSearch} className="relative group w-full sm:w-64">
                <input
                    type="text"
                    placeholder={t('admin.search_placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white dark:bg-[#16171d] border border-gray-200 dark:border-gray-800 px-10 py-2 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all w-full shadow-sm dark:text-gray-200"
                />
                <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </form>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16171d] rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <tr>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.user_details')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.type_roles')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{t('admin.phone')}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">{t('admin.actions')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 font-bold uppercase animate-pulse">{t('admin.loading_users')}</td></tr>
                ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="text-sm font-black text-gray-800 dark:text-gray-200">{u.name}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap gap-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tight border ${u.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                                    {u.role}
                                </span>
                                {u.roles?.map((r: any) => (
                                    <span key={r.id} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                        {r.display_name}
                                    </span>
                                ))}
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-0.5">{u.account_type || 'private'} ({u.post_limit})</span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-gray-400">{u.phone || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                        <button onClick={() => handleOpenModal(u)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.364a2.121 2.121 0 013 3L12 18l-4 1 1-4 9.364-9.364z"/></svg></button>
                        <button onClick={() => handleDelete(u.id)} className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        <AdminPagination
            currentPage={pagination.currentPage}
            lastPage={pagination.lastPage}
            total={pagination.total}
            onPageChange={handlePageChange}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1c1c1d] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border dark:border-gray-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b dark:border-gray-800 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 uppercase tracking-widest">{editingUser ? t('admin.edit_user') : t('admin.create_user')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Name <span className="text-red-500">*</span></label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.name ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                />
                {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.name}</p>}
              </div>

              {!editingUser && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Email <span className="text-red-500">*</span></label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData({ ...formData, email: e.target.value });
                                if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.email ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        />
                        {errors.email && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Password <span className="text-red-500">*</span></label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => {
                                setFormData({ ...formData, password: e.target.value });
                                if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                            }}
                            className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none transition-all bg-white dark:bg-[#08060d] dark:text-gray-200 ${errors.password ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                        />
                        {errors.password && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.password}</p>}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Primary Role <span className="text-red-500">*</span></label>
                    <select
                        value={formData.role}
                        onChange={(e) => {
                            setFormData({ ...formData, role: e.target.value });
                            if (errors.role) setErrors(prev => ({ ...prev, role: '' }));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200 transition-all ${errors.role ? 'border-red-300' : 'border-gray-200 dark:border-gray-800 focus:border-blue-500 dark:focus:border-blue-400'}`}
                    >
                        <option value="">Select Role</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="text-red-500 text-[10px] font-bold mt-1 ml-1">{errors.role}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Phone</label>
                    <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-bold outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-[#08060d] dark:text-gray-200"
                    />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2">Assign System Roles</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-100 dark:border-gray-800 rounded-lg">
                      {roles.map(role => (
                          <label key={role.id} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.roles.includes(Number(role.id))}
                                onChange={() => toggleRole(role.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">{role.display_name}</span>
                          </label>
                      ))}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Account Type</label>
                    <select value={formData.account_type} onChange={(e) => setFormData({ ...formData, account_type: e.target.value })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200">
                        <option value="private">Private</option>
                        <option value="verified">Verified</option>
                        <option value="store">Store</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-1">Ad Limit</label>
                    <input type="number" value={formData.post_limit} onChange={(e) => setFormData({ ...formData, post_limit: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-bold outline-none bg-white dark:bg-[#08060d] dark:text-gray-200" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg font-bold text-sm">{t('common.cancel')}</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-600/20">{editingUser ? t('admin.update_user') : t('admin.create_user')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

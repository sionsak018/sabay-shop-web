import React from 'react';
import { useLocation } from 'react-router-dom';

export const AdminPlaceholder = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/').pop()?.replace(/^\w/, (c) => c.toUpperCase()) || 'Page';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{pageName} Management</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition active:scale-95 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          Add New {pageName.slice(0, -1)}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          </div>
          <p className="text-gray-500 font-medium">This is a placeholder for the {pageName} management page.</p>
          <p className="text-gray-400 text-sm mt-1">Data table and CRUD operations will be implemented here.</p>
        </div>
      </div>
    </div>
  );
};

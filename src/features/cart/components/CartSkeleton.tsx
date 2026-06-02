import React from 'react';

export const CartSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 antialiased text-left font-sans animate-pulse">
      <div className="flex items-center justify-between mb-10">
        <div>
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-32" />
        </div>
        <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded w-20" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-6 bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
            <div className="w-full sm:w-32 h-32 rounded-xl bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2" />
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div className="h-10 bg-gray-100 dark:bg-gray-900 rounded-xl w-28" />
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-16" />
              </div>
            </div>
            <div className="sm:text-right flex flex-col justify-between items-end">
              <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-16 mb-2" />
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
            <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-32 mb-2 mx-auto md:mx-0" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-56" />
        </div>
        <div className="w-full md:w-auto min-w-[280px] h-16 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    </div>
  );
};

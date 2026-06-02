import React from 'react';

interface ProductSkeletonProps {
  variant?: 'grid' | 'list';
}

export const ProductSkeleton = ({ variant = 'grid' }: ProductSkeletonProps) => {
  if (variant === 'list') {
    return (
      <div className="bg-white dark:bg-[#1f2028] border border-gray-100 dark:border-gray-800 rounded-lg p-2 sm:p-3 flex gap-3 sm:gap-4 animate-pulse">
        <div className="w-32 sm:w-48 aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-md shrink-0" />
        <div className="flex flex-col flex-grow py-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mt-2" />
          <div className="mt-auto flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-2">
            <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded w-1/6" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1f2028] border border-gray-200 dark:border-gray-800 rounded sm:rounded-md overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800" />
      <div className="p-1.5 sm:p-2.5 flex flex-col flex-grow space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
        <div className="mt-auto">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
          <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between">
            <div className="h-2 bg-gray-100 dark:bg-gray-800/50 rounded w-1/2" />
            <div className="h-2 bg-gray-100 dark:bg-gray-800/50 rounded w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
};

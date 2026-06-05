import React from 'react';

interface PaginationProps {
    currentPage: number;
    lastPage: number;
    total: number;
    onPageChange: (page: number) => void;
}

export const AdminPagination: React.FC<PaginationProps> = ({ currentPage, lastPage, total, onPageChange }) => {
    if (lastPage <= 1) return null;

    return (
        <div className="bg-white dark:bg-[#16171d] px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    Previous
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-gray-700 dark:text-gray-400 font-bold uppercase tracking-tight">
                        Total <span className="font-black text-blue-600 dark:text-blue-400">{total}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                        </button>

                        {[...Array(lastPage)].map((_, i) => {
                            const page = i + 1;
                            // Show first, last, and pages around current
                            if (page === 1 || page === lastPage || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-black transition-all ${
                                            currentPage === page
                                                ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-lg'
                                                : 'bg-white dark:bg-[#1f2028] border-gray-300 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            if (page === 2 || page === lastPage - 1) {
                                return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-800 bg-white dark:bg-[#16171d] text-sm font-medium text-gray-700 dark:text-gray-500">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

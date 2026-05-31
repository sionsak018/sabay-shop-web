import { createContext, useContext, useEffect, useState } from 'react';
import { categoryApi } from '../services/categoryApi';
import {type Category } from '../types/category.types';

const CategoryContext = createContext<{ categories: Category[]; loading: boolean }>({ categories: [], loading: true });

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll().then(res => setCategories(res.data)).finally(() => setLoading(false));
  }, []);

  return <CategoryContext.Provider value={{ categories, loading }}>{children}</CategoryContext.Provider>;
};

export const useCategories = () => useContext(CategoryContext);
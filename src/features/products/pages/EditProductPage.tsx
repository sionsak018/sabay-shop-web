import { useParams } from 'react-router-dom';
import { CreateProductPage } from './CreateProductPage';

export const EditProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const editId = Number(id);

  if (!id || Number.isNaN(editId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#08060d]">
        <p className="font-bold text-gray-400 uppercase tracking-widest text-xs">Invalid product</p>
      </div>
    );
  }

  return <CreateProductPage editId={editId} />;
};

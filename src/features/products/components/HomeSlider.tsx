import { useState, useEffect } from 'react';
import { sliderApi, type Slider } from '../../admin/services/sliderApi';
import { getImageUrl } from '../../../utils/imageUrl';

interface HomeSliderProps {
  initialData?: any[];
}

export const HomeSlider = ({ initialData }: HomeSliderProps) => {
  const [sliders, setSliders] = useState<Slider[]>(initialData || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
        setSliders(initialData);
        setLoading(false);
        return;
    }
    sliderApi.getPublic()
      .then(res => setSliders(res.data))
      .catch(err => console.error('Failed to load sliders', err))
      .finally(() => setLoading(false));
  }, [initialData]);

  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [sliders, currentIndex]);

  if (loading) {
    return (
      <div className="w-full aspect-[21/9] sm:aspect-[25/7] bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse mb-3" />
    );
  }

  if (sliders.length === 0) return null;

  return (
    <div className="relative w-full aspect-[21/9] sm:aspect-[25/7] overflow-hidden rounded-md shadow-sm bg-gray-200 dark:bg-gray-800 group mb-3">
      {sliders.map((slider, index) => (
        <a
          key={slider.id}
          href={slider.link_url || '#'}
          target={slider.link_url?.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img
            src={getImageUrl(slider.image_url)}
            alt={slider.title || 'Promo'}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://placehold.co/1200x400?text=Slider+Image+Not+Found';
            }}
          />
          {slider.title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
              <p className="text-white text-base sm:text-xl font-black uppercase tracking-tight truncate drop-shadow-md">{slider.title}</p>
            </div>
          )}
        </a>
      ))}

      {/* Dots */}
      {sliders.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {sliders.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-blue-600 w-5' : 'bg-white/60 dark:bg-white/20 shadow-sm'}`}
            />
          ))}
        </div>
      )}

      {/* Navigation Arrows */}
      {sliders.length > 1 && (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentIndex(prev => (prev === 0 ? sliders.length - 1 : prev - 1));
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/40"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setCurrentIndex(prev => (prev + 1) % sliders.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-black/40"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
            </button>
        </>
      )}
    </div>
  );
};

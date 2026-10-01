import { useEffect, useRef, useState } from 'react';

type LazyMapViewProps = {
  lat: string;
  lng: string;
};

/**
 * Defers loading leaflet (~240 kB plus its CSS and two marker PNGs) until the
 * map is about to scroll into view. On the product page the map sits at the
 * very bottom, so this keeps leaflet off the critical path entirely.
 *
 * The placeholder keeps the exact box the caller sized, so there is no layout
 * shift when the real map swaps in.
 */
export const LazyMapView = ({ lat, lng }: LazyMapViewProps) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [MapView, setMapView] = useState<null | React.ComponentType<LazyMapViewProps>>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (typeof IntersectionObserver === 'undefined') {
      // Very old browsers: just load it.
      import('./MapView').then(m => setMapView(() => m.MapView));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          observer.disconnect();
          import('./MapView').then(m => setMapView(() => m.MapView));
        }
      },
      // Start fetching a little before the map is actually needed.
      { rootMargin: '300px 0px' },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="w-full h-full">
      {MapView ? (
        <MapView lat={lat} lng={lng} />
      ) : (
        <div className="w-full h-full bg-gray-100 dark:bg-[#1c1c1d]" aria-hidden="true" />
      )}
    </div>
  );
};

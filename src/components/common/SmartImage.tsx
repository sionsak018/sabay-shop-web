import { useState, type HTMLAttributeReferrerPolicy } from 'react';
import {
  getSizedImageUrl,
  getImageSrcSet,
  getCroppedImageUrl,
} from '../../utils/imageUrl';

type SmartImageProps = {
  src: string | null | undefined;
  alt?: string;
  /** Intrinsic width, used to reserve space and avoid layout shift. */
  width?: number;
  /** Intrinsic height, used to reserve space and avoid layout shift. */
  height?: number;
  className?: string;
  /**
   * Above-the-fold images must not be lazy. Everything else defaults to lazy,
   * which was previously missing on every image in the app.
   */
  priority?: boolean;
  /** Aspect ratio to crop to, e.g. { width: 4, height: 3 }. */
  aspect?: { width: number; height: number };
  /** Candidate widths for srcset. Defaults to a thumbnail-friendly ladder. */
  widths?: number[];
  /** CSS sizes attribute; keeps phones from fetching desktop-sized assets. */
  sizes?: string;
  fallback?: string;
  onClick?: () => void;
  /** Needed for third-party logo hosts that block hotlinking. */
  referrerPolicy?: HTMLAttributeReferrerPolicy;
};

const DEFAULT_WIDTHS = [160, 320, 640, 960, 1280];

const SmartImage = ({
  src,
  alt = '',
  width,
  height,
  className,
  priority = false,
  aspect,
  widths = DEFAULT_WIDTHS,
  sizes,
  fallback,
  onClick,
  referrerPolicy,
}: SmartImageProps) => {
  const [errored, setErrored] = useState(false);

  const largestWidth = widths[widths.length - 1];

  // getCroppedImageUrl takes pixel dimensions, so turn the aspect ratio into a
  // height at the largest width we might request. Passing the ratio straight
  // through would ask Cloudinary for a 4x3 pixel image.
  const cropHeight = aspect
    ? Math.round(largestWidth / (aspect.width / aspect.height))
    : undefined;

  // Size the request to what will actually be painted. Cropping and plain
  // width reduction both do the same job for the client: fewer bytes.
  const url = aspect
    ? getCroppedImageUrl(errored ? null : src, largestWidth, cropHeight!, fallback)
    : getSizedImageUrl(errored ? null : src, largestWidth, fallback);

  const srcSet = aspect || errored
    ? ''
    : getImageSrcSet(src, widths, fallback);

  return (
    <img
      src={url}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes ?? `${largestWidth}px` : undefined}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      // fetchPriority is camelCase in React; high pulls this one out of the
      // lazy queue so above-the-fold images are not serialised behind others.
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      referrerPolicy={referrerPolicy}
      className={className}
      onClick={onClick}
      onError={() => setErrored(true)}
      style={
        aspect && !errored
          ? { aspectRatio: `${aspect.width} / ${aspect.height}` }
          : undefined
      }
    />
  );
};

export default SmartImage;
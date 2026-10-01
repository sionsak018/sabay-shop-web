const PLACEHOLDER = 'https://placehold.co/400x300?text=No+Image';

const isFullUrl = (path: string) =>
  path.startsWith('http://') || path.startsWith('https://');

const getBackendBaseUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  return apiBaseUrl.replace(/\/api$/, '');
};

/**
 * Cloudinary delivery URLs carry transformations between `/upload/` and the
 * version segment, e.g.
 *   .../image/upload/w_400,q_auto,f_auto/v1234567890/sabay-shop/photo.jpg
 *
 * Uploads are stored at up to 1200x1200, so serving those bytes for a list
 * thumbnail is wasteful. Injecting delivery parameters lets one stored asset
 * serve a 200px card and a 1200px hero.
 */
// Cloudinary delivery URLs carry transformations between `/upload/` and the
// version segment, e.g.
//   .../image/upload/w_400,q_auto,f_auto/v1234567890/sabay-shop/photo.jpg
//
// The cloud name is a path segment between the host and /image/upload/, e.g.
//   https://res.cloudinary.com/<cloud_name>/image/upload/...
// so allow any number of leading segments before it.
const CLOUDINARY_UPLOAD_PREFIX =
  /^(https?:\/\/[^/]+\/(?:[^/]+\/)*image\/upload\/)/;

const looksLikeCloudinary = (url: string) => CLOUDINARY_UPLOAD_PREFIX.test(url);

// The segment immediately after /image/upload/ begins with a transform key
// such as `w_400`, `h_300` or `c_fill` when a transformation is already
// present. A version segment (`v1758643200`) or a public_id does not match.
const TRANSFORM_KEY_AT_START = /^[a-z]+_/;

const hasDeliveryTransform = (url: string) => {
  const match = url.match(CLOUDINARY_UPLOAD_PREFIX);

  return match
    ? TRANSFORM_KEY_AT_START.test(url.slice(match[1].length))
    : false;
};

export const cloudinaryTransform = (
  url: string,
  params: string,
): string => {
  if (!looksLikeCloudinary(url) || hasDeliveryTransform(url)) {
    return url;
  }

  return url.replace(CLOUDINARY_UPLOAD_PREFIX, `$1${params}/`);
};

/**
 * Resolves a stored image path to an absolute URL, handling the three shapes
 * this app stores: full Cloudinary URLs, full localhost URLs written while
 * developing, and backend-relative storage paths.
 */
const resolve = (
  path: string | null | undefined,
  placeholder: string,
): string => {
  if (!path) return placeholder;

  // If it's already a full URL (like Cloudinary)
  if (isFullUrl(path)) {
    // If it's a local URL (contains localhost or 127.0.0.1),
    // we should ensure it uses the current backendBaseUrl to avoid host mismatch issues
    if (path.includes('localhost') || path.includes('127.0.0.1')) {
      try {
        // Replace everything up to the /storage part with our backendBaseUrl
        const storageIndex = path.indexOf('/storage/');
        if (storageIndex !== -1) {
          return `${getBackendBaseUrl()}${path.substring(storageIndex)}`;
        }
      } catch {
        return path;
      }
    }
    return path;
  }

  // Otherwise, prepend the backend storage URL
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // If the path already includes 'storage/', don't double prepend it
  if (cleanPath.startsWith('storage/')) {
    return `${getBackendBaseUrl()}/${cleanPath}`;
  }

  return `${getBackendBaseUrl()}/storage/${cleanPath}`;
};

export const getImageUrl = (
  path: string | null | undefined,
  placeholder = PLACEHOLDER,
) => resolve(path, placeholder);

/**
 * Same as getImageUrl, but asks Cloudinary for a right-sized variant. Falls
 * through untouched for non-Cloudinary URLs, which have no transform API.
 */
export const getSizedImageUrl = (
  path: string | null | undefined,
  width: number,
  placeholder = PLACEHOLDER,
) => cloudinaryTransform(resolve(path, placeholder), `w_${width},q_auto,f_auto`);

/**
 * Builds a srcset so the browser can pick an appropriate candidate and mobile
 * devices stop downloading desktop-sized assets.
 */
export const getImageSrcSet = (
  path: string | null | undefined,
  widths: number[],
  placeholder = PLACEHOLDER,
): string => {
  const url = resolve(path, placeholder);

  if (!looksLikeCloudinary(url)) {
    return '';
  }

  return widths
    .map((w) => `${cloudinaryTransform(url, `w_${w},q_auto,f_auto`)} ${w}w`)
    .join(', ');
};

/** Sized URL for a given width and height, cropping to fill. */
export const getCroppedImageUrl = (
  path: string | null | undefined,
  width: number,
  height: number,
  placeholder = PLACEHOLDER,
) =>
  cloudinaryTransform(
    resolve(path, placeholder),
    `w_${width},h_${height},c_fill,g_auto,q_auto,f_auto`,
  );
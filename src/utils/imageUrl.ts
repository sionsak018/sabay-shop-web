export const getImageUrl = (path: string | null | undefined, placeholder = 'https://placehold.co/400x300?text=No+Image') => {
  if (!path) return placeholder;

  // If it's already a full URL (like Cloudinary), return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, prepend the backend storage URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
  const baseUrl = apiBaseUrl.replace('/api', '');

  // Ensure no double slashes
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/storage/${cleanPath}`;
};

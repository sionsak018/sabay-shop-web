export const getImageUrl = (path: string | null | undefined, placeholder = 'https://placehold.co/400x300?text=No+Image') => {
  if (!path) return placeholder;

  // Use API URL to determine backend base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const backendBaseUrl = apiBaseUrl.replace(/\/api$/, '');

  // If it's already a full URL (like Cloudinary)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // If it's a local URL (contains localhost or 127.0.0.1),
    // we should ensure it uses the current backendBaseUrl to avoid host mismatch issues
    if (path.includes('localhost') || path.includes('127.0.0.1')) {
      try {
        const urlObj = new URL(path);
        // Replace everything up to the /storage part with our backendBaseUrl
        const storageIndex = path.indexOf('/storage/');
        if (storageIndex !== -1) {
          return `${backendBaseUrl}${path.substring(storageIndex)}`;
        }
      } catch (e) {
        return path;
      }
    }
    return path;
  }

  // Otherwise, prepend the backend storage URL
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;

  // If the path already includes 'storage/', don't double prepend it
  if (cleanPath.startsWith('storage/')) {
    return `${backendBaseUrl}/${cleanPath}`;
  }

  return `${backendBaseUrl}/storage/${cleanPath}`;
};

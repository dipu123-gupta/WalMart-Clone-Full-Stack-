/**
 * Optimizes Cloudinary URLs with transformations for better performance.
 * @param {string} url - Original Cloudinary URL
 * @param {string} transformations - Comma separated transformations (e.g. 'w_300,h_300,c_fill')
 * @returns {string} - Transformed URL
 */
export const optimizeCloudinaryUrl = (url, transformations = 'q_auto,f_auto') => {
  if (!url || !url.includes('cloudinary.com')) return url;

  // Find the 'upload/' segment to inject transformations
  const partToFind = 'upload/';
  const index = url.indexOf(partToFind);

  if (index === -1) return url;

  const insertionPoint = index + partToFind.length;
  return `${url.slice(0, insertionPoint)}${transformations}/${url.slice(insertionPoint)}`;
};

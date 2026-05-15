/**
 * Extracts the YouTube video ID from various URL formats.
 * @param {string} url - The YouTube video URL.
 * @returns {string|null} - The video ID if found, otherwise null.
 */
export const getYouTubeID = (url) => {
  if (!url) return null;
  
  // Standard, Short, Embed, and ID formats
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  
  return match ? match[1] : null;
};

/**
 * Checks if a URL is a YouTube URL.
 * @param {string} url - The URL to check.
 * @returns {boolean}
 */
export const isYouTubeURL = (url) => {
  if (!url) return false;
  return /youtube\.com|youtu\.be/.test(url);
};

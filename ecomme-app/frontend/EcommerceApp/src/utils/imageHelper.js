import { BASE_URL } from '../api/API';

export const getImageUrl = imagePath => {
  if (!imagePath) return null;

  // If the path already starts with http, don't prepend BASE_URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  return `${BASE_URL}${imagePath}`;
};

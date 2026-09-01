const localApiBase = 'http://127.0.0.1:8000/api/';

/** Convert a Django media path into a URL the frontend can render. */
export const profilePictureUrl = (value?: string) => {
  if (!value || value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || localApiBase;
  const serverOrigin = new URL(apiBase).origin;
  return `${serverOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};

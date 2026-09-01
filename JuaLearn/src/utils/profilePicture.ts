const localApiBase = 'http://127.0.0.1:8000/api/';

/** Convert a Django media path into a URL the frontend can render. */
export const profilePictureUrl = (value?: string) => {
  if (!value || value.startsWith('blob:') || value.startsWith('data:') || /^https?:\/\//i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_BASE_URL || localApiBase;
  const serverOrigin = new URL(apiBase).origin;
  return `${serverOrigin}${value.startsWith('/') ? value : `/${value}`}`;
};

/** Create a stable two-letter avatar label when the user has no uploaded image. */
export const profileInitials = (firstName?: string, lastName?: string, username?: string) => {
  const nameParts = [firstName, lastName].filter(Boolean).map((part) => part!.trim()).filter(Boolean);
  if (nameParts.length) return nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (username || 'User')
    .trim()
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';
};

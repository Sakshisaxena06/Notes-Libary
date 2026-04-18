// ✅ Export BACKEND_URL so all files can import it from one place
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  // ✅ If url is relative (starts with /api), prepend BACKEND_URL
  const fullUrl = url.startsWith("/") ? `${BACKEND_URL}${url}` : url;

  return fetch(fullUrl, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};
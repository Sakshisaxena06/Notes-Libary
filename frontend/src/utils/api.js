const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchWithAuth = (url, options = {}) => {
  const token = localStorage.getItem("token");

  // Don't set Content-Type for FormData - browser will set it automatically with boundary
  const isFormData = options.body instanceof FormData;

  return fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }), // 🔥 KEY FIX
      ...options.headers,
    },
  });
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const API_BASE_URL = `${BASE_URL}/api`;

// Get token from localStorage
export const getToken = () => {
  return localStorage.getItem("token");
};

// Helper function to fetch with auth token
export const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export default API_BASE_URL;

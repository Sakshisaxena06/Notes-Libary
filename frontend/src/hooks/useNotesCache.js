import { useRef, useCallback } from "react";
import { fetchWithAuth, BACKEND_URL } from "../utils/api";

export const useNotesCache = (user, isAdmin) => {
  const cache = useRef({});

  const fetchWithCache = useCallback(async (endpoint, params = {}, options = {}) => {
    const { cacheKey, cacheDuration = 60000 } = options;

    // ✅ Build full URL always
    const url = new URL(`${BACKEND_URL}${endpoint}`);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        url.searchParams.append(key, val);
      }
    });

    const fullUrl = url.toString();

    // Check cache
    if (cacheKey && cache.current[cacheKey]) {
      const { data, timestamp } = cache.current[cacheKey];
      if (Date.now() - timestamp < cacheDuration) {
        return data;
      }
    }

    const response = await fetchWithAuth(fullUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    // Store in cache
    if (cacheKey) {
      cache.current[cacheKey] = { data, timestamp: Date.now() };
    }

    return data;
  }, []);

  const clearCache = useCallback((key) => {
    if (key) delete cache.current[key];
    else cache.current = {};
  }, []);

  const invalidateCache = useCallback((prefix) => {
    Object.keys(cache.current).forEach(key => {
      if (key.startsWith(prefix)) delete cache.current[key];
    });
  }, []);

  return { fetchWithCache, clearCache, invalidateCache };
};
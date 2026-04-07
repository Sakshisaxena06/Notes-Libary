import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWithAuth } from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const createCacheKey = (endpoint, params = {}) => {
  const paramString = Object.keys(params).length > 0
    ? `?${new URLSearchParams(params).toString()}`
    : '';
  return `${endpoint}${paramString}`;
};

export function useNotesCache() {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const abortControllers = useRef({});

  const fetchWithCache = useCallback(async (endpoint, params = {}, options = {}) => {
    const { 
      cacheKey = createCacheKey(endpoint, params),
      cacheDuration = 5 * 60 * 1000,
      skipCache = false,
      forceRefresh = false
    } = options;

    const now = Date.now();
    const cached = cache[cacheKey];

    if (!skipCache && !forceRefresh && cached && (now - cached.timestamp < cacheDuration)) {
      return cached.data;
    }

    if (loading[cacheKey]) {
      return null;
    }

    if (abortControllers.current[cacheKey]) {
      abortControllers.current[cacheKey].abort();
    }

    setLoading(prev => ({ ...prev, [cacheKey]: true }));

    const controller = new AbortController();
    abortControllers.current[cacheKey] = controller;

    try {
      const url = `${BACKEND_URL}${createCacheKey(endpoint, params)}`;
      const response = await fetchWithAuth(url, {
        signal: controller.signal,
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setCache(prev => ({
        ...prev,
        [cacheKey]: {
          data,
          timestamp: now
        }
      }));

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null;
      }
      throw err;
    } finally {
      setLoading(prev => ({ ...prev, [cacheKey]: false }));
    }
  }, [cache, loading]);

  const clearCache = useCallback((cacheKey = null) => {
    if (cacheKey) {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });
    } else {
      setCache({});
    }
  }, []);

  const invalidateCache = useCallback((pattern = null) => {
    setCache(prev => {
      if (!pattern) return {};
      
      const newCache = { ...prev };
      Object.keys(newCache).forEach(key => {
        if (key.includes(pattern)) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);

  useEffect(() => {
    const controllers = abortControllers.current;
    return () => {
      Object.values(controllers).forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  return {
    fetchWithCache,
    clearCache,
    invalidateCache,
    isLoading: (key) => loading[key] || false,
    getCachedData: (key) => cache[key]?.data,
    hasCache: (key) => !!cache[key]
  };
}

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

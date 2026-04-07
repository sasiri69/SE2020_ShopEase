import axios from "axios";
import { API_BASE_URL } from "../config";

function normalizeApiBaseUrl(base) {
  const clean = (base || "").replace(/\/+$/, "");
  // Avoid accidental double "/api/api" when env already includes /api.
  return clean.endsWith("/api") ? clean : `${clean}/api`;
}

export function createApiClient(getToken) {
  const api = axios.create({
    baseURL: normalizeApiBaseUrl(API_BASE_URL),
    timeout: 20000,
  });

  api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        // eslint-disable-next-line no-console
        console.error(`API Error [${error.response.status}]:`, error.response.data);
      } else {
        // eslint-disable-next-line no-console
        console.error("Network Error:", error.message);
      }
      return Promise.reject(error);
    },
  );

  return api;
}


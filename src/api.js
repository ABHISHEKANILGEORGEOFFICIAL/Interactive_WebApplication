import axios from "axios";

// Base URL
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

// Axios instance
const API = axios.create({
  baseURL: BASE_URL,
});

// Convert API payloads safely into arrays
export const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.courses)) return payload.courses;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

// Better error messages
export const getApiErrorMessage = (
  error,
  fallback = "Request failed."
) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.detail) {
    return String(responseData.detail);
  }

  if (responseData?.message) {
    return String(responseData.message);
  }

  if (responseData && typeof responseData === "object") {
    const fieldMessages = Object.entries(responseData)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) {
          return value
            .filter(Boolean)
            .map((item) => `${field}: ${item}`);
        }

        if (typeof value === "string" && value.trim()) {
          return [`${field}: ${value}`];
        }

        return [];
      });

    if (fieldMessages.length) {
      return fieldMessages.join(" ");
    }
  }

  return fallback;
};

// Request interceptor
API.interceptors.request.use(
  (config) => {
    // Remove accidental leading slash issue
    if (config.url?.startsWith("/")) {
      config.url = config.url.substring(1);
    }

    // Public endpoints
    const publicEndpoints = [
      "login/",
      "token/",
      "register/",
      "student/register/",
      "teacher/register/",
      "face-verification/",
    ];

    const isPublic = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    // Add token only for protected routes
    if (!isPublic) {
      const token = localStorage.getItem("access_token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG_API === "true") {
      console.log("API REQUEST:");
      console.log("FULL URL:", `${BASE_URL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh logic
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
API.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isTokenError =
      error.response?.data?.code === "token_not_valid";

    if (
      is401 &&
      isTokenError &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return API(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken =
        localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${BASE_URL}token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = data.access;

        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        API.defaults.headers.common.Authorization =
          `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
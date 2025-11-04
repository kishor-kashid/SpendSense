import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error?.message || error.response.data?.message || 'An error occurred';
      const statusCode = error.response.status;
      // Create error with message and status code
      const apiError = new Error(message);
      apiError.status = statusCode;
      apiError.response = error.response;
      return Promise.reject(apiError);
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

// User endpoints
export const getUsers = () => api.get('/users');
export const getUser = (userId) => api.get(`/users/${userId}`);

// Consent endpoints
export const getConsent = (userId) => api.get(`/consent/${userId}`);
export const grantConsent = (userId) => api.post('/consent', { user_id: userId });
export const revokeConsent = (userId) => api.delete(`/consent/${userId}`);

// Profile endpoints
export const getProfile = (userId) => api.get(`/profile/${userId}`);

// Recommendations endpoints
export const getRecommendations = (userId) => api.get(`/recommendations/${userId}`);

// Feedback endpoints
export const submitFeedback = (feedbackData) => api.post('/feedback', feedbackData);

// Operator endpoints
export const getReviewQueue = () => api.get('/operator/review');
export const approveRecommendation = (reviewId, notes) => api.post('/operator/approve', { review_id: reviewId, operator_notes: notes });
export const overrideRecommendation = (reviewId, notes) => api.post('/operator/override', { review_id: reviewId, operator_notes: notes });
export const getOperatorUsers = () => api.get('/operator/users');

export default api;


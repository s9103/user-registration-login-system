import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Attach the JWT to every outgoing request, if we have one.
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function registerUser(fullName, email, password) {
  const response = await api.post('/api/auth/register', { fullName, email, password });
  return response.data; // { token, userId, fullName, email }
}

export async function loginUser(email, password) {
  const response = await api.post('/api/auth/login', { email, password });
  return response.data; // { token, userId, fullName, email }
}

export async function logoutUser() {
  const response = await api.post('/api/auth/logout');
  return response.data;
}

export async function fetchCurrentUser() {
  const response = await api.get('/api/auth/me');
  return response.data; // { id, fullName, email }
}

// Reads a friendly error message out of the backend's ErrorResponse shape,
// falling back to a generic message for network errors.
export function extractErrorMessage(error) {
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (data.details && data.details.length > 0) {
      return data.details.join('\n');
    }
    if (data.message) {
      return data.message;
    }
  }
  return 'Something went wrong. Please check your connection and try again.';
}

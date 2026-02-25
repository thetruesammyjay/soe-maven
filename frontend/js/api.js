// ============================================
// API Client — Enterprise Patient Management
// ============================================

const API = (() => {
  // Base URL of the API Gateway
  const BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:4004';
  const TOKEN_KEY = 'pm_auth_token';
  const USER_KEY = 'pm_auth_user';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${BASE_URL}${path}`, config);

      if (response.status === 401) {
        clearAuth();
        window.location.href = 'index.html';
        throw new Error('Session expired');
      }

      if (response.status === 204) {
        return { success: true };
      }

      const contentType = response.headers.get('content-type');
      let data = null;
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Unable to connect to the server. Please check if the backend is running.');
      }
      throw err;
    }
  }

  // Auth endpoints
  async function login(email, password) {
    const data = await request('POST', '/auth/login', { email, password });
    if (data && data.token) {
      setToken(data.token);
      setUser({ email });
    }
    return data;
  }

  function logout() {
    clearAuth();
    window.location.href = 'index.html';
  }

  // Patient endpoints
  async function getPatients() {
    return await request('GET', '/api/patients/');
  }

  async function createPatient(patient) {
    return await request('POST', '/api/patients/', patient);
  }

  async function updatePatient(id, patient) {
    return await request('PUT', `/api/patients/${id}`, patient);
  }

  async function deletePatient(id) {
    return await request('DELETE', `/api/patients/${id}`);
  }

  // Service health checks
  async function checkServiceHealth(serviceName, url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch(url, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeout);
      return { name: serviceName, status: 'online' };
    } catch {
      return { name: serviceName, status: 'offline' };
    }
  }

  return {
    getToken, setToken, getUser, setUser, clearAuth,
    isAuthenticated, requireAuth, login, logout,
    getPatients, createPatient, updatePatient, deletePatient,
    checkServiceHealth, BASE_URL
  };
})();

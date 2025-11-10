import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
      }
    } catch (e) {
      // Ignore parse errors
      console.warn('Failed to parse auth token from localStorage')
    }
  }
  return config
})

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on login/register page
      const currentPath = window.location.pathname
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('auth-storage')
        // Use a small delay to avoid redirect loops
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
    }
    return Promise.reject(error)
  }
)

export default api


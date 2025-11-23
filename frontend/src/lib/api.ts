import axios from 'axios'

// API URL resolution: Try build-time env var first, then runtime discovery
// For local development, set VITE_API_URL in .env.local
let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Runtime API URL discovery: If we're in production and API_URL is localhost,
// try to discover the backend IP from a meta tag or use a known endpoint
if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  // Check if we have a meta tag with backend URL (set by deployment)
  const metaTag = document.querySelector('meta[name="backend-api-url"]')
  if (metaTag) {
    API_URL = metaTag.getAttribute('content') || API_URL
  }
  
  // If still localhost in production, try to fetch from a known endpoint
  // This is a fallback - the deployment should set VITE_API_URL correctly
  if (API_URL.includes('localhost')) {
    console.warn('⚠️ Frontend using localhost API URL in production. Deployment may need to set VITE_API_URL.')
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests and handle Content-Type for empty bodies
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
  
  // Remove Content-Type header if there's no body (no data, null, or undefined)
  if (!config.data || (typeof config.data === 'object' && Object.keys(config.data).length === 0)) {
    delete config.headers['Content-Type']
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


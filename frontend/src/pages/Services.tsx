import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { Plus, Server, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  url: string
  type: string
  check_interval: number
  timeout: number
  is_active: boolean
  created_at: string
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'http',
    check_interval: 60,
    timeout: 10,
    latency_threshold_ms: undefined as number | undefined,
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      console.log('Fetching services...')
      const response = await api.get('/services')
      console.log('Services response:', response.data)
      setServices(Array.isArray(response.data) ? response.data : [])
    } catch (error: any) {
      console.error('Failed to fetch services:', error)
      setServices([])
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      console.log('Creating service:', formData)
      const response = await api.post('/services', formData)
      console.log('Service created:', response.data)
      setShowModal(false)
      setFormData({ name: '', url: '', type: 'http', check_interval: 60, timeout: 10, latency_threshold_ms: undefined })
      fetchServices()
    } catch (error: any) {
      console.error('Failed to create service:', error)
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create service'
      alert(errorMsg)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      await api.delete(`/services/${id}`)
      fetchServices()
    } catch (error) {
      alert('Failed to delete service')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading services...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">Services</h1>
          <p className="text-white/70 mt-1.5 text-sm">Manage and monitor your endpoints</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-12 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
          <Server className="mx-auto h-12 w-12 text-white/40" />
          <h3 className="mt-2 text-sm font-medium text-white">No services</h3>
          <p className="mt-1 text-sm text-white/70">
            Get started by creating a new service to monitor.
          </p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
          <ul className="divide-y divide-white/20">
            {services.map((service) => (
              <li key={service.id} className="hover:bg-white/5 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Server className="h-8 w-8 text-white/60" />
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/services/${service.id}`}
                          className="text-lg font-medium text-white hover:text-white/80 transition-colors"
                        >
                          {service.name}
                        </Link>
                        <p className="text-sm text-white/70">{service.url}</p>
                        <p className="text-xs text-white/50 mt-1">
                          Type: {service.type.toUpperCase()} | Interval: {service.check_interval}s
                          | Timeout: {service.timeout}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                          service.is_active
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-white/60 bg-white/10'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                          service.is_active ? 'bg-green-400' : 'bg-white/40'
                        }`}></span>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add Service Modal */}
      {showModal && (
        <div className="fixed z-50 inset-0 overflow-y-auto" onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowModal(false)
          }
        }}>
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
            <div className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden border border-white/20 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">
                    Add New Service
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80">Name</label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                        placeholder="My Service"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80">URL</label>
                      <input
                        type="url"
                        required
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                        placeholder="https://example.com"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80">Type</label>
                      <select
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="http">HTTP</option>
                        <option value="tcp">TCP</option>
                        <option value="ping">Ping</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80">
                          Check Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                          value={formData.check_interval}
                          onChange={(e) =>
                            setFormData({ ...formData, check_interval: parseInt(e.target.value) })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/80">
                          Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                          value={formData.timeout}
                          onChange={(e) =>
                            setFormData({ ...formData, timeout: parseInt(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80">
                        Latency Threshold (ms) <span className="text-white/50 text-xs">(Optional - alerts when exceeded)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
                        placeholder="e.g. 1000"
                        value={formData.latency_threshold_ms || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            latency_threshold_ms: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-white/10">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-white/10 text-base font-medium text-white hover:bg-white/20 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-white/10 text-base font-medium text-white hover:bg-white/20 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

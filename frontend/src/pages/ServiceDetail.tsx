import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../lib/api'
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts'
import { format } from 'date-fns'

interface Service {
  id: string
  name: string
  url: string
  type: string
  check_interval: number
  timeout: number
  is_active: boolean
}

interface HealthCheck {
  id: string
  status: string
  response_time_ms?: number | null
  status_code?: number | null
  checked_at: string
}

interface Stats {
  service_id: string
  service_name: string
  uptime_percent: number
  avg_response_time_ms: number
  total_checks: number
  up_checks: number
  down_checks: number
  status: string
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>()
  const [service, setService] = useState<Service | null>(null)
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchService()
      fetchHealthChecks()
      fetchStats()
    }
  }, [id])

  // Set up real-time updates every 5 seconds
  useEffect(() => {
    if (!id) return

    const interval = setInterval(() => {
      fetchHealthChecks()
      fetchStats()
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [id])

  const fetchService = async () => {
    try {
      const response = await api.get(`/services/${id}`)
      setService(response.data)
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch service:', error)
      if (error.response?.status === 404) {
        setError('Service not found')
      } else if (error.response?.status === 403) {
        setError('Access denied')
      } else {
        setError('Failed to load service')
      }
      setLoading(false)
    }
  }

  const fetchHealthChecks = async () => {
    try {
      const response = await api.get(`/services/${id}/health-checks?limit=100`)
      // Ensure it's always an array
      const checks = Array.isArray(response.data) ? response.data : []
      setHealthChecks(checks)
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch health checks:', error)
      setHealthChecks([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get(`/services/${id}/stats`)
      setStats(response.data)
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch stats:', error)
      // Don't set error here, stats are optional
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading service details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/20 border border-red-500/30 backdrop-blur-xl rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-300 mb-2">Error</h3>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <div className="bg-yellow-500/20 border border-yellow-500/30 backdrop-blur-xl rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-yellow-300 mb-2">Service Not Found</h3>
          <p className="text-yellow-200">The service you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  // Ensure healthChecks is always an array
  const safeHealthChecks = Array.isArray(healthChecks) ? healthChecks : []

  const chartData = safeHealthChecks
    .filter((check) => check.checked_at && check.response_time_ms != null)
    .slice()
    .reverse()
    .map((check) => ({
      time: format(new Date(check.checked_at), 'HH:mm'),
      responseTime: check.response_time_ms || 0,
      status: check.status === 'up' ? 1 : 0,
    }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'text-green-400 bg-green-500/20'
      case 'down':
        return 'text-red-400 bg-red-500/20'
      case 'unknown':
        return 'text-white/60 bg-white/10'
      default:
        return 'text-white/60 bg-white/10'
    }
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-4xl font-semibold text-white tracking-tight">{service.name}</h1>
        <p className="text-white/70 mt-1.5 text-sm">{service.url}</p>
        <div className="mt-3 flex items-center space-x-4 text-sm text-white/60">
          <span>Type: {service.type.toUpperCase()}</span>
          <span>•</span>
          <span>Interval: {service.check_interval}s</span>
          <span>•</span>
          <span>Timeout: {service.timeout}s</span>
        </div>
      </div>

      {/* Stats Cards - Dark Theme */}
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <dt className="text-sm font-medium text-white/70 mb-1">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  stats.status || 'unknown'
                )}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                  stats.status === 'up' ? 'bg-green-400' : 
                  stats.status === 'down' ? 'bg-red-400' : 
                  'bg-white/40'
                }`}></span>
                {stats.status === 'unknown' ? 'NO DATA' : (stats.status || 'UNKNOWN').toUpperCase()}
              </span>
            </dd>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <dt className="text-sm font-medium text-white/70 mb-1">Uptime</dt>
            <dd className="mt-2">
              <span className="text-3xl font-semibold text-white">
                {stats.total_checks > 0 ? `${(stats.uptime_percent || 0).toFixed(2)}%` : 'N/A'}
              </span>
            </dd>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <dt className="text-sm font-medium text-white/70 mb-1">Avg Response Time</dt>
            <dd className="mt-2">
              <span className="text-3xl font-semibold text-white">
                {stats.avg_response_time_ms > 0 ? `${stats.avg_response_time_ms.toFixed(0)}ms` : 'N/A'}
              </span>
            </dd>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <dt className="text-sm font-medium text-white/70 mb-1">Total Checks</dt>
            <dd className="mt-2">
              <span className="text-3xl font-semibold text-white">
                {stats.total_checks || 0}
              </span>
            </dd>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <p className="text-sm text-white/70">
            Statistics will be available after health checks start running. Make sure the scheduler is running.
          </p>
        </div>
      )}

      {/* Response Time Chart - Dark Theme */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Response Time</h2>
            <p className="text-sm text-white/70">Real-time performance monitoring</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-white/80">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live</span>
            <span>•</span>
            <span>Updates every 5s</span>
          </div>
        </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  stroke="rgba(255,255,255,0.2)"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'rgba(255,255,255,0.7)', fontSize: '12px' } }}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  stroke="rgba(255,255,255,0.2)"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '12px'
                  }}
                  labelStyle={{ fontWeight: 600, marginBottom: '4px', color: '#fff' }}
                  formatter={(value: any) => [`${value}ms`, 'Response Time']}
                />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={{ fill: '#60a5fa', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={400}
                />
                {stats && stats.avg_response_time_ms > 0 && (
                  <ReferenceLine 
                    y={stats.avg_response_time_ms} 
                    stroke="#fbbf24" 
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    label={{ 
                      value: `Avg: ${stats.avg_response_time_ms.toFixed(0)}ms`, 
                      position: 'right', 
                      fill: '#fbbf24',
                      fontWeight: 600,
                      fontSize: 12
                    }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-white/60">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-white/10 mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-base font-medium text-white">No health check data available yet</p>
              <p className="text-sm mt-2 text-white/70">Health checks will appear here once the scheduler starts running</p>
              <p className="text-xs mt-3 text-white/50">
                Start scheduler: <code className="bg-white/10 px-2 py-1 rounded text-white/80">cd backend && go run cmd/scheduler/main.go</code>
              </p>
            </div>
          )}
      </div>

      {/* Status Chart - Dark Theme */}
      {chartData.length > 0 && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-1">Availability Status</h2>
            <p className="text-sm text-white/70">Service uptime visualization over time</p>
          </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="statusGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  stroke="rgba(255,255,255,0.2)"
                />
                <YAxis 
                  domain={[0, 1]}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.7)' }}
                  stroke="rgba(255,255,255,0.2)"
                  tickFormatter={(value) => value === 1 ? 'UP' : value === 0 ? 'DOWN' : ''}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [
                    <span key="value" style={{ 
                      color: value === 1 ? '#34d399' : '#f87171', 
                      fontWeight: 600
                    }}>
                      {value === 1 ? 'UP' : 'DOWN'}
                    </span>, 
                    'Status'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="status" 
                  stroke="#34d399" 
                  fill="url(#statusGradient)"
                  strokeWidth={2}
                  dot={{ fill: '#34d399', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                  animationDuration={400}
                />
              </AreaChart>
            </ResponsiveContainer>
        </div>
      )}

      {/* Performance Metrics Chart - Dark Theme */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Response Time Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData.slice().reverse().slice(0, 10)} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }} stroke="rgba(255,255,255,0.2)" />
                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }} stroke="rgba(255,255,255,0.2)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '8px',
                      color: '#fff',
                      padding: '12px'
                    }}
                    formatter={(value: any) => [`${value}ms`, 'Response Time']}
                  />
                  <Bar dataKey="responseTime" fill="#60a5fa" radius={[6, 6, 0, 0]} animationDuration={400} />
                </BarChart>
              </ResponsiveContainer>
          </div>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Trend Analysis</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }} stroke="rgba(255,255,255,0.2)" />
                <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.7)' }} stroke="rgba(255,255,255,0.2)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.2)', 
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '12px'
                  }}
                  formatter={(value: any) => [`${value}ms`, 'Response Time']}
                />
                <Area 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#60a5fa" 
                  fill="url(#trendGradient)"
                  strokeWidth={2}
                  animationDuration={400}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Health Checks - Dark Theme */}
      <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Recent Health Checks</h2>
        </div>
        <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-white/20">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Response Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                      Status Code
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {safeHealthChecks.length > 0 ? (
                    safeHealthChecks.slice(0, 20).map((check) => (
                      <tr key={check.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {check.checked_at
                            ? format(new Date(check.checked_at), 'MMM dd, yyyy HH:mm:ss')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              check.status || 'unknown'
                            )}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              check.status === 'up' ? 'bg-green-400' : 
                              check.status === 'down' ? 'bg-red-400' : 
                              'bg-white/40'
                            }`}></span>
                            {(check.status || 'UNKNOWN').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {check.response_time_ms != null ? `${check.response_time_ms}ms` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {check.status_code || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="inline-flex flex-col items-center">
                          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-white">No health checks available yet</p>
                          <p className="text-xs text-white/70 mt-1">Health checks will appear here once the scheduler starts running</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}


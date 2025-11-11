import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import {
  Server,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface ServiceStats {
  service_id: string;
  service_name: string;
  uptime_percent: number;
  avg_response_time_ms: number;
  total_checks: number;
  up_checks: number;
  down_checks: number;
  status: string;
}

interface Overview {
  average_uptime: number;
  total_services: number;
  services: ServiceStats[];
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchOverview();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      console.log("Fetching overview...");
      const response = await api.get("/stats/overview");
      console.log("Overview response:", response.data);
      setOverview(response.data);
      setError(null);
    } catch (error: any) {
      console.error("Failed to fetch overview:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        error: error.response?.data?.error,
        details: error.response?.data?.details,
      });

      if (error.response?.status === 401) {
        setError("Unauthorized - please login again");
      } else if (error.response?.status === 404) {
        setError("API endpoint not found. Check backend is running.");
      } else if (!error.response) {
        setError("Cannot connect to backend. Is the server running?");
      } else {
        const errorMsg = error.response?.data?.error || error.message;
        const errorDetails = error.response?.data?.details;
        setError(
          `Failed to load dashboard: ${errorMsg}${
            errorDetails ? ` (${errorDetails})` : ""
          }`
        );
      }

      // Set empty overview so page still renders
      setOverview({
        average_uptime: 0,
        total_services: 0,
        services: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading dashboard...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up":
        return "text-green-400 bg-green-500/20";
      case "down":
        return "text-red-400 bg-red-500/20";
      case "unknown":
        return "text-white/60 bg-white/10";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  // Show empty state if no overview data (but don't block rendering)
  // Handle null services from API
  const displayOverview = overview
    ? {
        ...overview,
        services: overview.services || [], // Ensure services is always an array
      }
    : {
        average_uptime: 0,
        total_services: 0,
        services: [],
      };

  return (
    <PageTransition animationType="slideUp">
      <div className="space-y-8 pb-8">
        {/* Hero Section  */}
        <div className="bg-gradient-to-r from-white/10 via-white/8 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div>
                  <h1 className="text-4xl font-semibold text-white tracking-tight">
                    Monitoring Dashboard
                  </h1>
                  <p className="text-white/70 mt-1.5 text-sm">
                    Real-time visibility into your infrastructure health
                  </p>
                </div>
              </div>
              <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
                Track uptime, performance metrics, and service availability
                across all your monitored endpoints. Get instant alerts when
                issues are detected.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
                <div className="flex items-center space-x-2">
                  <div className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <p className="text-xs font-medium text-white/60">Status</p>
                    <p className="text-sm font-semibold text-white">Active</p>
                  </div>
                </div>
              </div>
              <Link
                to="/services"
                className="inline-flex items-center px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 text-sm font-semibold text-white transition-all duration-200"
              >
                <Zap className="w-4 h-4 mr-2" />
                Add Service
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 backdrop-blur-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-yellow-300">
                  Warning
                </h3>
                <p className="mt-1 text-sm text-yellow-200/90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Section - AWS Style Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
              Key Metrics
            </h2>
            <p className="text-sm text-white/70">
              Overview of your monitoring infrastructure
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-white/20 rounded-lg p-2.5 group-hover:bg-white/30 transition-colors">
                  <Server className="h-5 w-5 text-white/90" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1">
                  Total Services
                </p>
                <p className="text-3xl font-bold text-white mb-2">
                  {displayOverview.total_services || 0}
                </p>
                <p className="text-xs text-white/50">Monitored endpoints</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-green-500/20 rounded-lg p-2.5 group-hover:bg-green-500/30 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1">
                  Average Uptime
                </p>
                <p className="text-3xl font-bold text-white mb-2">
                  {displayOverview.average_uptime.toFixed(2) || "0.00"}%
                </p>
                <p className="text-xs text-white/50">System availability</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:border-white/30 hover:bg-white/15 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-red-500/20 rounded-lg p-2.5 group-hover:bg-red-500/30 transition-colors">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60 mb-1">
                  Services Down
                </p>
                <p className="text-3xl font-bold text-white mb-2">
                  {displayOverview.services.filter((s) => s.status === "down")
                    .length || 0}
                </p>
                <p className="text-xs text-white/50">Requires attention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Service Uptime Section - AWS Style */}
        {displayOverview.services.length > 0 && (
          <div>
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
                    Service Availability
                  </h2>
                  <p className="text-sm text-white/70">
                    Real-time uptime metrics and health status across all
                    monitored services
                  </p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-white/80">
                    Live
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {displayOverview.services.slice(0, 8).map((service) => (
                  <div
                    key={service.service_id}
                    className="group bg-white/10 hover:bg-white/15 rounded-xl p-6 border border-white/20 hover:border-white/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white truncate mb-1">
                          {service.service_name}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-white/60">
                          <span>
                            {service.total_checks > 0
                              ? `${service.up_checks} up`
                              : "No checks"}
                          </span>
                          {service.total_checks > 0 && (
                            <>
                              <span>•</span>
                              <span>{service.total_checks} total</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span
                          className={`text-2xl font-bold ${
                            service.uptime_percent >= 99
                              ? "text-green-400"
                              : service.uptime_percent >= 95
                              ? "text-yellow-400"
                              : service.total_checks > 0
                              ? "text-red-400"
                              : "text-white/40"
                          }`}
                        >
                          {service.total_checks > 0
                            ? `${service.uptime_percent.toFixed(1)}%`
                            : "—"}
                        </span>
                        {service.total_checks > 0 && (
                          <span className="text-xs text-white/50 mt-0.5">
                            uptime
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                            service.uptime_percent >= 99
                              ? "bg-gradient-to-r from-green-400 via-emerald-400 to-green-500"
                              : service.uptime_percent >= 95
                              ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500"
                              : service.total_checks > 0
                              ? "bg-gradient-to-r from-red-400 via-pink-400 to-rose-500"
                              : "bg-white/20"
                          }`}
                          style={{
                            width: `${
                              service.total_checks > 0
                                ? Math.max(service.uptime_percent, 0)
                                : 0
                            }%`,
                            boxShadow:
                              service.total_checks > 0
                                ? `0 0 12px ${
                                    service.uptime_percent >= 99
                                      ? "rgba(34, 197, 94, 0.4)"
                                      : service.uptime_percent >= 95
                                      ? "rgba(251, 191, 36, 0.4)"
                                      : "rgba(239, 68, 68, 0.4)"
                                  }`
                                : "none",
                          }}
                        />
                      </div>
                      {service.total_checks > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/50">
                            {service.down_checks > 0 && (
                              <span className="text-red-400">
                                {service.down_checks} down
                              </span>
                            )}
                          </span>
                          <span className="text-white/50">
                            Last check:{" "}
                            {service.uptime_percent >= 99 ? (
                              <span className="text-green-400 font-medium">
                                Healthy
                              </span>
                            ) : service.uptime_percent >= 95 ? (
                              <span className="text-yellow-400 font-medium">
                                Degraded
                              </span>
                            ) : (
                              <span className="text-red-400 font-medium">
                                Unhealthy
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Response Time Comparison - AWS Style */}
        {displayOverview.services.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
                Performance Analytics
              </h2>
              <p className="text-sm text-white/70">
                Response time comparison and latency metrics across all services
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-8 border border-white/20">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={displayOverview.services.slice(0, 10)}
                  margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="service_name"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="rgba(255,255,255,0.2)"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.7)" }}
                    stroke="rgba(255,255,255,0.2)"
                    label={{
                      value: "Response Time (ms)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "rgba(255,255,255,0.7)",
                        fontSize: "12px",
                      },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "#fff",
                      padding: "12px",
                    }}
                    labelStyle={{
                      fontWeight: 600,
                      marginBottom: "4px",
                      color: "#fff",
                    }}
                    formatter={(value: any) => [
                      `${value.toFixed(0)}ms`,
                      "Avg Response Time",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="avg_response_time_ms"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dot={{
                      fill: "#60a5fa",
                      r: 4,
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#3b82f6",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    animationDuration={400}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Services List - AWS Style */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-2">
              All Services
            </h2>
            <p className="text-sm text-white/70">
              Complete overview of all monitored endpoints with detailed metrics
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/20 bg-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    Service Details
                  </h3>
                  <p className="text-xs text-white/60 mt-1">
                    {displayOverview.services.length} service
                    {displayOverview.services.length !== 1 ? "s" : ""} monitored
                  </p>
                </div>
                <Link
                  to="/services"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors self-start sm:self-auto"
                >
                  View all →
                </Link>
              </div>
            </div>
            {displayOverview.services.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Server className="mx-auto h-12 w-12 text-white/40" />
                <h3 className="mt-2 text-sm font-medium text-white">
                  No services
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  Get started by creating a new service to monitor.
                </p>
                <div className="mt-6">
                  <Link
                    to="/services"
                    className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-md text-white bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Add Service
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-white/10">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Service
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Uptime
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Avg Response Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Checks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {displayOverview.services.map((service) => (
                        <tr
                          key={service.service_id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/services/${service.service_id}`}
                              className="text-sm font-medium text-white hover:text-white/80 transition-colors"
                            >
                              {service.service_name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                service.status
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                  service.status === "up"
                                    ? "bg-green-400"
                                    : service.status === "down"
                                    ? "bg-red-400"
                                    : "bg-white/40"
                                }`}
                              ></span>
                              {service.status === "unknown"
                                ? "NO DATA"
                                : service.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {service.total_checks > 0 ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-white">
                                  {service.uptime_percent.toFixed(2)}%
                                </span>
                                <div className="w-16 bg-white/20 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${service.uptime_percent}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-white/50">
                                No data
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {service.avg_response_time_ms > 0
                              ? `${service.avg_response_time_ms.toFixed(0)}ms`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                            {service.total_checks > 0 ? (
                              <>
                                <span className="font-medium">
                                  {service.total_checks}
                                </span>
                                <span className="text-white/40 mx-1">•</span>
                                <span className="text-green-400">
                                  {service.up_checks} up
                                </span>
                                <span className="text-white/40 mx-1">•</span>
                                <span className="text-red-400">
                                  {service.down_checks} down
                                </span>
                              </>
                            ) : (
                              <span className="text-white/50">
                                No checks yet
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-white/10">
                  {displayOverview.services.map((service) => (
                    <Link
                      key={service.service_id}
                      to={`/services/${service.service_id}`}
                      className="block px-4 py-4 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {service.service_name}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${getStatusColor(
                            service.status
                          )}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              service.status === "up"
                                ? "bg-green-400"
                                : service.status === "down"
                                ? "bg-red-400"
                                : "bg-white/40"
                            }`}
                          ></span>
                          {service.status === "unknown"
                            ? "NO DATA"
                            : service.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Uptime */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">Uptime</span>
                          {service.total_checks > 0 ? (
                            <div className="flex items-center space-x-2 flex-1 max-w-[140px] ml-2">
                              <span className="text-xs font-medium text-white">
                                {service.uptime_percent.toFixed(2)}%
                              </span>
                              <div className="flex-1 bg-white/20 rounded-full h-1.5 min-w-[60px]">
                                <div
                                  className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${service.uptime_percent}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-white/50">
                              No data
                            </span>
                          )}
                        </div>

                        {/* Response Time */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">
                            Avg Response
                          </span>
                          <span className="text-xs text-white/80">
                            {service.avg_response_time_ms > 0
                              ? `${service.avg_response_time_ms.toFixed(0)}ms`
                              : "-"}
                          </span>
                        </div>

                        {/* Checks */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">Checks</span>
                          {service.total_checks > 0 ? (
                            <div className="flex items-center space-x-1.5 text-xs">
                              <span className="font-medium text-white">
                                {service.total_checks}
                              </span>
                              <span className="text-white/40">•</span>
                              <span className="text-green-400">
                                {service.up_checks} up
                              </span>
                              <span className="text-white/40">•</span>
                              <span className="text-red-400">
                                {service.down_checks} down
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-white/50">
                              No checks yet
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

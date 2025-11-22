import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import { AlertCircle, CheckCircle } from "lucide-react";
import { formatDate } from "../lib/utils";

interface Alert {
  id: string;
  service_id: string;
  type: string;
  message: string;
  severity: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      console.log("Fetching alerts...");
      const response = await api.get("/alerts?limit=50");
      console.log("Alerts response:", response.data);
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to fetch alerts:", error);
      setAlerts([]);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await api.put(`/alerts/${id}/resolve`);
      fetchAlerts();
    } catch (error) {
      alert("Failed to resolve alert");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-slate-300">Loading alerts...</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-300 bg-red-500/20 border border-red-500/30";
      case "high":
        return "text-red-300 bg-red-500/20 border border-red-500/30";
      case "medium":
        return "text-amber-300 bg-amber-500/20 border border-amber-500/30";
      case "low":
        return "text-indigo-300 bg-indigo-500/20 border border-indigo-500/30";
      default:
        return "text-slate-400 bg-slate-700/30 border border-slate-600/30";
    }
  };

  return (
    <PageTransition animationType="fade">
      <div className="relative space-y-6 sm:space-y-8 pb-8 min-h-screen">
        {/* Content */}
        <div className="relative z-[2]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
                Alerts
              </h1>
              <p className="text-slate-300 mt-1.5 text-xs sm:text-sm mb-3">
                Service downtime and incident notifications
              </p>
            </div>
            <Link
              to="/alerts/subscriptions"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto mb-3"
            >
              Manage Subscriptions
            </Link>
          </div>

          {alerts.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <CheckCircle className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No alerts</h3>
              <p className="mt-1 text-sm text-slate-300">
                All services are healthy.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50 shadow-xl">
              <ul className="divide-y divide-slate-700/50">
                {alerts.map((alert) => (
                  <li
                    key={alert.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="px-5 py-5 sm:px-6 sm:py-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex items-start flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {alert.is_resolved ? (
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                            )}
                          </div>
                          <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium text-white break-words">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getSeverityColor(
                                    alert.severity
                                  )}`}
                                >
                                  {alert.severity.toUpperCase()}
                                </span>
                                {alert.is_resolved && (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 whitespace-nowrap">
                                    RESOLVED
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
                              {formatDate(alert.created_at)}
                            </p>
                          </div>
                        </div>
                        {!alert.is_resolved && (
                          <button
                            onClick={() => handleResolve(alert.id)}
                            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto sm:ml-4 flex-shrink-0"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

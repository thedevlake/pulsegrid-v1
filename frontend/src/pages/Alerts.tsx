import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import { AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

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
        <p className="mt-4 text-white/70">Loading alerts...</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-300 bg-red-500/20";
      case "high":
        return "text-red-400 bg-red-500/20";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20";
      case "low":
        return "text-blue-400 bg-blue-500/20";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  return (
    <PageTransition animationType="slideLeft">
      <div className="space-y-6 sm:space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
              Alerts
            </h1>
            <p className="text-white/70 mt-1.5 text-xs sm:text-sm">
              Service downtime and incident notifications
            </p>
          </div>
          <Link
            to="/alerts/subscriptions"
            className="inline-flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors w-full sm:w-auto"
          >
            Manage Subscriptions
          </Link>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-white">No alerts</h3>
            <p className="mt-1 text-sm text-white/70">
              All services are healthy.
            </p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
            <ul className="divide-y divide-white/20">
              {alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-start flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {alert.is_resolved ? (
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
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
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-green-400 bg-green-500/20 whitespace-nowrap">
                                  RESOLVED
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 text-xs sm:text-sm text-white/70">
                            {format(
                              new Date(alert.created_at),
                              "MMM dd, yyyy HH:mm:ss"
                            )}
                          </p>
                        </div>
                      </div>
                      {!alert.is_resolved && (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="inline-flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors w-full sm:w-auto sm:ml-4 flex-shrink-0"
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
    </PageTransition>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
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
    <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Alerts
          </h1>
          <p className="text-white/70 mt-1.5 text-sm">
            Service downtime and incident notifications
          </p>
        </div>
        <Link
          to="/alerts/subscriptions"
          className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
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
              <li key={alert.id} className="hover:bg-white/5 transition-colors">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {alert.is_resolved ? (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        ) : (
                          <AlertCircle className="h-6 w-6 text-red-400" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-white">
                            {alert.message}
                          </p>
                          <span
                            className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(
                              alert.severity
                            )}`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                          {alert.is_resolved && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-full text-green-400 bg-green-500/20">
                              RESOLVED
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-white/70">
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
                        className="ml-4 inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
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
  );
}

import { useEffect, useState } from "react";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import { Bell, Mail, Plus, Trash2, Server } from "lucide-react";

interface AlertSubscription {
  id: string;
  service_id: string | null;
  channel: string;
  destination: string;
  is_active: boolean;
  created_at: string;
}

interface Service {
  id: string;
  name: string;
}

export default function AlertSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    service_id: "",
    destination: "",
  });

  useEffect(() => {
    fetchSubscriptions();
    fetchServices();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get("/alerts/subscriptions");
      setSubscriptions(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to fetch subscriptions:", error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await api.get("/services");
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, string> = {
        destination: formData.destination,
      };
      if (formData.service_id) {
        payload.service_id = formData.service_id;
      }

      await api.post("/alerts/subscriptions", payload);
      setShowModal(false);
      setFormData({ service_id: "", destination: "" });
      fetchSubscriptions();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to create subscription";
      alert(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;

    try {
      await api.delete(`/alerts/subscriptions/${id}`);
      fetchSubscriptions();
    } catch (error) {
      alert("Failed to delete subscription");
    }
  };

  const channelBadgeClass =
    "text-indigo-300 bg-indigo-500/20 border border-indigo-500/30";

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-slate-300">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <PageTransition animationType="fade">
      <div className="relative space-y-8 pb-8 min-h-screen">
        {/* Content */}
        <div className="relative z-[2]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-4xl font-semibold text-white tracking-tight">
                Alert Subscriptions
              </h1>
              <p className="text-slate-300 mt-1.5 text-sm">
                Manage email notifications for alerts
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Subscription
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-slate-700/50">
              <Bell className="mx-auto h-12 w-12 text-white/40" />
              <h3 className="mt-2 text-sm font-medium text-white">
                No subscriptions
              </h3>
              <p className="mt-1 text-sm text-slate-300">
                Create a subscription to receive alerts via email.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl overflow-hidden border border-slate-700/50 shadow-xl">
              <ul className="divide-y divide-slate-700/50">
                {subscriptions.map((subscription) => {
                  const service = services.find(
                    (s) => s.id === subscription.service_id
                  );
                  return (
                    <li
                      key={subscription.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="px-5 py-5 sm:px-6 sm:py-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${channelBadgeClass}`}
                            >
                              <Mail className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${channelBadgeClass}`}
                                >
                                  EMAIL
                                </span>
                                {subscription.is_active ? (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                                    Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-slate-400 bg-white/10">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-white mt-1">
                                {subscription.destination}
                              </p>
                              {service ? (
                                <p className="text-xs text-slate-400 mt-1 flex items-center">
                                  <Server className="w-3 h-3 mr-1" />
                                  {service.name}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 mt-1">
                                  All services
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDelete(subscription.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Add Subscription Modal */}
          {showModal && (
            <div
              className="fixed z-50 inset-0 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowModal(false);
                }
              }}
            >
              <div className="flex items-center justify-center min-h-screen p-4 ">
                <div
                  className="fixed inset-0 bg-black/5 backdrop-blur-sm"
                  onClick={() => setShowModal(false)}
                ></div>
                <div
                  className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl place-self-center rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-lg z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <form onSubmit={handleSubmit}>
                    <div className="px-6 pt-6 pb-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">
                          Add Alert Subscription
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="text-slate-400 hover:text-white transition-colors p-1"
                          aria-label="Close"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Notification Channel
                          </label>
                          <div className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white flex items-center justify-between">
                            <span className="flex items-center space-x-2 text-sm">
                              <Mail className="w-4 h-4 text-slate-300" />
                              <span>Email</span>
                            </span>
                            <span className="text-xs text-slate-400">
                              via configured SMTP/SES
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            PulseGrid currently delivers alerts exclusively via
                            email. Add the address that should receive incident
                            notifications.
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Destination
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            placeholder="email@example.com"
                            value={formData.destination}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                destination: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-white mb-2">
                            Service
                            <span className="text-white/50 text-xs font-normal ml-2">
                              (Optional)
                            </span>
                          </label>
                          <select
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            value={formData.service_id}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                service_id: e.target.value,
                              })
                            }
                          >
                            <option value="">All Services</option>
                            {services.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-800/40 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-600/50 bg-slate-800/50 text-white font-medium hover:bg-slate-700/50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-blue-500/30 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/20"
                      >
                        Create Subscription
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

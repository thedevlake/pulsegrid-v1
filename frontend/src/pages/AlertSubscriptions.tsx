import { useEffect, useState } from "react";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import {
  Bell,
  Mail,
  MessageSquare,
  Plus,
  Trash2,
  Server,
  AlertCircle,
} from "lucide-react";

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
    channel: "email",
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
      const payload: any = {
        channel: formData.channel,
        destination: formData.destination,
      };
      if (formData.service_id) {
        payload.service_id = formData.service_id;
      }

      await api.post("/alerts/subscriptions", payload);
      setShowModal(false);
      setFormData({ service_id: "", channel: "email", destination: "" });
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

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <MessageSquare className="w-4 h-4" />;
      case "slack":
        return <Bell className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email":
        return "text-blue-300 bg-blue-500/20";
      case "sms":
        return "text-blue-500 bg-blue-800/20";
      case "slack":
        return "text-blue-500 bg-blue-800/20";
      default:
        return "text-white/60 bg-white/10";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading subscriptions...</p>
      </div>
    );
  }

  return (
    <PageTransition animationType="slideDown">
      <div className="space-y-8 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Alert Subscriptions
          </h1>
          <p className="text-white/70 mt-1.5 text-sm">
            Manage notification channels for alerts
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </button>
      </div>

      {subscriptions.length === 0 ? (
        <div className="text-center py-12 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20">
          <Bell className="mx-auto h-12 w-12 text-white/40" />
          <h3 className="mt-2 text-sm font-medium text-white">
            No subscriptions
          </h3>
          <p className="mt-1 text-sm text-white/70">
            Create a subscription to receive alerts via email, SMS, or Slack.
          </p>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl overflow-hidden border border-white/20">
          <ul className="divide-y divide-white/20">
            {subscriptions.map((subscription) => {
              const service = services.find(
                (s) => s.id === subscription.service_id
              );
              return (
                <li
                  key={subscription.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${getChannelColor(
                            subscription.channel
                          )}`}
                        >
                          {getChannelIcon(subscription.channel)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${getChannelColor(
                                subscription.channel
                              )}`}
                            >
                              {subscription.channel.toUpperCase()}
                            </span>
                            {subscription.is_active ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-purple-500 bg-purple-700/20">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white/60 bg-white/10">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white mt-1">
                            {subscription.destination}
                          </p>
                          {service ? (
                            <p className="text-xs text-white/60 mt-1 flex items-center">
                              <Server className="w-3 h-3 mr-1" />
                              {service.name}
                            </p>
                          ) : (
                            <p className="text-xs text-white/60 mt-1">
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
          className="fixed z-50 inset-0 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>
          <div
            className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-lg mx-auto my-auto"
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
                      className="text-white/60 hover:text-white transition-colors p-1"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Notification Channel
                      </label>
                      <select
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        value={formData.channel}
                        onChange={(e) =>
                          setFormData({ ...formData, channel: e.target.value })
                        }
                      >
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="slack">Slack</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Destination
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder={
                          formData.channel === "email"
                            ? "email@example.com"
                            : formData.channel === "sms"
                            ? "+1234567890"
                            : "https://hooks.slack.com/services/..."
                        }
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
                        <span className="text-white/50 text-xs font-normal ml-2">(Optional)</span>
                      </label>
                      <select
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
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
                <div className="px-6 py-4 border-t border-white/20 bg-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-900 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 border border-blue-800/30 text-white font-medium transition-colors shadow-lg shadow-blue-900/30"
                  >
                    Create Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}


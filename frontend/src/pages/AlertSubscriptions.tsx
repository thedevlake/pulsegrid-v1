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
        return "text-green-300 bg-green-500/20";
      case "slack":
        return "text-purple-300 bg-purple-500/20";
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
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-green-300 bg-green-500/20">
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
          className="fixed z-50 inset-0 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>
            <div
              className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden border border-white/20 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">
                    Add Alert Subscription
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80">
                        Channel
                      </label>
                      <select
                        required
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
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
                      <label className="block text-sm font-medium text-white/80">
                        Destination
                      </label>
                      <input
                        type="text"
                        required
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
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
                      <label className="block text-sm font-medium text-white/80">
                        Service (Optional)
                      </label>
                      <select
                        className="mt-1 block w-full bg-white/10 border border-white/20 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30"
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
    </PageTransition>
  );
}


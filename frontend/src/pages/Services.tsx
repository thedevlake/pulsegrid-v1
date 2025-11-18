import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import {
  Plus,
  Server,
  Trash2,
  Pencil,
  AlertTriangle,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  X,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  url: string;
  type: string;
  check_interval: number;
  timeout: number;
  is_active: boolean;
  created_at: string;
  latency_threshold_ms?: number | null;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHealthCheckModal, setShowHealthCheckModal] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<any>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [triggeringCheck, setTriggeringCheck] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "http",
    check_interval: 60,
    timeout: 10,
    latency_threshold_ms: undefined as number | undefined,
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      console.log("Fetching services...");
      const response = await api.get("/services");
      console.log("Services response:", response.data);
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Failed to fetch services:", error);
      setServices([]);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL based on type
    if (formData.type === "tcp" || formData.type === "ping") {
      // For TCP/Ping, allow hostname:port or hostname format
      const tcpPattern = /^[\w.-]+(:\d+)?$/;
      if (!tcpPattern.test(formData.url.trim())) {
        alert(
          "Invalid format. For TCP use: hostname:port (e.g., 8.8.8.8:53). For Ping use: hostname (e.g., google.com)"
        );
        return;
      }
    } else {
      // For HTTP, validate it's a proper URL
      try {
        new URL(formData.url);
      } catch {
        alert(
          "Invalid URL. Please include http:// or https:// (e.g., https://example.com)"
        );
        return;
      }
    }

    try {
      if (editingService) {
        // Update existing service
        // Update existing service
        console.log("Updating service:", editingService.id, formData);
        const response = await api.put(
          `/services/${editingService.id}`,
          formData
        );
        console.log("Service updated:", response.data);
        // Update the service in the list immediately
        if (response.data && response.data.id) {
          setServices((prev) =>
            prev.map((s) => (s.id === response.data.id ? response.data : s))
          );
        }
      } else {
        // Create new service
        console.log("Creating service:", formData);
        const response = await api.post("/services", formData);
        console.log("Service created:", response.data);
        // Add the new service to the list immediately for better UX
        if (response.data && response.data.id) {
          setServices((prev) => [response.data, ...prev]);
        }
      }
      setShowModal(false);
      setEditingService(null);
      setFormData({
        name: "",
        url: "",
        type: "http",
        check_interval: 60,
        timeout: 10,
        latency_threshold_ms: undefined,
      });
      // Refresh the list to ensure we have the latest data
      // Add a small delay to ensure backend has processed the creation
      setTimeout(() => {
        fetchServices();
      }, 500);
    } catch (error: any) {
      console.error("Failed to save service:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        (editingService
          ? "Failed to update service"
          : "Failed to create service");
      alert(errorMsg);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      url: service.url,
      type: service.type,
      check_interval: service.check_interval,
      timeout: service.timeout,
      latency_threshold_ms: service.latency_threshold_ms || undefined,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      name: "",
      url: "",
      type: "http",
      check_interval: 60,
      timeout: 10,
      latency_threshold_ms: undefined,
    });
  };

  const handleDeleteClick = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/services/${serviceToDelete.id}`);
      fetchServices();
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (error) {
      alert("Failed to delete service");
    } finally {
      setDeleting(false);
    }
  };

  const handleTriggerCheck = async (serviceId: string) => {
    setTriggeringCheck(serviceId);
    try {
      const response = await api.post(
        `/services/${serviceId}/health-checks/trigger`
      );
      console.log("Health check triggered:", response.data);
      // Refresh services to show updated status
      fetchServices();
      // Get service info for display
      const service = services.find((s) => s.id === serviceId);
      // Store result with service info and show modal
      setHealthCheckResult({
        ...response.data,
        service_name: service?.name,
        service_url: service?.url,
        service_type: service?.type,
      });
      setShowHealthCheckModal(true);
    } catch (error: any) {
      console.error("Failed to trigger health check:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Failed to trigger health check. Make sure the backend is running.";
      // Get service info even on error
      const service = services.find((s) => s.id === serviceId);
      // Store error as result
      setHealthCheckResult({
        status: "error",
        error_message: errorMsg,
        service_name: service?.name,
        service_url: service?.url,
        service_type: service?.type,
      });
      setShowHealthCheckModal(true);
    } finally {
      setTriggeringCheck(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading services...</p>
      </div>
    );
  }

  return (
    <PageTransition animationType="slideRight">
      <div className="space-y-6 sm:space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
              Services
            </h1>
            <p className="text-white/70 mt-1.5 text-xs sm:text-sm">
              Manage and monitor your endpoints
            </p>
          </div>
          <button
            onClick={() => {
              setEditingService(null);
              setFormData({
                name: "",
                url: "",
                type: "http",
                check_interval: 60,
                timeout: 10,
                latency_threshold_ms: undefined,
              });
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 text-white text-sm font-medium rounded-lg hover:bg-white/20 transition-colors w-full sm:w-auto"
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
                <li
                  key={service.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-start sm:items-center flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <Server className="h-6 w-6 sm:h-8 sm:w-8 text-white/60" />
                        </div>
                        <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                          <Link
                            to={`/services/${service.id}`}
                            className="text-base sm:text-lg font-medium text-white hover:text-white/80 transition-colors block truncate"
                          >
                            {service.name}
                          </Link>
                          <p className="text-xs sm:text-sm text-white/70 truncate mt-0.5">
                            {service.url}
                          </p>
                          <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1.5">
                            <span className="text-xs text-white/50">
                              Type: {service.type.toUpperCase()}
                            </span>
                            <span className="text-xs text-white/50">
                              Interval: {service.check_interval}s
                            </span>
                            <span className="text-xs text-white/50">
                              Timeout: {service.timeout}s
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2 sm:px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            service.is_active
                              ? "text-blue-500 bg-blue-800/20"
                              : "text-white/60 bg-white/10"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              service.is_active ? "bg-blue-600" : "bg-white/40"
                            }`}
                          ></span>
                          {service.is_active ? "Active" : "Inactive"}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTriggerCheck(service.id)}
                            disabled={
                              triggeringCheck === service.id ||
                              !service.is_active
                            }
                            className="text-blue-500 hover:text-blue-400 transition-colors p-1 sm:p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Run health check"
                            title="Run health check now"
                          >
                            {triggeringCheck === service.id ? (
                              <div className="w-4 h-4 sm:w-4 sm:h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Play className="w-4 h-4 sm:w-4 sm:h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(service)}
                            className="text-blue-400 hover:text-blue-300 transition-colors p-1 sm:p-0"
                            aria-label="Edit service"
                          >
                            <Pencil className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(service)}
                            className="text-red-400 hover:text-red-300 transition-colors p-1 sm:p-0"
                            aria-label="Delete service"
                          >
                            <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Add/Edit Service Modal */}
        {showModal && (
          <div
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <div
              className="absolute inset-0"
              onClick={handleCloseModal}
            ></div>
            <div
              className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl mx-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleSubmit}>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      {editingService ? "Edit Service" : "Add New Service"}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="text-white/60 hover:text-white transition-colors p-1"
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
                        Service Name
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="My Service"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        URL{" "}
                        {formData.type === "tcp" || formData.type === "ping"
                          ? "(hostname:port)"
                          : ""}
                      </label>
                      <input
                        type={
                          formData.type === "tcp" || formData.type === "ping"
                            ? "text"
                            : "url"
                        }
                        required
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder={
                          formData.type === "tcp"
                            ? "8.8.8.8:53 or hostname:port"
                            : formData.type === "ping"
                            ? "google.com or 8.8.8.8"
                            : "https://example.com"
                        }
                        value={formData.url}
                        onChange={(e) =>
                          setFormData({ ...formData, url: e.target.value })
                        }
                      />
                      {(formData.type === "tcp" ||
                        formData.type === "ping") && (
                        <p className="mt-2 text-xs text-white/50">
                          {formData.type === "tcp"
                            ? "Format: hostname:port (e.g., 8.8.8.8:53, google.com:80)"
                            : "Format: hostname or IP address (e.g., google.com, 8.8.8.8)"}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Service Type
                      </label>
                      <select
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                      >
                        <option value="http">HTTP</option>
                        <option value="tcp">TCP</option>
                        <option value="ping">Ping</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Check Interval (seconds)
                        </label>
                        <input
                          type="number"
                          min="10"
                          className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                          value={formData.check_interval}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              check_interval: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                          value={formData.timeout}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              timeout: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">
                        Latency Threshold (ms)
                        <span className="text-white/50 text-xs font-normal ml-2">
                          (Optional)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-white/10 border border-white/20 rounded-lg py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-white/30 transition-all"
                        placeholder="e.g. 1000"
                        value={formData.latency_threshold_ms || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            latency_threshold_ms: e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-white/20 bg-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 border border-blue-500/30 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/50"
                  >
                    {editingService ? "Update Service" : "Create Service"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && serviceToDelete && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleDeleteCancel();
              }
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={handleDeleteCancel}
              ></div>
              <div
                className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden border border-white/20 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full max-w-[calc(100%-2rem)] mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                      <AlertTriangle
                        className="h-6 w-6 text-red-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                      <h3 className="text-lg leading-6 font-medium text-white">
                        Delete Service
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-white/70">
                          Are you sure you want to delete{" "}
                          <span className="font-semibold text-white">
                            {serviceToDelete.name}
                          </span>
                          ? This action cannot be undone and all associated
                          health check data will be permanently deleted.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 px-4 py-3 sm:px-6 flex flex-col-reverse sm:flex-row-reverse gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="w-full inline-flex justify-center rounded-md border border-white/20 shadow-sm px-4 py-2 bg-white/10 text-sm font-medium text-white hover:bg-white/20 sm:mt-0 sm:w-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Health Check Result Modal - Small Compact Form */}
        {showHealthCheckModal && healthCheckResult && (
          <div
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowHealthCheckModal(false);
              }
            }}
          >
            {/* Blurred Background Overlay */}
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowHealthCheckModal(false)}
            ></div>

            {/* Small Compact Modal */}
            <div
              className="relative bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl w-full max-w-md mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  {healthCheckResult.status === "up" ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : healthCheckResult.status === "error" ? (
                    <XCircle className="h-5 w-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  )}
                  <h3 className="text-base font-semibold text-white">
                    Health Check Result
                  </h3>
                </div>
                <button
                  onClick={() => setShowHealthCheckModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Compact Form Content */}
              <div className="p-4 space-y-3">
                {/* Service Name */}
                {healthCheckResult.service_name && (
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-sm text-white/70">Service:</span>
                    <span className="text-sm font-semibold text-white truncate ml-2 max-w-[200px]">
                      {healthCheckResult.service_name}
                    </span>
                  </div>
                )}

                {/* Service URL */}
                {healthCheckResult.service_url && (
                  <div className="flex items-start justify-between">
                    <span className="text-sm text-white/70">URL:</span>
                    <span className="text-xs font-mono text-white/80 text-right break-all ml-2 max-w-[240px]">
                      {healthCheckResult.service_url}
                    </span>
                  </div>
                )}

                {/* Service Type */}
                {healthCheckResult.service_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Type:</span>
                    <span className="text-xs font-semibold text-white/80 uppercase px-2 py-0.5 bg-white/10 rounded">
                      {healthCheckResult.service_type}
                    </span>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="text-sm text-white/70">Status:</span>
                  <span
                    className={`text-sm font-semibold px-2.5 py-1 rounded ${
                      healthCheckResult.status === "up"
                        ? "text-green-400 bg-green-500/20"
                        : healthCheckResult.status === "error"
                        ? "text-red-400 bg-red-500/20"
                        : "text-yellow-400 bg-yellow-500/20"
                    }`}
                  >
                    {healthCheckResult.status === "up"
                      ? "UP"
                      : healthCheckResult.status === "error"
                      ? "ERROR"
                      : healthCheckResult.status?.toUpperCase() || "UNKNOWN"}
                  </span>
                </div>

                {/* Response Time */}
                {healthCheckResult.response_time_ms !== null &&
                  healthCheckResult.response_time_ms !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">
                        Response Time:
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <Clock className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-sm font-semibold text-white">
                          {healthCheckResult.response_time_ms}ms
                        </span>
                      </div>
                    </div>
                  )}

                {/* Status Code */}
                {healthCheckResult.status_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">HTTP Status:</span>
                    <span className="text-sm font-semibold text-white">
                      {healthCheckResult.status_code}
                    </span>
                  </div>
                )}

                {/* Checked At */}
                {healthCheckResult.checked_at && (
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-white/70">Checked At:</span>
                    <span className="text-xs text-white/80">
                      {new Date(healthCheckResult.checked_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Error Message */}
                {healthCheckResult.error_message && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-start justify-between">
                      <span className="text-xs text-red-400 font-medium">
                        Error:
                      </span>
                      <p className="text-xs text-red-300 break-words text-right ml-2 max-w-[240px]">
                        {healthCheckResult.error_message}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setShowHealthCheckModal(false)}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

import { useEffect, useState } from "react";
import api from "../lib/api";
import PageTransition from "../components/PageTransition";
import { useAuthStore } from "../store/authStore";
import {
  Users,
  Building2,
  Server,
  Activity,
  AlertTriangle,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  X,
  Mail,
  User,
  Shield,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface SystemMetrics {
  total_users: number;
  total_organizations: number;
  total_services: number;
  active_services: number;
  total_health_checks: number;
  total_alerts: number;
  unresolved_alerts: number;
  system_uptime: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id?: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function Admin() {
  const { user: currentUser } = useAuthStore();
  const isSuperAdmin = currentUser?.role === "super_admin";

  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "organizations"
  >("overview");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditOrgModal, setShowEditOrgModal] = useState(false);
  const [showDeleteOrgModal, setShowDeleteOrgModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    org_id: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    org_id: "",
    general: "",
  });
  const [orgFormData, setOrgFormData] = useState({
    name: "",
  });

  // Notification states
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, usersRes, orgsRes] = await Promise.all([
        api.get("/admin/metrics"),
        api.get("/admin/users"),
        api.get("/admin/organizations"),
      ]);
      setMetrics(metricsRes.data);
      setUsers(usersRes.data);
      setOrganizations(orgsRes.data);

      // Debug: Log current user info
      console.log("Current user:", currentUser);
      console.log("Is super admin:", isSuperAdmin);
    } catch (error: any) {
      console.error("Failed to fetch admin data:", error);
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error || error.message;
      const isConnectionRefused =
        error.code === "ERR_NETWORK" ||
        error.message?.includes("CONNECTION_REFUSED");

      if (isConnectionRefused || error.code === "ERR_CONNECTION_REFUSED") {
        showNotification(
          "error",
          "Backend server is not running. Please start it: cd backend && go run cmd/api/main.go"
        );
      } else if (status === 404) {
        showNotification(
          "error",
          "Admin endpoints not found. Please restart the backend server: cd backend && go run cmd/api/main.go"
        );
      } else if (status === 403) {
        showNotification(
          "error",
          "Admin access required. Your account needs admin privileges."
        );
      } else if (status === 401) {
        showNotification(
          "error",
          "Authentication required. Please log in again."
        );
      } else {
        showNotification("error", errorMsg || "Failed to fetch admin data");
      }
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setFormErrors({
      name: "",
      email: "",
      password: "",
      role: "",
      org_id: "",
      general: "",
    });

    // Client-side validation
    let hasErrors = false;
    const newErrors = {
      name: "",
      email: "",
      password: "",
      role: "",
      org_id: "",
      general: "",
    };

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      hasErrors = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      hasErrors = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
      hasErrors = true;
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
      hasErrors = true;
    }

    if (isSuperAdmin && !formData.org_id) {
      newErrors.org_id = "Please select an organization";
      hasErrors = true;
    }

    if (hasErrors) {
      setFormErrors(newErrors);
      return;
    }

    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      };

      // For organization admins, automatically use their organization_id
      // For super admins, use the selected org_id or require it
      if (isSuperAdmin) {
        if (formData.org_id) {
          payload.org_id = formData.org_id;
        } else {
          setFormErrors({
            ...newErrors,
            org_id: "Please select an organization",
          });
          return;
        }
      } else {
        // Organization admin: use their own organization_id
        if (currentUser?.organization_id) {
          payload.org_id = currentUser.organization_id;
        } else {
          setFormErrors({
            ...newErrors,
            general:
              "Organization ID not found. Please log out and log back in.",
          });
          return;
        }
      }

      console.log("Creating user with payload:", {
        ...payload,
        password: "***",
      });
      const response = await api.post("/admin/users", payload);
      console.log("User created successfully:", response.data);

      showNotification("success", "User created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.error || error.message || "Failed to create user";

      // Parse backend errors and map them to form fields
      const backendErrors = {
        name: "",
        email: "",
        password: "",
        role: "",
        org_id: "",
        general: "",
      };

      // Check for specific field errors
      if (
        errorMessage.toLowerCase().includes("email") ||
        errorMessage.toLowerCase().includes("user already exists")
      ) {
        backendErrors.email = errorMessage;
      } else if (
        errorMessage.toLowerCase().includes("password") ||
        errorMessage.toLowerCase().includes("min")
      ) {
        backendErrors.password = errorMessage;
      } else if (errorMessage.toLowerCase().includes("name")) {
        backendErrors.name = errorMessage;
      } else if (errorMessage.toLowerCase().includes("organization")) {
        backendErrors.org_id = errorMessage;
      } else {
        backendErrors.general = errorMessage;
      }

      setFormErrors(backendErrors);

      // Also show notification for visibility
      showNotification("error", errorMessage);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload: any = {};
      if (formData.name) payload.name = formData.name;
      if (formData.email) payload.email = formData.email;
      if (formData.role) payload.role = formData.role;

      await api.put(`/admin/users/${selectedUser.id}`, payload);
      showNotification("success", "User updated successfully");
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to update user"
      );
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/admin/users/${selectedUser.id}`);
      showNotification("success", "User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to delete user"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      org_id: "",
    });
    setFormErrors({
      name: "",
      email: "",
      password: "",
      role: "",
      org_id: "",
      general: "",
    });
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      org_id: user.organization_id || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handlePromoteToSuperAdmin = async (userId: string) => {
    try {
      await api.post(`/admin/super/users/${userId}/promote`);
      showNotification("success", "User promoted to super admin successfully");
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to promote user"
      );
    }
  };

  const handleDemoteFromSuperAdmin = async (userId: string) => {
    try {
      await api.post(`/admin/super/users/${userId}/demote`);
      showNotification("success", "User demoted from super admin successfully");
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to demote user"
      );
    }
  };

  const handleEditOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      await api.put(`/admin/organizations/${selectedOrg.id}`, {
        name: orgFormData.name,
      });
      showNotification("success", "Organization updated successfully");
      setShowEditOrgModal(false);
      setSelectedOrg(null);
      setOrgFormData({ name: "" });
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to update organization"
      );
    }
  };

  const handleDeleteOrganization = async () => {
    if (!selectedOrg) return;

    try {
      const response = await api.delete(
        `/admin/organizations/${selectedOrg.id}`
      );
      const data = response.data;

      // Show success message with details if available
      let message = "Organization deleted successfully";
      if (
        data.deleted_users !== undefined ||
        data.deleted_services !== undefined
      ) {
        const parts = [];
        if (data.deleted_users > 0) parts.push(`${data.deleted_users} user(s)`);
        if (data.deleted_services > 0)
          parts.push(`${data.deleted_services} service(s)`);
        if (parts.length > 0) {
          message += `. Also deleted: ${parts.join(", ")}.`;
        }
      }

      showNotification("success", message);
      setShowDeleteOrgModal(false);
      setSelectedOrg(null);
      fetchData();
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || "Failed to delete organization";
      const details = error.response?.data?.details;
      showNotification("error", details ? `${errorMsg}: ${details}` : errorMsg);
    }
  };

  if (loading && !metrics && users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <PageTransition animationType="blur">
      <div className="space-y-8 pb-8">
        {/* Notification */}
        {notification && (
          <div
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50 p-4 rounded-xl shadow-lg backdrop-blur-xl border ${
              notification.type === "success"
                ? "bg-blue-800/20 border-blue-800/30 text-blue-500"
                : "bg-red-500/20 border-red-500/30 text-red-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm flex-1">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white/60 hover:text-white flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
              Admin Panel
            </h1>
            <p className="text-white/70 mt-1.5 text-xs sm:text-sm">
              System administration and user management
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {(!metrics || users.length === 0) && (
              <div className="text-xs text-yellow-400/80 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 text-center sm:text-left">
                Backend server may need restart
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/20 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
            <button
              onClick={() => setActiveTab("overview")}
              className={`${
                activeTab === "overview"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-white/70 hover:text-white hover:border-white/30"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`${
                activeTab === "users"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-white/70 hover:text-white hover:border-white/30"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("organizations")}
              className={`${
                activeTab === "organizations"
                  ? "border-blue-400 text-blue-400"
                  : "border-transparent text-white/70 hover:text-white hover:border-white/30"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Organizations
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && metrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-6 w-6 text-white/60" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Total Users
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.total_users}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Building2 className="h-6 w-6 text-white/60" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Organizations
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.total_organizations}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Server className="h-6 w-6 text-white/60" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Services
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.active_services} / {metrics.total_services}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <TrendingUp className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          System Uptime
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.system_uptime.toFixed(2)}%
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Health Checks
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.total_health_checks.toLocaleString()}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Total Alerts
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.total_alerts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-white/70 truncate">
                          Unresolved Alerts
                        </dt>
                        <dd className="text-lg font-medium text-white">
                          {metrics.unresolved_alerts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-base sm:text-lg font-medium text-white">
                All Users
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.role === "super_admin"
                                ? "text-purple-400 bg-purple-800/20 border border-purple-500/30"
                                : user.role === "admin"
                                ? "text-blue-500 bg-blue-800/20"
                                : "text-white/70 bg-white/10"
                            }`}
                          >
                            {user.role === "super_admin"
                              ? "SUPER ADMIN"
                              : user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            {isSuperAdmin && user.role !== "super_admin" && (
                              <button
                                onClick={() =>
                                  handlePromoteToSuperAdmin(user.id)
                                }
                                className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Promote to super admin"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                            )}
                            {isSuperAdmin &&
                              user.role === "super_admin" &&
                              user.id !== currentUser?.id && (
                                <button
                                  onClick={() =>
                                    handleDemoteFromSuperAdmin(user.id)
                                  }
                                  className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                  title="Demote from super admin"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                              )}
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="Edit user"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(user)}
                              className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg overflow-hidden">
              <div className="divide-y divide-white/10">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="px-4 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {user.name}
                        </h3>
                        <p className="text-xs text-white/70 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ml-2 flex-shrink-0 ${
                          user.role === "super_admin"
                            ? "text-purple-400 bg-purple-800/20 border border-purple-500/30"
                            : user.role === "admin"
                            ? "text-blue-500 bg-blue-800/20"
                            : "text-white/70 bg-white/10"
                        }`}
                      >
                        {user.role === "super_admin"
                          ? "SUPER ADMIN"
                          : user.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">
                        Created:{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        {isSuperAdmin && user.role !== "super_admin" && (
                          <button
                            onClick={() => handlePromoteToSuperAdmin(user.id)}
                            className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Promote to super admin"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                        )}
                        {isSuperAdmin &&
                          user.role === "super_admin" &&
                          user.id !== currentUser?.id && (
                            <button
                              onClick={() =>
                                handleDemoteFromSuperAdmin(user.id)
                              }
                              className="text-orange-400 hover:text-orange-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                              title="Demote from super admin"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          )}
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(user)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Organizations Tab */}
        {activeTab === "organizations" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-base sm:text-lg font-medium text-white mb-4">
                All Organizations
              </h2>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden">
                <table className="min-w-full divide-y divide-white/10">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Slug
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Created
                      </th>
                      {isSuperAdmin && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {organizations.map((org) => (
                      <tr
                        key={org.id}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {org.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {org.slug}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                          {new Date(org.created_at).toLocaleDateString()}
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setOrgFormData({ name: org.name });
                                  setShowEditOrgModal(true);
                                }}
                                className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Edit organization"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOrg(org);
                                  setShowDeleteOrgModal(true);
                                }}
                                className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Delete organization"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-white/10">
                {organizations.map((org) => (
                  <div
                    key={org.id}
                    className="px-4 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">
                          {org.name}
                        </h3>
                        <p className="text-xs text-white/60 truncate mt-0.5">
                          Slug: {org.slug}
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setOrgFormData({ name: org.name });
                              setShowEditOrgModal(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Edit organization"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrg(org);
                              setShowDeleteOrgModal(true);
                            }}
                            className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Delete organization"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-white/60">
                      Created: {new Date(org.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateModal && (
          <div
            className="fixed z-50 inset-0 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
          >
            <div
              className="absolute inset-0 "
              onClick={() => setShowCreateModal(false)}
            ></div>
            <div
              className="relative bg-black/90 backdrop-blur-xl rounded-2xl border border-white/30 shadow-2xl w-full max-w-lg mx-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleCreateUser}>
                <div className="px-6 pt-5 pb-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">
                      Create New User
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
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
                  <div className="space-y-3.5">
                    {/* General Error Message */}
                    {formErrors.general && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 mb-1">
                        <p className="text-xs text-red-300 font-medium">
                          {formErrors.general}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        className={`w-full bg-white/10 border rounded-lg py-2.5 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.name
                            ? "border-red-500/50 focus:ring-red-400 focus:border-red-400"
                            : "border-white/20 focus:ring-white/30 focus:border-white/30"
                        }`}
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (formErrors.name) {
                            setFormErrors({ ...formErrors, name: "" });
                          }
                        }}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        className={`w-full bg-white/10 border rounded-lg py-2.5 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.email
                            ? "border-red-500/50 focus:ring-red-400 focus:border-red-400"
                            : "border-white/20 focus:ring-white/30 focus:border-white/30"
                        }`}
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (formErrors.email) {
                            setFormErrors({ ...formErrors, email: "" });
                          }
                        }}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className={`w-full bg-white/10 border rounded-lg py-2.5 px-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 transition-all ${
                          formErrors.password ||
                          (formData.password.length > 0 &&
                            formData.password.length < 8)
                            ? "border-red-500/50 focus:ring-red-400 focus:border-red-400"
                            : "border-white/20 focus:ring-white/30 focus:border-white/30"
                        }`}
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            password: e.target.value,
                          });
                          if (formErrors.password) {
                            setFormErrors({ ...formErrors, password: "" });
                          }
                        }}
                      />
                      {(formErrors.password ||
                        (formData.password.length > 0 &&
                          formData.password.length < 8)) && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formErrors.password ||
                            `Password must be at least 8 characters (${formData.password.length}/8)`}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-1.5">
                        Role
                      </label>
                      <select
                        required
                        className={`w-full bg-white/10 border rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 transition-all ${
                          formErrors.role
                            ? "border-red-500/50 focus:ring-red-400 focus:border-red-400"
                            : "border-white/20 focus:ring-white/30 focus:border-white/30"
                        }`}
                        value={formData.role}
                        onChange={(e) => {
                          setFormData({ ...formData, role: e.target.value });
                          if (formErrors.role) {
                            setFormErrors({ ...formErrors, role: "" });
                          }
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {formErrors.role && (
                        <p className="text-xs text-red-400 mt-1 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {formErrors.role}
                        </p>
                      )}
                    </div>

                    {isSuperAdmin && (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1.5">
                          Organization
                        </label>
                        <select
                          required
                          className={`w-full bg-white/10 border rounded-lg py-2.5 px-4 text-white focus:outline-none focus:ring-2 transition-all ${
                            formErrors.org_id
                              ? "border-red-500/50 focus:ring-red-400 focus:border-red-400"
                              : "border-white/20 focus:ring-white/30 focus:border-white/30"
                          }`}
                          value={formData.org_id}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              org_id: e.target.value,
                            });
                            if (formErrors.org_id) {
                              setFormErrors({ ...formErrors, org_id: "" });
                            }
                          }}
                        >
                          <option value="">Select Organization</option>
                          {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.org_id && (
                          <p className="text-xs text-red-400 mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {formErrors.org_id}
                          </p>
                        )}
                      </div>
                    )}
                    {!isSuperAdmin && (
                      <div>
                        <label className="block text-sm font-semibold text-white mb-1.5">
                          Organization
                        </label>
                        <div className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 px-4 text-white/70">
                          {organizations.find(
                            (org) => org.id === currentUser?.organization_id
                          )?.name || "Your Organization"}
                        </div>
                        <p className="text-xs text-white/60 mt-1">
                          Users will be created in your organization
                          automatically
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="px-6 py-3 border-t border-white/20 bg-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 border border-blue-500/30 text-white font-medium transition-all duration-200 shadow-lg shadow-blue-500/50"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditModal(false);
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
                onClick={() => setShowEditModal(false)}
              ></div>
              <div
                className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleEditUser}>
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white">
                        Edit User
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditModal(false);
                          setSelectedUser(null);
                        }}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <Shield className="w-4 h-4 inline mr-2" />
                          Role
                        </label>
                        <select
                          required
                          className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          value={formData.role}
                          onChange={(e) =>
                            setFormData({ ...formData, role: e.target.value })
                          }
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-white/10 border-t border-white/20 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setSelectedUser(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDeleteModal(false);
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
                onClick={() => setShowDeleteModal(false)}
              ></div>
              <div
                className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Delete User
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setSelectedUser(null);
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-white/80 mb-4">
                      Are you sure you want to delete user{" "}
                      <span className="font-semibold text-white">
                        {selectedUser.name}
                      </span>
                      ?
                    </p>
                    <p className="text-sm text-white/60">
                      This action cannot be undone. All data associated with
                      this user will be permanently deleted.
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/10 border-t border-white/20 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Organization Modal */}
        {showEditOrgModal && selectedOrg && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowEditOrgModal(false);
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
                onClick={() => setShowEditOrgModal(false)}
              ></div>
              <div
                className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <form onSubmit={handleEditOrganization}>
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-white">
                        Edit Organization
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowEditOrgModal(false);
                          setSelectedOrg(null);
                        }}
                        className="text-white/60 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          <Building2 className="w-4 h-4 inline mr-2" />
                          Organization Name
                        </label>
                        <input
                          type="text"
                          required
                          className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                          value={orgFormData.name}
                          onChange={(e) =>
                            setOrgFormData({ name: e.target.value })
                          }
                          placeholder="Enter organization name"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-white/10 border-t border-white/20 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditOrgModal(false);
                        setSelectedOrg(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Update Organization
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Organization Modal */}
        {showDeleteOrgModal && selectedOrg && (
          <div
            className="fixed z-50 inset-0 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowDeleteOrgModal(false);
            }}
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
                onClick={() => setShowDeleteOrgModal(false)}
              ></div>
              <div
                className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Delete Organization
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteOrgModal(false);
                        setSelectedOrg(null);
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mb-6">
                    <p className="text-white/80 mb-4">
                      Are you sure you want to delete organization{" "}
                      <span className="font-semibold text-white">
                        {selectedOrg.name}
                      </span>
                      ?
                    </p>
                    <p className="text-sm text-white/60">
                      This action cannot be undone. The organization must have
                      no users before it can be deleted.
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/10 border-t border-white/20 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteOrgModal(false);
                      setSelectedOrg(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteOrganization}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Organization
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

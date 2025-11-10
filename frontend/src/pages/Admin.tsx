import { useEffect, useState } from "react";
import api from "../lib/api";
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
  RefreshCw,
  X,
  Mail,
  User,
  Lock,
  Shield,
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

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    org_id: "",
  });

  // Notification states
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
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
    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      if (formData.org_id) {
        payload.org_id = formData.org_id;
      }

      await api.post("/admin/users", payload);
      showNotification("success", "User created successfully");
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      showNotification(
        "error",
        error.response?.data?.error || "Failed to create user"
      );
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

  if (loading && !metrics && users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto"></div>
        <p className="mt-4 text-white/70">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg backdrop-blur-xl border ${
            notification.type === "success"
              ? "bg-green-500/20 border-green-500/30 text-green-300"
              : "bg-red-500/20 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-semibold text-white tracking-tight">
            Admin Panel
          </h1>
          <p className="text-white/70 mt-1.5 text-sm">
            System administration and user management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {(!metrics || users.length === 0) && (
            <div className="text-xs text-yellow-400/80 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
              Backend server may need restart
            </div>
          )}
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-xl text-white text-sm font-medium rounded-xl hover:bg-white/15 transition-all border border-white/20"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/20">
        <nav className="-mb-px flex space-x-8">
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
                    <TrendingUp className="h-6 w-6 text-green-400" />
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">All Users</h2>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg overflow-hidden">
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
                            user.role === "admin"
                              ? "text-purple-300 bg-purple-500/20"
                              : "text-white/70 bg-white/10"
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/80">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
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
        </div>
      )}

      {/* Organizations Tab */}
      {activeTab === "organizations" && (
        <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-white mb-4">
              All Organizations
            </h2>
            <div className="overflow-hidden">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div
          className="fixed z-50 inset-0 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            ></div>
            <div
              className="inline-block align-bottom bg-white/10 backdrop-blur-xl rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <form onSubmit={handleCreateUser}>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      Create New User
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
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
                        placeholder="John Doe"
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
                        placeholder="user@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        <Lock className="w-4 h-4 inline mr-2" />
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        placeholder="Minimum 8 characters"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
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

                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">
                        <Building2 className="w-4 h-4 inline mr-2" />
                        Organization (Optional)
                      </label>
                      <select
                        className="block w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                        value={formData.org_id}
                        onChange={(e) =>
                          setFormData({ ...formData, org_id: e.target.value })
                        }
                      >
                        <option value="">None</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-white/10 border-t border-white/20 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white/70 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
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
                    This action cannot be undone. All data associated with this
                    user will be permanently deleted.
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
    </div>
  );
}

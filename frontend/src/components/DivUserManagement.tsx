import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Users } from "lucide-react";
import { divUserService, DivUser } from "../services/divUserService";
import api from "../services/api";
import { useAuthStore } from "../store/authStore";

interface User {
  id: number;
  name: string;
  email: string;
}

const DivUserManagement = () => {
  const { user: currentUser } = useAuthStore();
  const [divUsers, setDivUsers] = useState<DivUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivUser, setEditingDivUser] = useState<DivUser | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    user_id: undefined as number | undefined,
  });

  useEffect(() => {
    fetchDivUsers();
    fetchUsers();
  }, []);

  const fetchDivUsers = async () => {
    try {
      setLoading(true);
      const data = await divUserService.getAllDivUsers();
      setDivUsers(data);
    } catch (error) {
      console.error("Failed to fetch DivUsers:", error);
      alert("Failed to fetch DivUsers");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleOpenModal = (divUser?: DivUser) => {
    if (divUser) {
      setEditingDivUser(divUser);
      setFormData({
        name: divUser.name,
        user_id: divUser.user_id,
      });
    } else {
      setEditingDivUser(null);
      setFormData({
        name: "",
        user_id: undefined,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDivUser(null);
    setFormData({
      name: "",
      user_id: undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingDivUser) {
        await divUserService.updateDivUser(editingDivUser.id, formData);
        alert("DivUser updated successfully!");
      } else {
        if (formData.user_id === undefined) {
          alert("Please select a user for this DivUser.");
          return;
        }
        await divUserService.createDivUser(formData as { name: string; user_id: number });
        alert("DivUser created successfully!");
      }
      handleCloseModal();
      fetchDivUsers();
    } catch (error) {
      console.error("Failed to save DivUser:", error);
      alert("Failed to save DivUser");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this DivUser?")) return;

    try {
      await divUserService.deleteDivUser(id);
      alert("DivUser deleted successfully!");
      fetchDivUsers();
    } catch (error: any) {
      console.error("Failed to delete DivUser:", error);
      alert(error.response?.data?.error || "Failed to delete DivUser");
    }
  };

  const canManage =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            DivUser Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage non-login users for task assignment
          </p>
        </div>
        {canManage && (
          <button onClick={() => handleOpenModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add DivUser
          </button>
        )}
      </div>

      {/* DivUsers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Div
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created At
              </th>
              {canManage && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {divUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 4 : 3}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No DivUsers found</p>
                </td>
              </tr>
            ) : (
              divUsers.map((divUser) => (
                <tr key={divUser.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {divUser.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {divUser.linked_user_name ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {divUser.linked_user_name}
                        </div>
                        <div className="text-gray-500">
                          {divUser.linked_user_email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(divUser.created_at).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(divUser)}
                          className="text-primary hover:text-accent p-1 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(divUser.id)}
                          className="text-danger hover:text-red-700 p-1 rounded"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDivUser ? "Edit DDG" : "Add DDG"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="form-group">
                <label className="form-label">
                  Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full"
                  placeholder="Enter name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Div <span className="text-danger">*</span>
                </label>
                <select
                  value={formData.user_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      user_id: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  required
                  className="w-full"
                >
                  <option value="">Select a Div</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDivUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DivUserManagement;

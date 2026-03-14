"use client";

import { useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/axios";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/sa/users");
      if (response.data.success) {
        setUsers(response.data.data.users);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUserRole = async (userId, role) => {
    try {
      const response = await apiClient.patch(`/sa/users/${userId}/role`, {
        role,
      });
      if (response.data.success) {
        await fetchUsers(); // Refresh users list
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update role",
      };
    }
  };

  const suspendUser = async (userId, data) => {
    try {
      const response = await apiClient.post(
        `/sa/users/${userId}/suspend`,
        data,
      );
      if (response.data.success) {
        await fetchUsers();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to suspend user",
      };
    }
  };

  const unsuspendUser = async (userId) => {
    try {
      const response = await apiClient.post(`/sa/users/${userId}/unsuspend`);
      if (response.data.success) {
        await fetchUsers();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to unsuspend user",
      };
    }
  };

  const revokeUser = async (userId, reason) => {
    try {
      const response = await apiClient.post(`/sa/users/${userId}/revoke`, {
        reason,
      });
      if (response.data.success) {
        await fetchUsers();
        return { success: true };
      }
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || "Failed to revoke user",
      };
    }
  };

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    updateUserRole,
    suspendUser,
    unsuspendUser,
    revokeUser,
  };
}

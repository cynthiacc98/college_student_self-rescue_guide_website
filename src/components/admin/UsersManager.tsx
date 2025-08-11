"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface User {
  _id: string;
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
  emailVerified?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
}

interface UsersManagerProps {
  initialUsers: User[];
}

export default function UsersManager({ initialUsers }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_status" }),
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, isActive: !currentStatus }
            : user
        ));
        toast.success(currentStatus ? "用户已禁用" : "用户已启用");
      } else {
        const error = await response.json();
        toast.error(error.error || "操作失败");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      toast.error("网络错误");
    } finally {
      setLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
    setLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_role", role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(user => 
          user._id === userId 
            ? { ...user, role: newRole }
            : user
        ));
        toast.success("角色已更新");
      } else {
        const error = await response.json();
        toast.error(error.error || "操作失败");
      }
    } catch (err) {
      console.error("Role change error:", err);
      toast.error("网络错误");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("确定要删除这个用户吗？此操作不可撤销。")) {
      return;
    }

    setLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter(user => user._id !== userId));
        toast.success("用户已删除");
      } else {
        const error = await response.json();
        toast.error(error.error || "删除失败");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      toast.error("网络错误");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">用户</th>
            <th className="text-left p-4 font-medium">角色</th>
            <th className="text-left p-4 font-medium">状态</th>
            <th className="text-left p-4 font-medium">注册时间</th>
            <th className="text-left p-4 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="border-b">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{user.name || '未设置'}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value as "USER" | "ADMIN")}
                  disabled={loading === user._id}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="USER">普通用户</option>
                  <option value="ADMIN">管理员</option>
                </select>
              </td>
              <td className="p-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.isActive !== false 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive !== false ? '正常' : '已禁用'}
                </span>
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '未知'}
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  {user.role !== 'ADMIN' && (
                    <>
                      <button 
                        onClick={() => handleToggleStatus(user._id, user.isActive !== false)}
                        disabled={loading === user._id}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {user.isActive !== false ? '禁用' : '启用'}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user._id)}
                        disabled={loading === user._id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </>
                  )}
                  {loading === user._id && (
                    <span className="text-xs text-muted-foreground">处理中...</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

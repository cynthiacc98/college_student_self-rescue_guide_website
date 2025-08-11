"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Mail, 
  Calendar, 
  Edit, 
  Trash2, 
  UserPlus,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserData {
  id: string;
  name: string;
  email: string;
  roles: Array<{ name: string; displayName: string }>;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export default function SimpleUsersManager() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('获取用户失败');
      const result = await response.json();
      setUsers(result.data);
    } catch (error) {
      toast.error('获取用户数据失败');
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsers = async (userIds: string[]) => {
    if (!confirm(`确定要删除 ${userIds.length} 个用户吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });

      if (!response.ok) throw new Error('删除用户失败');

      toast.success(`成功删除 ${userIds.length} 个用户`);
      fetchUsers();
      setSelectedUsers(new Set());
    } catch (error) {
      toast.error('删除用户失败');
      console.error('Delete users error:', error);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) throw new Error('更新用户状态失败');

      toast.success(`用户状态已${!isActive ? '激活' : '禁用'}`);
      fetchUsers();
    } catch (error) {
      toast.error('更新用户状态失败');
      console.error('Toggle user status error:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  if (loading) {
    return (
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/10 rounded-xl"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            用户管理
          </h1>
          <p className="text-white/60 mt-1">管理系统用户、角色分配和权限控制</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            新增用户
          </button>
        </div>
      </div>

      {/* 搜索和批量操作 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="搜索用户名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>
          
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">
                已选择 {selectedUsers.size} 项
              </span>
              <button
                onClick={() => handleDeleteUsers(Array.from(selectedUsers))}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除选中
              </button>
            </div>
          )}
        </div>

        {/* 用户表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                </th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">用户</th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">角色</th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">状态</th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">最后登录</th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">注册时间</th>
                <th className="text-left p-4 text-sm font-semibold text-white/80">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    selectedUsers.has(user.id) ? 'bg-purple-500/10' : ''
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                      className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-sm text-white/60">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <span 
                            key={role.name}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full"
                          >
                            <Shield className="w-3 h-3 mr-1" />
                            {role.displayName}
                          </span>
                        ))
                      ) : (
                        <span className="text-white/50 text-sm">暂无角色</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-all ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                          : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <Eye className="w-3 h-3 mr-1" />
                          正常
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3 mr-1" />
                          禁用
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white/70">
                      {user.lastLogin ? (
                        new Date(user.lastLogin).toLocaleString('zh-CN')
                      ) : (
                        '从未登录'
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white/70">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                        title="管理角色"
                      >
                        <Shield className="w-4 h-4 text-white/60 group-hover:text-white" />
                      </button>
                      <button
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                        title="编辑用户"
                      >
                        <Edit className="w-4 h-4 text-white/60 group-hover:text-white" />
                      </button>
                      <button
                        onClick={() => handleDeleteUsers([user.id])}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="删除用户"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/60 mb-2">暂无用户数据</p>
              <p className="text-white/40 text-sm">
                {searchTerm ? '尝试调整搜索条件' : '还没有用户注册'}
              </p>
            </motion.div>
          )}
        </div>

        {/* 分页信息 */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <span className="text-sm text-white/60">
              显示 {filteredUsers.length} 个用户
            </span>
            <div className="text-sm text-white/60">
              共 {users.length} 个注册用户
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
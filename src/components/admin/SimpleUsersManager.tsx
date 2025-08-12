"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  EyeOff,
  Sparkles,
  Heart,
  Star,
  Zap,
  CheckCircle,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import CreateUserDialog from './CreateUserDialog';

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
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [managingRolesUser, setManagingRolesUser] = useState<UserData | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Array<{id: string, name: string, displayName: string}>>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [celebratingUser, setCelebratingUser] = useState<string | null>(null);
  const [statusChangingUser, setStatusChangingUser] = useState<string | null>(null);
  const [newUserCreated, setNewUserCreated] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // 添加缓存禁用参数，确保每次都获取最新数据
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
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

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles');
      if (!response.ok) throw new Error('获取角色失败');
      const result = await response.json();
      setAvailableRoles(result.data || []);
    } catch (error) {
      console.error('Fetch roles error:', error);
    }
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
  };

  const handleSaveUser = async (userData: {name: string, email: string, isActive: boolean}) => {
    if (!editingUser) return;
    
    try {
      // 更新用户名
      if (userData.name !== editingUser.name) {
        const nameResponse = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_profile', name: userData.name })
        });
        if (!nameResponse.ok) throw new Error('更新用户名失败');
      }

      // 更新状态
      if (userData.isActive !== editingUser.isActive) {
        const statusResponse = await fetch(`/api/admin/users/${editingUser.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: userData.isActive })
        });
        if (!statusResponse.ok) throw new Error('更新状态失败');
      }

      toast.success('✅ 用户信息更新成功', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #10b981, #065f46)',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px'
        }
      });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('更新用户失败');
      console.error('Update user error:', error);
    }
  };

  const handleManageRoles = (user: UserData) => {
    setManagingRolesUser(user);
  };

  const handleUpdateRoles = async (roleIds: string[]) => {
    if (!managingRolesUser) return;
    
    try {
      const response = await fetch(`/api/admin/users/${managingRolesUser.id}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleIds })
      });

      if (!response.ok) throw new Error('更新角色失败');

      toast.success('🛡️ 角色权限更新成功', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px'
        }
      });
      setManagingRolesUser(null);
      fetchUsers();
    } catch (error) {
      toast.error('更新角色失败');
      console.error('Update roles error:', error);
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
      setStatusChangingUser(userId);
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) throw new Error('更新用户状态失败');

      // 状态切换成功的愉悦反馈
      const statusText = !isActive ? '激活' : '禁用';
      const emoji = !isActive ? '✨' : '💤';
      toast.success(`${emoji} 用户状态已${statusText}`, {
        duration: 3000,
        style: {
          background: !isActive ? 'linear-gradient(135deg, #10b981, #065f46)' : 'linear-gradient(135deg, #6b7280, #374151)',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px'
        }
      });
      
      // 为激活操作添加庆祝效果
      if (!isActive) {
        setCelebratingUser(userId);
        setTimeout(() => setCelebratingUser(null), 2000);
      }
      
      fetchUsers();
    } catch (error) {
      toast.error('更新用户状态失败');
      console.error('Toggle user status error:', error);
    } finally {
      setStatusChangingUser(null);
    }
  };

  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    password: string;
    isActive: boolean;
    roleIds: string[];
  }) => {
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || '创建用户失败');
      }

      // 用户创建成功的庆祝反馈
      toast.success('🎉 恭喜！新用户创建成功', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
          fontWeight: '600'
        }
      });
      
      setNewUserCreated(true);
      setTimeout(() => setNewUserCreated(false), 3000);
      
      setShowCreateDialog(false);
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建用户失败');
      console.error('Create user error:', error);
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
        <div className="flex items-center gap-3 relative">
          {newUserCreated && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute -top-8 right-0 flex items-center gap-1 text-yellow-400"
            >
              <Sparkles className="w-5 h-5" />
              <Star className="w-4 h-4" />
              <Sparkles className="w-5 h-5" />
            </motion.div>
          )}
          <motion.button 
            onClick={() => setShowCreateDialog(true)}
            whileHover={{ 
              scale: 1.02, 
              boxShadow: "0 20px 25px -5px rgba(139, 92, 246, 0.3), 0 10px 10px -5px rgba(139, 92, 246, 0.04)"
            }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2 relative overflow-hidden"
          >
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <UserPlus className="w-4 h-4" />
            </motion.div>
            新增用户
          </motion.button>
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
              <motion.button
                onClick={() => handleDeleteUsers(Array.from(selectedUsers))}
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(239, 68, 68, 0.3)",
                  boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)"
                }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all flex items-center gap-2"
              >
                <motion.div
                  whileHover={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.div>
                删除选中
              </motion.button>
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
                    <motion.button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={statusChangingUser === user.id}
                      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-all relative overflow-hidden ${
                        user.isActive 
                          ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:shadow-lg hover:shadow-green-500/25' 
                          : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:shadow-lg hover:shadow-red-500/25'
                      } ${
                        statusChangingUser === user.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {statusChangingUser === user.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 mr-1"
                        >
                          <Zap className="w-3 h-3" />
                        </motion.div>
                      ) : user.isActive ? (
                        <motion.div
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.3 }}
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                        </motion.div>
                      )}
                      {statusChangingUser === user.id ? '处理中...' : user.isActive ? '正常' : '禁用'}
                      
                      {/* 庆祝特效 */}
                      <AnimatePresence>
                        {celebratingUser === user.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <motion.div
                              animate={{ 
                                rotate: [0, 360],
                                scale: [1, 1.2, 1]
                              }}
                              transition={{ 
                                duration: 0.6, 
                                repeat: 2,
                                ease: "easeInOut"
                              }}
                              className="text-yellow-400"
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
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
                      <motion.button
                        onClick={() => handleManageRoles(user)}
                        whileHover={{ 
                          scale: 1.1, 
                          backgroundColor: "rgba(139, 92, 246, 0.2)",
                          boxShadow: "0 0 20px rgba(139, 92, 246, 0.3)"
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                        title="管理角色"
                      >
                        <motion.div
                          whileHover={{ rotate: [0, -15, 15, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <Shield className="w-4 h-4 text-white/60 group-hover:text-purple-400" />
                        </motion.div>
                      </motion.button>
                      <motion.button
                        onClick={() => handleEditUser(user)}
                        whileHover={{ 
                          scale: 1.1, 
                          backgroundColor: "rgba(34, 197, 94, 0.2)",
                          boxShadow: "0 0 20px rgba(34, 197, 94, 0.3)"
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all group"
                        title="编辑用户"
                      >
                        <motion.div
                          whileHover={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 0.3 }}
                        >
                          <Edit className="w-4 h-4 text-white/60 group-hover:text-green-400" />
                        </motion.div>
                      </motion.button>
                      <motion.button
                        onClick={() => handleDeleteUsers([user.id])}
                        whileHover={{ 
                          scale: 1.1,
                          backgroundColor: "rgba(239, 68, 68, 0.3)",
                          boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)"
                        }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="删除用户"
                      >
                        <motion.div
                          whileHover={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
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

      {/* 编辑用户对话框 */}
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* 管理角色对话框 */}
      {managingRolesUser && (
        <ManageRolesDialog
          user={managingRolesUser}
          availableRoles={availableRoles}
          onSave={handleUpdateRoles}
          onClose={() => setManagingRolesUser(null)}
        />
      )}

      {/* 创建用户对话框 */}
      {showCreateDialog && (
        <CreateUserDialog
          availableRoles={availableRoles}
          onSave={handleCreateUser}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}

// 编辑用户对话框组件
function EditUserDialog({ 
  user, 
  onSave, 
  onClose 
}: { 
  user: UserData; 
  onSave: (userData: {name: string, email: string, isActive: boolean}) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    isActive: user.isActive
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">编辑用户</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              邮箱
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
            />
            <label htmlFor="isActive" className="text-sm text-white/80">
              账户激活
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// 管理角色对话框组件
function ManageRolesDialog({ 
  user, 
  availableRoles, 
  onSave, 
  onClose 
}: { 
  user: UserData; 
  availableRoles: Array<{id: string, name: string, displayName: string}>;
  onSave: (roleIds: string[]) => void;
  onClose: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(
    new Set(user.roles.map(role => role.name))
  );

  const handleRoleToggle = (roleId: string) => {
    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId);
    } else {
      newSelected.add(roleId);
    }
    setSelectedRoles(newSelected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(Array.from(selectedRoles));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">管理角色</h3>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-white/80">用户: <span className="text-white font-medium">{user.name}</span></p>
          <p className="text-white/60 text-sm">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">
              可用角色
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableRoles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.has(role.id)}
                    onChange={() => handleRoleToggle(role.id)}
                    className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <div className="text-white font-medium">{role.displayName}</div>
                    <div className="text-white/60 text-sm">{role.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
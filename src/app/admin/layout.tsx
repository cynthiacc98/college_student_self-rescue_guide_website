"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Grid3X3, 
  Users, 
  Settings, 
  BarChart3,
  ChevronRight,
  Sparkles,
  Shield
} from "lucide-react";
import { ReactNode, useState } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const sidebarItems = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard, exact: true },
  { href: "/admin/resources", label: "资源管理", icon: BookOpen },
  { href: "/admin/categories", label: "分类管理", icon: Grid3X3 },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/10 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed left-0 top-0 bottom-0 z-40 bg-black/40 backdrop-blur-2xl border-r border-white/10"
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <motion.div
                className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 p-[2px]"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-full h-full rounded-[14px] bg-black/50 backdrop-blur-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-lg font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                      管理中心
                    </div>
                    <div className="text-xs text-foreground-subtle">
                      Admin Dashboard
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative block"
                >
                  <motion.div
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isActive 
                        ? "text-white" 
                        : "text-white/60 hover:text-white hover:bg-white/5"
                      }
                    `}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="admin-nav-indicator"
                        className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    <Icon className="w-5 h-5 relative z-10 shrink-0" />
                    
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="relative z-10 font-medium"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    
                    {isActive && !isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-auto"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute bottom-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </button>
        </motion.aside>

        {/* Main Content */}
        <motion.main
          initial={false}
          animate={{ marginLeft: isCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 min-h-screen"
        >
          {/* Top Bar */}
          <div className="sticky top-0 z-30 bg-black/20 backdrop-blur-xl border-b border-white/10">
            <div className="px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {sidebarItems.find(item => 
                      item.exact ? pathname === item.href : pathname.startsWith(item.href)
                    )?.label || "管理后台"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-foreground-subtle">
                      管理后台系统 v2.0
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-foreground-subtle">
                    {new Date().toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </div>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm"
                  >
                    返回前台
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

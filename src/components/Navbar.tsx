"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { FormEvent, useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Search, LogOut, User, Sparkles, Menu, X, Home, BookOpen, Grid3X3, Shield, Palette, Heart } from "lucide-react";

interface NavbarProps {
  siteName: string;
}

export default function Navbar({ siteName }: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [0, 100], [0, -5]);
  const headerBlur = useTransform(scrollY, [0, 50, 200], ["blur(20px) saturate(180%)", "blur(30px) saturate(180%)", "blur(40px) saturate(180%)"]);
  const headerOpacity = useTransform(scrollY, [0, 50, 200], [0.7, 0.95, 0.98]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  const borderOpacity = useTransform(scrollY, [0, 50, 200], [0.2, 0.4, 0.6]);
  const shadowIntensity = useTransform(scrollY, [0, 100], [0, 0.3]);
  const headerRef = useRef<HTMLDivElement>(null);

  const palettes: Array<[string, string, string, string]> = [
    ["#00C2FF", "#18FF92", "#8B5CF6", "#FF66C4"],
    ["#FF8A00", "#FF3D54", "#5B5FFF", "#00E1FF"],
    ["#22D3EE", "#A78BFA", "#F472B6", "#34D399"],
  ];
  const [paletteIdx, setPaletteIdx] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const cached = window.localStorage.getItem("hero_palette_idx");
    return cached ? Number(cached) : 0;
  });

  // 应用品牌变量
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const pal = palettes[paletteIdx % palettes.length];
    root.style.setProperty("--brand-c1", pal[0]);
    root.style.setProperty("--brand-c2", pal[1]);
    root.style.setProperty("--brand-c3", pal[2]);
    root.style.setProperty("--brand-c4", pal[3]);
    window.localStorage.setItem("hero_palette_idx", String(paletteIdx));
  }, [paletteIdx]);

  // 设置 CSS 变量 --nav-h 为导航高度
  useEffect(() => {
    const updateNavHeight = () => {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--nav-h", `${h}px`);
      }
    };
    updateNavHeight();
    window.addEventListener("resize", updateNavHeight);
    return () => window.removeEventListener("resize", updateNavHeight);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  };

  const getNavItems = () => {
    const baseItems = [
      { href: "/", label: "首页", icon: Home },
      { href: "/resources", label: "资料库", icon: BookOpen },
      { href: "/categories", label: "分类", icon: Grid3X3 },
    ];
    
    // 只有已登录用户才显示收藏页面
    if (session) {
      baseItems.push({ href: "/favorites", label: "我的收藏", icon: Heart });
    }
    
    return baseItems;
  };
  
  const navItems = getNavItems();

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-[100]">
        <motion.header
          style={{ 
            y: headerY,
            scale: headerScale
          }}
          className="border-b border-white/5 relative overflow-hidden"
        >
          {/* 增强毛玻璃背景 */}
          <motion.div
            className="absolute inset-0"
            style={{ 
              background: `linear-gradient(135deg, 
                rgba(0, 0, 0, 0.85) 0%, 
                rgba(20, 25, 40, 0.9) 50%, 
                rgba(0, 0, 0, 0.85) 100%)`,
              backdropFilter: headerBlur,
              webkitBackdropFilter: headerBlur,
              opacity: headerOpacity
            }}
          />
          
          {/* 动态边框渐变 */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-px brand-gradient pointer-events-none"
            style={{ opacity: borderOpacity }}
          />
          
          {/* 顶部光效 */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
            style={{ opacity: borderOpacity }}
          />
          
          {/* 动态阴影 */}
          <motion.div
            className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-black/20 to-transparent blur-sm"
            style={{ opacity: shadowIntensity }}
          />
          
          <nav className="relative container-fluid py-5">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <Link href="/" className="group flex items-center gap-3 shrink-0">
                <motion.div
                  className="relative w-12 h-12 rounded-xl brand-gradient p-[2px]"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-full h-full rounded-[12px] bg-black/50 backdrop-blur-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-xl brand-gradient blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                </motion.div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {siteName}
                  </div>
                  <div className="text-xs text-foreground-subtle">
                    学习资料分享平台
                  </div>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative px-5 py-3 rounded-xl transition-all group text-white/70 hover:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className={isActive ? "text-white" : ""}>
                          {item.label}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-3 right-3 h-[2px] brand-gradient opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition duration-300 origin-left rounded-full" />
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 bg-white/10 rounded-xl -z-10"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Search + Palette + User */}
              <div className="flex items-center gap-2">
                <div className="flex-1 max-w-md hidden md:block">
                  <form onSubmit={handleSearch} className="relative group">
                    {/* 增强光晕效果 */}
                    <motion.div 
                      className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
                      animate={{
                        background: isSearchFocused ? 
                          `conic-gradient(from 0deg, ${palettes[paletteIdx][0]}40, ${palettes[paletteIdx][1]}40, ${palettes[paletteIdx][2]}40, ${palettes[paletteIdx][3]}40, ${palettes[paletteIdx][0]}40)` :
                          'transparent',
                        scale: isSearchFocused ? 1.15 : 1,
                        opacity: isSearchFocused ? 1 : 0
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    />
                    
                    <motion.div 
                      className="relative flex items-center overflow-hidden rounded-2xl"
                      animate={{
                        scale: isSearchFocused ? 1.02 : 1
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                      {/* 背景效果 */}
                      <motion.div
                        className="absolute inset-0 backdrop-blur-xl border rounded-2xl"
                        animate={{
                          background: isSearchFocused ? 
                            'rgba(255, 255, 255, 0.15)' : 
                            'rgba(255, 255, 255, 0.08)',
                          borderColor: isSearchFocused ?
                            'rgba(255, 255, 255, 0.3)' :
                            'rgba(255, 255, 255, 0.1)'
                        }}
                        transition={{ duration: 0.2 }}
                      />
                      
                      {/* 输入框 */}
                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        placeholder="搜索学习资料..."
                        className="w-full pl-12 pr-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none relative z-10"
                        autoComplete="search"
                      />
                      
                      {/* 搜索图标 */}
                      <motion.div
                        className="absolute left-4 z-10"
                        animate={{
                          scale: isSearchFocused ? 1.1 : 1,
                          color: isSearchFocused ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <Search className="w-5 h-5" />
                      </motion.div>
                      
                      {/* 动态搜索按钮 */}
                      <AnimatePresence>
                        {searchQuery && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, x: 20 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="submit"
                            className="absolute right-2 px-4 py-1.5 brand-gradient text-white text-sm font-medium rounded-xl shadow-lg z-10 transition-all hover:shadow-xl"
                          >
                            搜索
                          </motion.button>
                        )}
                      </AnimatePresence>
                      
                      {/* 聚焦时的波纹效果 */}
                      <AnimatePresence>
                        {isSearchFocused && (
                          <motion.div
                            className="absolute inset-0 rounded-2xl border border-white/30 pointer-events-none"
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{ scale: 1.1, opacity: 1 }}
                            exit={{ scale: 1, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </form>
                </div>

                {/* Palette Switcher */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPaletteIdx((p) => (p + 1) % palettes.length)}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/80"
                  title="更换配色"
                  aria-label="更换配色"
                >
                  <Palette className="w-4 h-4" />
                  <span className="text-xs">更换配色</span>
                </motion.button>

                {session ? (
                  <>
                    {session.user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group"
                      >
                        <Shield className="w-4 h-4 text-white/80" />
                        <span className="text-sm font-medium text-white/90">管理后台</span>
                      </Link>
                    )}
                    <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl">
                      <div className="w-8 h-8 rounded-full brand-gradient flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/90">
                        {session.user?.email?.split("@")[0]}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => signOut()}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">退出</span>
                    </motion.button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="hidden sm:flex items-center gap-2 px-5 py-2.5 brand-gradient text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <User className="w-4 h-4" />
                    登录
                  </Link>
                )}

                {/* Mobile Menu Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </nav>
        </motion.header>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-2xl border-l border-white/10 z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">菜单</div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Palette switcher mobile */}
                <button
                  onClick={() => setPaletteIdx((p) => (p + 1) % palettes.length)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/90"
                >
                  <Palette className="w-5 h-5" /> 更换配色
                </button>

                {/* Mobile Search */}
                <form onSubmit={handleSearch}>
                  <div className="relative mt-2">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索学习资料..."
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  </div>
                </form>

                {/* Mobile Nav Items */}
                <div className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile User Section */}
                {session ? (
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full brand-gradient flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{session.user?.email?.split("@")[0]}</div>
                          <div className="text-xs text-white/50">{session.user?.email}</div>
                        </div>
                      </div>
                    </div>
                    {session.user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl"
                      >
                        <Shield className="w-5 h-5 text-white/80" />
                        <span>管理后台</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>退出登录</span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 brand-gradient text-white rounded-xl font-medium"
                  >
                    <User className="w-4 h-4" />
                    登录
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

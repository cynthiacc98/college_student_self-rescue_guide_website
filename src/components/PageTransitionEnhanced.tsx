"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PageTransitionEnhancedProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransitionEnhanced({ 
  children, 
  className = '' 
}: PageTransitionEnhancedProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [pathname]);

  // 不同路由的专属过渡效果
  const getTransitionVariant = (path: string) => {
    if (path === '/') return 'home';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/resources')) return 'resource';
    if (path.startsWith('/categories')) return 'category';
    return 'default';
  };

  const transitionVariants = {
    home: {
      initial: { 
        opacity: 0,
        scale: 0.95,
        rotateX: -10,
        y: 50
      },
      animate: { 
        opacity: 1,
        scale: 1,
        rotateX: 0,
        y: 0,
        transition: {
          duration: 0.8,
          ease: [0.25, 0.46, 0.45, 0.94],
          staggerChildren: 0.1
        }
      },
      exit: { 
        opacity: 0,
        scale: 1.05,
        rotateX: 10,
        y: -50,
        transition: { duration: 0.4 }
      }
    },
    admin: {
      initial: { 
        opacity: 0,
        x: -100,
        skewX: -5
      },
      animate: { 
        opacity: 1,
        x: 0,
        skewX: 0,
        transition: {
          duration: 0.6,
          type: "spring",
          stiffness: 100,
          damping: 20
        }
      },
      exit: { 
        opacity: 0,
        x: 100,
        skewX: 5,
        transition: { duration: 0.3 }
      }
    },
    resource: {
      initial: { 
        opacity: 0,
        y: 100,
        rotateY: -15
      },
      animate: { 
        opacity: 1,
        y: 0,
        rotateY: 0,
        transition: {
          duration: 0.7,
          type: "spring",
          stiffness: 120,
          damping: 25
        }
      },
      exit: { 
        opacity: 0,
        y: -100,
        rotateY: 15,
        transition: { duration: 0.4 }
      }
    },
    category: {
      initial: { 
        opacity: 0,
        scale: 0.8,
        rotate: -5
      },
      animate: { 
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
          duration: 0.6,
          type: "spring",
          stiffness: 150,
          damping: 30
        }
      },
      exit: { 
        opacity: 0,
        scale: 1.2,
        rotate: 5,
        transition: { duration: 0.3 }
      }
    },
    default: {
      initial: { 
        opacity: 0,
        y: 20
      },
      animate: { 
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
      },
      exit: { 
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 }
      }
    }
  };

  const currentVariant = getTransitionVariant(pathname);
  const variant = transitionVariants[currentVariant as keyof typeof transitionVariants];

  return (
    <>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="relative"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full" />
              <motion.div
                className="absolute inset-0 border-4 border-transparent border-b-pink-500 border-l-cyan-500 rounded-full"
                animate={{ rotate: -360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
            
            {/* Loading Text */}
            <motion.div
              className="absolute mt-24 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-white font-medium mb-2">加载中...</div>
              <motion.div
                className="h-1 w-32 bg-gray-700 rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    repeatType: "loop",
                    ease: "easeInOut"
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className={`${className}`}
          variants={variant}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformOrigin: 'center center' }}
        >
          {/* Page Background Effects */}
          <motion.div
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {currentVariant === 'admin' && (
              <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-orange-900/20" />
            )}
            {currentVariant === 'resource' && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
            )}
            {currentVariant === 'category' && (
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-teal-900/20" />
            )}
            {currentVariant === 'home' && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20"
                animate={{
                  background: [
                    'radial-gradient(600px at 20% 30%, rgba(99, 102, 241, 0.15), transparent 40%)',
                    'radial-gradient(600px at 80% 70%, rgba(236, 72, 153, 0.15), transparent 40%)',
                    'radial-gradient(600px at 20% 30%, rgba(99, 102, 241, 0.15), transparent 40%)'
                  ]
                }}
                transition={{ duration: 6, repeat: Infinity }}
              />
            )}
          </motion.div>

          {/* Content with Stagger Animation */}
          <motion.div
            variants={{
              animate: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2
                }
              }
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Transition Particles */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  y: [0, -100]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeOut"
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
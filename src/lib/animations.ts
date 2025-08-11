import { Variants, Transition } from "framer-motion";

// Spring Configurations
export const springConfig = {
  gentle: { type: "spring", stiffness: 100, damping: 15 } as const,
  bouncy: { type: "spring", stiffness: 400, damping: 25 } as const,
  smooth: { type: "spring", stiffness: 280, damping: 30 } as const,
  elastic: { type: "spring", stiffness: 500, damping: 20 } as const,
  stiff: { type: "spring", stiffness: 700, damping: 35 } as const,
} satisfies Record<string, Transition>;

// Page Transition Variants
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  },
};

// Card Hover Variants
export const cardVariants: Variants = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    boxShadow: "var(--shadow-md)",
  },
  hover: {
    scale: 1.02,
    rotateX: -5,
    rotateY: 5,
    boxShadow: "var(--shadow-xl)",
    transition: springConfig.smooth,
  },
  tap: {
    scale: 0.98,
    transition: springConfig.bouncy,
  },
};

// Stagger Children Animation
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig.smooth,
  },
};

// Floating Animation
export const floatVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Glow Pulse Animation
export const glowVariants: Variants = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(99, 102, 241, 0.3)",
      "0 0 40px rgba(99, 102, 241, 0.5)",
      "0 0 20px rgba(99, 102, 241, 0.3)",
    ],
    transition: {
      duration: 2,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

// Text Reveal Animation
export const textRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    clipPath: "inset(100% 0% 0% 0%)",
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Parallax Scroll Effect
export const parallaxVariants = (offset: number = 50): Variants => ({
  initial: {
    y: -offset,
  },
  animate: {
    y: offset,
    transition: {
      duration: 0,
    },
  },
});

// 3D Card Tilt
export const calculate3DTransform = (
  x: number,
  y: number,
  rect: DOMRect,
  intensity: number = 10
) => {
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * intensity;
  const rotateY = ((centerX - x) / centerX) * intensity;
  
  return {
    rotateX,
    rotateY,
    transformPerspective: 1000,
  };
};

// Magnetic Button Effect
export const magneticVariants: Variants = {
  rest: {
    x: 0,
    y: 0,
  },
};

export const calculateMagneticTransform = (
  x: number,
  y: number,
  rect: DOMRect,
  strength: number = 0.3
) => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const distanceX = (x - centerX) * strength;
  const distanceY = (y - centerY) * strength;
  
  return { x: distanceX, y: distanceY };
};

// Morphing Shape Animation
export const morphVariants: Variants = {
  initial: {
    borderRadius: "20px",
    rotate: 0,
  },
  animate: {
    borderRadius: ["20px", "40px", "20px"],
    rotate: [0, 180, 360],
    transition: {
      duration: 8,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

// Liquid Fill Animation
export const liquidFillVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 2,
        ease: "easeInOut",
      },
      opacity: {
        duration: 0.5,
      },
    },
  },
};

// Typewriter Effect
export const typewriterVariants = (_text: string): Variants => ({
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
});

export const letterVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig.gentle,
  },
};

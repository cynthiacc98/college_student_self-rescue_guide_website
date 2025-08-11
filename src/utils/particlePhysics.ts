/**
 * 高性能粒子物理引擎
 * 支持GPU加速和Web Workers优化
 */

export interface Vector2D {
  x: number;
  y: number;
}

export interface Particle {
  id: number;
  position: Vector2D;
  velocity: Vector2D;
  acceleration: Vector2D;
  originalPosition: Vector2D;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: string;
  mass: number;
  isBookParticle: boolean;
  bookTargetPosition?: Vector2D;
  animationPhase: 'converging' | 'stable' | 'dispersing';
}

export interface ForceField {
  position: Vector2D;
  strength: number;
  radius: number;
  type: 'attract' | 'repel';
}

export class ParticlePhysics {
  private particles: Particle[] = [];
  private forceFields: ForceField[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private bookShape: Vector2D[] = [];
  
  constructor() {
    this.generateBookShape();
  }

  /**
   * 生成书本3D形状的目标位置
   */
  private generateBookShape(): void {
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 400;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 300;
    const bookWidth = 200;
    const bookHeight = 140;
    // const bookDepth = 30; // 留作未来使用
    
    this.bookShape = [];
    
    // 书本轮廓 - 左页
    for (let i = 0; i <= 50; i++) {
      const angle = (i / 50) * Math.PI;
      const x = centerX - bookWidth/4 + Math.cos(angle) * bookWidth/4;
      const y = centerY + Math.sin(angle) * bookHeight/2;
      this.bookShape.push({ x, y });
    }
    
    // 书本轮廓 - 右页
    for (let i = 0; i <= 50; i++) {
      const angle = (i / 50) * Math.PI;
      const x = centerX + bookWidth/4 + Math.cos(angle + Math.PI) * bookWidth/4;
      const y = centerY + Math.sin(angle + Math.PI) * bookHeight/2;
      this.bookShape.push({ x, y });
    }
    
    // 书脊
    for (let i = 0; i <= 20; i++) {
      const y = centerY - bookHeight/2 + (i / 20) * bookHeight;
      this.bookShape.push({ x: centerX, y });
    }
    
    // 添加页面内部细节
    for (let page = 0; page < 8; page++) {
      const offset = page * 3;
      for (let i = 0; i <= 30; i++) {
        const progress = i / 30;
        const x = centerX - bookWidth/3 + progress * (bookWidth * 2/3);
        const y = centerY + Math.sin(progress * Math.PI * 2) * 5 + offset - 12;
        this.bookShape.push({ x, y });
      }
    }
  }

  /**
   * 初始化粒子系统
   */
  public initializeParticles(count: number, canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.particles = [];
    
    const colors = [
      '#00C2FF', '#18FF92', '#8B5CF6', '#FF66C4',
      '#22D3EE', '#A78BFA', '#F472B6', '#34D399'
    ];
    
    for (let i = 0; i < count; i++) {
      const isBookParticle = i < this.bookShape.length;
      const particle: Particle = {
        id: i,
        position: {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height
        },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2
        },
        acceleration: { x: 0, y: 0 },
        originalPosition: { x: 0, y: 0 },
        life: Math.random() * 100,
        maxLife: 100 + Math.random() * 50,
        size: isBookParticle ? 1.5 + Math.random() * 2 : 1 + Math.random() * 1.5,
        opacity: 0.3 + Math.random() * 0.7,
        color: colors[Math.floor(Math.random() * colors.length)],
        mass: 0.5 + Math.random() * 1.5,
        isBookParticle,
        bookTargetPosition: isBookParticle ? this.bookShape[i] : undefined,
        animationPhase: 'converging'
      };
      
      particle.originalPosition = { ...particle.position };
      this.particles.push(particle);
    }
  }

  /**
   * 添加力场（鼠标交互）
   */
  public addForceField(x: number, y: number, strength: number, type: 'attract' | 'repel' = 'repel'): void {
    const field: ForceField = {
      position: { x, y },
      strength,
      radius: 150,
      type
    };
    
    this.forceFields = [field]; // 只保留最新的力场
  }

  /**
   * 清除所有力场
   */
  public clearForceFields(): void {
    this.forceFields = [];
  }

  /**
   * 计算粒子受到的力
   */
  private calculateForces(particle: Particle): Vector2D {
    const totalForce: Vector2D = { x: 0, y: 0 };
    
    // 书本聚合力
    if (particle.isBookParticle && particle.bookTargetPosition && particle.animationPhase === 'converging') {
      const dx = particle.bookTargetPosition.x - particle.position.x;
      const dy = particle.bookTargetPosition.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 5) {
        const convergenceStrength = 0.05;
        totalForce.x += (dx / distance) * convergenceStrength * particle.mass;
        totalForce.y += (dy / distance) * convergenceStrength * particle.mass;
      } else {
        particle.animationPhase = 'stable';
      }
    }
    
    // 稳定状态的微弱摆动
    if (particle.animationPhase === 'stable' && particle.bookTargetPosition) {
      const time = Date.now() * 0.001;
      const wobbleX = Math.sin(time * 2 + particle.id * 0.1) * 0.5;
      const wobbleY = Math.cos(time * 1.5 + particle.id * 0.15) * 0.3;
      totalForce.x += wobbleX * 0.01;
      totalForce.y += wobbleY * 0.01;
    }
    
    // 力场影响
    this.forceFields.forEach(field => {
      const dx = field.position.x - particle.position.x;
      const dy = field.position.y - particle.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < field.radius) {
        const normalizedDistance = distance / field.radius;
        const forceMagnitude = field.strength * (1 - normalizedDistance) / particle.mass;
        
        if (field.type === 'repel') {
          totalForce.x -= (dx / distance) * forceMagnitude;
          totalForce.y -= (dy / distance) * forceMagnitude;
        } else {
          totalForce.x += (dx / distance) * forceMagnitude;
          totalForce.y += (dy / distance) * forceMagnitude;
        }
      }
    });
    
    // 阻尼力
    const damping = 0.98;
    totalForce.x += -particle.velocity.x * (1 - damping);
    totalForce.y += -particle.velocity.y * (1 - damping);
    
    // 边界约束
    if (this.canvas) {
      const margin = 50;
      if (particle.position.x < margin) {
        totalForce.x += (margin - particle.position.x) * 0.01;
      }
      if (particle.position.x > this.canvas.width - margin) {
        totalForce.x += (this.canvas.width - margin - particle.position.x) * 0.01;
      }
      if (particle.position.y < margin) {
        totalForce.y += (margin - particle.position.y) * 0.01;
      }
      if (particle.position.y > this.canvas.height - margin) {
        totalForce.y += (this.canvas.height - margin - particle.position.y) * 0.01;
      }
    }
    
    return totalForce;
  }

  /**
   * 更新粒子物理状态
   */
  public updatePhysics(deltaTime: number): void {
    this.particles.forEach(particle => {
      // 计算受力
      const force = this.calculateForces(particle);
      
      // 更新加速度
      particle.acceleration.x = force.x;
      particle.acceleration.y = force.y;
      
      // 更新速度
      particle.velocity.x += particle.acceleration.x * deltaTime;
      particle.velocity.y += particle.acceleration.y * deltaTime;
      
      // 限制最大速度
      const maxSpeed = 5;
      const speed = Math.sqrt(particle.velocity.x ** 2 + particle.velocity.y ** 2);
      if (speed > maxSpeed) {
        particle.velocity.x = (particle.velocity.x / speed) * maxSpeed;
        particle.velocity.y = (particle.velocity.y / speed) * maxSpeed;
      }
      
      // 更新位置
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      
      // 更新生命周期
      particle.life = (particle.life + deltaTime) % particle.maxLife;
      
      // 更新透明度（基于生命周期和距离目标的远近）
      if (particle.isBookParticle && particle.bookTargetPosition) {
        const dx = particle.bookTargetPosition.x - particle.position.x;
        const dy = particle.bookTargetPosition.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        particle.opacity = Math.max(0.2, 1 - distance / 200);
      } else {
        particle.opacity = 0.3 + Math.sin(particle.life * 0.05) * 0.2;
      }
    });
  }

  /**
   * 触发书本翻页动画
   */
  public triggerPageFlip(): void {
    const bookParticles = this.particles.filter(p => p.isBookParticle);
    const halfCount = Math.floor(bookParticles.length / 2);
    
    // 左半部分粒子向左移动
    bookParticles.slice(0, halfCount).forEach((particle, index) => {
      if (particle.bookTargetPosition) {
        particle.bookTargetPosition.x -= 50 + index * 2;
        particle.velocity.x -= 2;
        particle.animationPhase = 'dispersing';
      }
    });
    
    // 右半部分粒子向右移动
    bookParticles.slice(halfCount).forEach((particle, index) => {
      if (particle.bookTargetPosition) {
        particle.bookTargetPosition.x += 50 + index * 2;
        particle.velocity.x += 2;
        particle.animationPhase = 'dispersing';
      }
    });
    
    // 3秒后重新聚合
    setTimeout(() => {
      this.generateBookShape();
      bookParticles.forEach((particle, index) => {
        if (index < this.bookShape.length) {
          particle.bookTargetPosition = this.bookShape[index];
          particle.animationPhase = 'converging';
        }
      });
    }, 3000);
  }

  /**
   * 获取所有粒子
   */
  public getParticles(): Particle[] {
    return this.particles;
  }

  /**
   * 调整粒子数量（性能优化）
   */
  public adjustParticleCount(newCount: number): void {
    if (newCount < this.particles.length) {
      this.particles = this.particles.slice(0, newCount);
    } else {
      const currentCount = this.particles.length;
      const colors = ['#00C2FF', '#18FF92', '#8B5CF6', '#FF66C4'];
      
      for (let i = currentCount; i < newCount; i++) {
        const particle: Particle = {
          id: i,
          position: {
            x: Math.random() * (this.canvas?.width || 800),
            y: Math.random() * (this.canvas?.height || 600)
          },
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
          },
          acceleration: { x: 0, y: 0 },
          originalPosition: { x: 0, y: 0 },
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 50,
          size: 1 + Math.random() * 1.5,
          opacity: 0.3 + Math.random() * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          mass: 0.5 + Math.random() * 1.5,
          isBookParticle: false,
          animationPhase: 'stable'
        };
        
        particle.originalPosition = { ...particle.position };
        this.particles.push(particle);
      }
    }
  }

  /**
   * 重置粒子系统
   */
  public reset(): void {
    this.particles.forEach(particle => {
      particle.position = { ...particle.originalPosition };
      particle.velocity = { x: 0, y: 0 };
      particle.acceleration = { x: 0, y: 0 };
      particle.animationPhase = 'converging';
    });
    this.clearForceFields();
  }
}

// 性能监控工具
export class PerformanceMonitor {
  private frameCount = 0;
  private fps = 60;
  private lastTime = 0;
  private fpsCallback?: (fps: number) => void;

  public startMonitoring(callback?: (fps: number) => void): void {
    this.fpsCallback = callback;
    this.lastTime = performance.now();
    this.frameCount = 0;
    
    const monitor = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - this.lastTime >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        if (this.fpsCallback) {
          this.fpsCallback(this.fps);
        }
      }
      
      requestAnimationFrame(monitor);
    };
    
    requestAnimationFrame(monitor);
  }

  public getFPS(): number {
    return this.fps;
  }
}
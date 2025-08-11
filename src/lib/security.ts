import { createHash, createHmac, randomBytes, timingSafeEqual, scrypt } from 'crypto';
import { promisify } from 'util';
import { NextRequest } from 'next/server';

const scryptAsync = promisify(scrypt);

// 安全配置
export const SecurityConfig = {
  // 密码配置
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12
  },
  
  // JWT配置
  jwt: {
    algorithm: 'HS256',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    issuer: 'college-rescue-guide',
    audience: 'client'
  },
  
  // 加密配置
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },
  
  // 安全头配置
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
};

// 密码安全工具
export class PasswordSecurity {
  // 密码强度检查
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    // 长度检查
    if (password.length < SecurityConfig.password.minLength) {
      feedback.push(`密码长度至少${SecurityConfig.password.minLength}位`);
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }
    
    // 字符类型检查
    if (SecurityConfig.password.requireUppercase && !/[A-Z]/.test(password)) {
      feedback.push('密码必须包含大写字母');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }
    
    if (SecurityConfig.password.requireLowercase && !/[a-z]/.test(password)) {
      feedback.push('密码必须包含小写字母');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }
    
    if (SecurityConfig.password.requireNumbers && !/[0-9]/.test(password)) {
      feedback.push('密码必须包含数字');
    } else if (/[0-9]/.test(password)) {
      score += 1;
    }
    
    if (SecurityConfig.password.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('密码必须包含特殊字符');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    }
    
    // 复杂度检查
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) {
      score += 1;
    }
    
    // 常见密码检查
    const commonPasswords = [
      'password', '123456', 'qwerty', 'abc123', 'password123',
      '12345678', 'welcome', 'admin', 'letmein', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      feedback.push('不能使用常见密码');
      score = 0;
    }
    
    return {
      isValid: feedback.length === 0 && score >= 4,
      score: Math.min(score, 5),
      feedback
    };
  }
  
  // 安全密码哈希
  static async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(32).toString('hex');
    const hash = await scryptAsync(password, salt, 64) as Buffer;
    return `${salt}:${hash.toString('hex')}`;
  }
  
  // 密码验证
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [salt, hash] = hashedPassword.split(':');
    const hashBuffer = Buffer.from(hash, 'hex');
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    return timingSafeEqual(hashBuffer, derivedKey);
  }
}

// 输入验证和净化
export class InputValidation {
  // SQL注入防护
  static sanitizeSQL(input: string): string {
    return input
      .replace(/[\x00\x08\x09\x1a\n\r"'\\%]/g, (char) => {
        switch (char) {
          case '\x00': return '\\0';
          case '\x08': return '\\b';
          case '\x09': return '\\t';
          case '\x1a': return '\\z';
          case '\n': return '\\n';
          case '\r': return '\\r';
          case '"':
          case "'":
          case '\\':
          case '%': return '\\' + char;
        }
        return char;
      });
  }
  
  // XSS防护
  static sanitizeHTML(input: string): string {
    const entityMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return input.replace(/[&<>"'`=/]/g, (s) => entityMap[s]);
  }
  
  // NoSQL注入防护
  static sanitizeNoSQL(input: unknown): unknown {
    if (typeof input === 'string') {
      // 移除可能的NoSQL操作符
      return input.replace(/\$[\w]+/g, '');
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const key in input) {
        if (!key.startsWith('$')) { // 过滤NoSQL操作符
          sanitized[key] = this.sanitizeNoSQL((input as Record<string, unknown>)[key]);
        }
      }
      return sanitized;
    }
    
    return input;
  }
  
  // 邮箱验证
  static validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email) && email.length <= 254;
  }
  
  // 手机号验证
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/; // 中国手机号格式
    return phoneRegex.test(phone);
  }
  
  // URL验证
  static validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}

// 请求签名验证
export class RequestSigning {
  private static getSigningKey(): string {
    return process.env.REQUEST_SIGNING_KEY || 'default-signing-key-please-change';
  }
  
  // 生成请求签名
  static generateSignature(
    method: string,
    path: string,
    body: string,
    timestamp: number,
    nonce: string
  ): string {
    const key = this.getSigningKey();
    const message = `${method}\n${path}\n${body}\n${timestamp}\n${nonce}`;
    
    return createHmac('sha256', key)
      .update(message)
      .digest('base64');
  }
  
  // 验证请求签名
  static verifySignature(
    request: NextRequest,
    body: string
  ): { isValid: boolean; error?: string } {
    const signature = request.headers.get('X-Signature');
    const timestamp = request.headers.get('X-Timestamp');
    const nonce = request.headers.get('X-Nonce');
    
    if (!signature || !timestamp || !nonce) {
      return { isValid: false, error: '缺少必要的签名头' };
    }
    
    // 检查时间戳（防止重放攻击）
    const now = Date.now();
    const requestTime = parseInt(timestamp);
    const maxAge = 5 * 60 * 1000; // 5分钟
    
    if (Math.abs(now - requestTime) > maxAge) {
      return { isValid: false, error: '请求时间戳过期' };
    }
    
    // 验证签名
    const expectedSignature = this.generateSignature(
      request.method,
      request.nextUrl.pathname,
      body,
      requestTime,
      nonce
    );
    
    const isValid = timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    
    return { isValid, error: isValid ? undefined : '签名验证失败' };
  }
}

// 安全审计日志
export class SecurityAuditLog {
  private static logs: any[] = [];
  
  // 记录安全事件
  static logSecurityEvent(
    event: string,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userId?: string,
    ip?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: DataEncryption.maskSensitiveData(details),
      userId,
      ip,
      id: randomBytes(16).toString('hex')
    };
    
    this.logs.push(logEntry);
    
    // 保持最近1000条日志
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // 关键事件立即记录到外部系统
    if (severity === 'critical') {
      console.error('安全关键事件:', logEntry);
      // 这里可以集成外部日志系统或告警系统
    }
  }
  
  // 获取审计日志
  static getAuditLogs(filter?: {
    startTime?: Date;
    endTime?: Date;
    severity?: string;
    userId?: string;
    event?: string;
  }): any[] {
    let filteredLogs = this.logs;
    
    if (filter) {
      filteredLogs = this.logs.filter(log => {
        if (filter.startTime && new Date(log.timestamp) < filter.startTime) return false;
        if (filter.endTime && new Date(log.timestamp) > filter.endTime) return false;
        if (filter.severity && log.severity !== filter.severity) return false;
        if (filter.userId && log.userId !== filter.userId) return false;
        if (filter.event && !log.event.includes(filter.event)) return false;
        return true;
      });
    }
    
    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }
}

// CSRF保护
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();
  
  // 生成CSRF令牌
  static generateToken(sessionId: string): string {
    const token = randomBytes(32).toString('hex');
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24小时
    
    this.tokens.set(sessionId, { token, expires });
    
    return token;
  }
  
  // 验证CSRF令牌
  static verifyToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);
    
    if (!stored) return false;
    if (Date.now() > stored.expires) {
      this.tokens.delete(sessionId);
      return false;
    }
    
    return timingSafeEqual(
      Buffer.from(token),
      Buffer.from(stored.token)
    );
  }
}

// 数据加密工具
export class DataEncryption {
  private static getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY || 'default-encryption-key-please-change-in-production';
    return createHash('sha256').update(key).digest();
  }
  
  // 敏感数据脱敏
  static maskSensitiveData(data: any, fields: string[] = ['password', 'token', 'key']): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const masked = { ...data };
    
    for (const field of fields) {
      if (field in masked) {
        const value = masked[field];
        if (typeof value === 'string' && value.length > 4) {
          masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
        } else {
          masked[field] = '***';
        }
      }
    }
    
    return masked;
  }
}

// 安全中间件工厂
export function createSecurityMiddleware() {
  return {
    // 安全头中间件
    securityHeaders: (response: Response) => {
      Object.entries(SecurityConfig.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    },
    
    // 输入验证中间件
    validateInput: (data: any, rules: any) => {
      const errors: string[] = [];
      
      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: InputValidation.sanitizeNoSQL(data)
      };
    },
    
    // 请求签名验证中间件
    verifySignature: (request: NextRequest, body: string) => {
      return RequestSigning.verifySignature(request, body);
    }
  };
}

// 导出安全工具实例
export const securityMiddleware = createSecurityMiddleware();